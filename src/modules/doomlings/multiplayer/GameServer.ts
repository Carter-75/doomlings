// Doomlings Multiplayer Game Server - Authoritative State Management
// Implements Master Spec Requirements 24, 25, 30, 32

import { GameState, Player, GameConfig } from '../engine/GameState';
import RulesEngine from '../engine/RulesEngine';
import CardDatabase from '../data/CardDatabase';
import AgeDeckBuilder from '../engine/AgeDeckBuilder';
import { DoomlingsPRNG } from '../utils/DeterministicRandom';
import { createHash } from 'crypto';

export interface GameServerConfig {
  maxConcurrentGames: number;
  turnTimeoutMs: number;
  reconnectionGracePeriodMs: number;
  snapshotIntervalMs: number;
  enableTelemetry: boolean;
  rateLimitConfig: {
    roomCreationPerHour: number;
    actionsPerMinute: number;
  };
}

export interface GameRoom {
  id: string;
  gameState: GameState;
  rulesEngine: RulesEngine;
  hostPlayerId: string;
  createdAt: Date;
  lastActivity: Date;
  spectators: string[];
  
  // Real-time management
  connectedPlayers: Map<string, string>; // playerId -> socketId
  pendingReconnections: Map<string, Date>; // playerId -> disconnectTime
  
  // Performance tracking
  averageResponseTime: number;
  totalActions: number;
  desyncCount: number;
}

export class DoomlingGameServer {
  private games: Map<string, GameRoom>;
  private playerGameMap: Map<string, string>; // playerId -> gameId
  private cardDatabase: CardDatabase;
  private config: GameServerConfig;
  private telemetryData: Map<string, any>;

  constructor(config: GameServerConfig) {
    this.games = new Map();
    this.playerGameMap = new Map();
    this.cardDatabase = CardDatabase.getInstance();
    this.config = config;
    this.telemetryData = new Map();
    
    // Start background processes
    this.startSnapshotScheduler();
    this.startCleanupScheduler();
  }

  // GAME CREATION AND MANAGEMENT
  async createGame(hostPlayerId: string, gameConfig: GameConfig): Promise<string> {
    if (this.games.size >= this.config.maxConcurrentGames) {
      throw new Error('Server at maximum capacity');
    }

    const gameId = this.generateGameId();
    const seed = Math.floor(Math.random() * 1000000);
    
    // Initialize game state
    const gameState: GameState = {
      gameId,
      seed,
      version: '1.0.0',
      timestamp: new Date(),
      players: [],
      currentPlayerIndex: 0,
      turnNumber: 0,
      phase: 'setup',
      round: 0,
      traitDeck: [],
      ageDeck: [],
      discardPile: [],
      currentAge: null,
      ageHistory: [],
      catastropheCount: 0,
      config: gameConfig,
      activeEffects: [],
      effectQueue: [],
      status: 'setup',
      worldEndTriggered: false,
      eventLog: [],
      stateSnapshots: []
    };

    // Initialize rules engine
    const rulesEngine = new RulesEngine(seed);

    // Setup card decks based on enabled expansions
    await this.setupGameDecks(gameState);

    // Create game room
    const gameRoom: GameRoom = {
      id: gameId,
      gameState,
      rulesEngine,
      hostPlayerId,
      createdAt: new Date(),
      lastActivity: new Date(),
      spectators: [],
      connectedPlayers: new Map(),
      pendingReconnections: new Map(),
      averageResponseTime: 0,
      totalActions: 0,
      desyncCount: 0
    };

    this.games.set(gameId, gameRoom);
    
    // Initialize telemetry
    this.initializeTelemetry(gameId);
    
    return gameId;
  }

  // PLAYER MANAGEMENT
  async addPlayerToGame(gameId: string, playerId: string, playerName: string, socketId: string): Promise<GameState> {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      throw new Error('Game not found');
    }

    if (gameRoom.gameState.status !== 'setup') {
      throw new Error('Game already started');
    }

    if (gameRoom.gameState.players.length >= gameRoom.gameState.config.maxPlayers) {
      throw new Error('Game is full');
    }

    // Check if player already in game
    if (gameRoom.gameState.players.find(p => p.id === playerId)) {
      throw new Error('Player already in game');
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      socketId,
      hand: [],
      traitPile: [],
      genePool: 5, // Default starting value, will be set by Birth of Life
      dominantCount: 0,
      passedTurns: 0,
      skippedStabilizations: 0,
      hasEmptyHand: false,
      skipNextPlay: false,
      skipNextStabilize: false,
      currentScore: 0,
      scoreBreakdown: {
        faceValue: 0,
        dominantBonuses: 0,
        colorBonuses: 0,
        varietyBonuses: 0,
        speciesBonuses: 0,
        treasureBonuses: 0,
        worldEndBonuses: 0,
        penaltyPoints: 0,
        total: 0
      },
      connected: true,
      ready: false,
      lastAction: new Date()
    };

    gameRoom.gameState.players.push(newPlayer);
    gameRoom.connectedPlayers.set(playerId, socketId);
    this.playerGameMap.set(playerId, gameId);
    
    this.logGameEvent(gameRoom, 'player_join', { playerId, playerName });
    this.updateTelemetry(gameId, 'player_joined');
    
    return gameRoom.gameState;
  }

  // GAME FLOW CONTROL
  async startGame(gameId: string): Promise<GameState> {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      throw new Error('Game not found');
    }

    if (gameRoom.gameState.players.length < gameRoom.gameState.config.minPlayers) {
      throw new Error('Not enough players');
    }

    if (!gameRoom.gameState.players.every(p => p.ready)) {
      throw new Error('Not all players are ready');
    }

    // Start the game
    gameRoom.gameState.status = 'playing';
    gameRoom.gameState.phase = 'birth_of_life';
    
    // Execute first turn (Birth of Life reveal)
    gameRoom.gameState = await gameRoom.rulesEngine.executeTurnFlow(gameRoom.gameState);
    
    this.logGameEvent(gameRoom, 'game_start', {
      playerCount: gameRoom.gameState.players.length,
      expansions: Object.entries(gameRoom.gameState.config.enabledExpansions)
        .filter(([_, enabled]) => enabled)
        .map(([expansion, _]) => expansion)
    });
    
    this.updateTelemetry(gameId, 'game_started');
    return gameRoom.gameState;
  }

  // PLAYER ACTIONS
  async processPlayerAction(
    gameId: string, 
    playerId: string, 
    action: PlayerAction,
    socketId: string
  ): Promise<GameActionResult> {
    const startTime = Date.now();
    const gameRoom = this.games.get(gameId);
    
    if (!gameRoom) {
      throw new Error('Game not found');
    }

    // Validate player and connection
    if (!this.validatePlayerAction(gameRoom, playerId, action, socketId)) {
      throw new Error('Invalid action or player not authorized');
    }

    // Process the action
    const result = await this.executePlayerAction(gameRoom, playerId, action);
    
    // Update performance metrics
    const responseTime = Date.now() - startTime;
    this.updateResponseTime(gameRoom, responseTime);
    
    // Log action for replay system
    this.logGameEvent(gameRoom, 'card_play', {
      playerId,
      action: action.type,
      data: action.data,
      responseTime
    });

    this.updateTelemetry(gameId, 'action_processed', { responseTime });
    return result;
  }

  // RECONNECTION HANDLING
  async handlePlayerReconnection(gameId: string, playerId: string, socketId: string): Promise<GameState> {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      throw new Error('Game not found');
    }

    // Update socket connection
    gameRoom.connectedPlayers.set(playerId, socketId);
    gameRoom.pendingReconnections.delete(playerId);
    
    // Mark player as connected
    const player = gameRoom.gameState.players.find(p => p.id === playerId);
    if (player) {
      player.connected = true;
      player.socketId = socketId;
    }

    this.logGameEvent(gameRoom, 'player_reconnect', { playerId });
    this.updateTelemetry(gameId, 'player_reconnected');

    return gameRoom.gameState;
  }

  async handlePlayerDisconnection(gameId: string, playerId: string): Promise<void> {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) return;

    // Mark player as disconnected
    const player = gameRoom.gameState.players.find(p => p.id === playerId);
    if (player) {
      player.connected = false;
    }

    // Start grace period for reconnection
    gameRoom.pendingReconnections.set(playerId, new Date());
    gameRoom.connectedPlayers.delete(playerId);

    this.logGameEvent(gameRoom, 'player_disconnect', { playerId });
    this.updateTelemetry(gameId, 'player_disconnected');

    // Check if game should be paused or ended
    const connectedPlayers = gameRoom.gameState.players.filter(p => p.connected);
    if (connectedPlayers.length === 0) {
      // All players disconnected - pause game
      this.pauseGame(gameId);
    }
  }

  // STATE SYNCHRONIZATION
  async syncGameState(gameId: string, playerId: string): Promise<GameStateSyncData> {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      throw new Error('Game not found');
    }

    const player = gameRoom.gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not in game');
    }

    // Return player-specific view of game state
    return {
      gameState: this.getPlayerGameView(gameRoom.gameState, playerId),
      stateHash: this.generateStateHash(gameRoom.gameState),
      lastEventId: gameRoom.gameState.eventLog[gameRoom.gameState.eventLog.length - 1]?.id,
      serverTimestamp: Date.now()
    };
  }

  // DECK SETUP
  private async setupGameDecks(gameState: GameState): Promise<void> {
    // Get cards for enabled expansions
    const enabledExpansions = Object.entries(gameState.config.enabledExpansions)
      .filter(([_, enabled]) => enabled)
      .map(([expansion, _]) => expansion);

    const allCards = this.cardDatabase.getAllCards(enabledExpansions);
    
    // Separate card types
    const traitCards = allCards.filter(card => 
      card.type === 'trait' || card.type === 'dominant' || card.type === 'treasure'
    );
    const ageCards = allCards.filter(card => card.type === 'age');
    const catastropheCards = allCards.filter(card => card.type === 'catastrophe');
    const birthOfLifeCard = allCards.find(card => card.type === 'birth_of_life');

    if (!birthOfLifeCard) {
      throw new Error('Birth of Life card not found');
    }

    // Build Age deck
    const ageDeckBuilder = new AgeDeckBuilder(gameState.seed);
    const ageDeckConstruction = ageDeckBuilder.buildAgeDeck(
      ageCards as any[],
      catastropheCards as any[],
      birthOfLifeCard as any,
      gameState.config
    );

    // Shuffle trait deck
    const prng = new DoomlingsPRNG(gameState.seed);
    gameState.traitDeck = prng.shuffle([...traitCards]);
    gameState.ageDeck = ageDeckConstruction.constructedDeck;
  }

  // UTILITY METHODS
  private generateGameId(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  private validatePlayerAction(
    gameRoom: GameRoom, 
    playerId: string, 
    action: PlayerAction,
    socketId: string
  ): boolean {
    // Validate player exists and is connected
    const connectedSocketId = gameRoom.connectedPlayers.get(playerId);
    if (connectedSocketId !== socketId) {
      return false;
    }

    // Validate player is in game
    const player = gameRoom.gameState.players.find(p => p.id === playerId);
    if (!player) {
      return false;
    }

    // Validate it's player's turn (for most actions)
    if (action.requiresPlayerTurn) {
      const currentPlayer = gameRoom.gameState.players[gameRoom.gameState.currentPlayerIndex];
      if (currentPlayer.id !== playerId) {
        return false;
      }
    }

    return true;
  }

  private async executePlayerAction(
    gameRoom: GameRoom,
    playerId: string,
    action: PlayerAction
  ): Promise<GameActionResult> {
    const oldStateHash = this.generateStateHash(gameRoom.gameState);
    
    try {
      switch (action.type) {
        case 'play_card':
          gameRoom.gameState = await this.processCardPlay(gameRoom, playerId, action.data.cardId);
          break;
        case 'end_turn':
          gameRoom.gameState = await gameRoom.rulesEngine.executeTurnFlow(gameRoom.gameState);
          break;
        case 'choose_discard':
          gameRoom.gameState = await this.processDiscardChoice(gameRoom, playerId, action.data.cardIds);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
      
      const newStateHash = this.generateStateHash(gameRoom.gameState);
      
      return {
        success: true,
        gameState: gameRoom.gameState,
        stateChanged: oldStateHash !== newStateHash,
        events: gameRoom.gameState.eventLog.slice(-10) // Last 10 events
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        gameState: gameRoom.gameState,
        stateChanged: false,
        events: []
      };
    }
  }

  // BACKGROUND PROCESSES
  private startSnapshotScheduler(): void {
    setInterval(() => {
      this.createStateSnapshots();
    }, this.config.snapshotIntervalMs);
  }

  private startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanupInactiveGames();
      this.processReconnectionTimeouts();
    }, 60000); // Every minute
  }

  private createStateSnapshots(): void {
    for (const [gameId, gameRoom] of this.games) {
      if (gameRoom.gameState.status === 'playing') {
        const snapshot = {
          turn: gameRoom.gameState.turnNumber,
          timestamp: Date.now(),
          stateHash: this.generateStateHash(gameRoom.gameState),
          compressedState: JSON.stringify(gameRoom.gameState) // TODO: Add compression
        };
        
        gameRoom.gameState.stateSnapshots.push(snapshot);
        
        // Keep only last 50 snapshots
        if (gameRoom.gameState.stateSnapshots.length > 50) {
          gameRoom.gameState.stateSnapshots.shift();
        }
      }
    }
  }

  // HELPER METHODS (Stub implementations - would be fully implemented)
  private processCardPlay(gameRoom: GameRoom, playerId: string, cardId: string): Promise<GameState> {
    // Implementation would validate and process card play
    return Promise.resolve(gameRoom.gameState);
  }

  private processDiscardChoice(gameRoom: GameRoom, playerId: string, cardIds: string[]): Promise<GameState> {
    // Implementation would process discard choices during stabilization
    return Promise.resolve(gameRoom.gameState);
  }

  private logGameEvent(gameRoom: GameRoom, type: string, data: any): void {
    gameRoom.gameState.eventLog.push({
      id: `${gameRoom.id}-${gameRoom.gameState.eventLog.length}`,
      timestamp: Date.now(),
      turn: gameRoom.gameState.turnNumber,
      phase: gameRoom.gameState.phase,
      playerId: data.playerId,
      type: type as any,
      data,
      seed: gameRoom.rulesEngine['prng']?.getSeed()
    });
  }

  private generateStateHash(gameState: GameState): string {
    // Generate deterministic hash of game state for desync detection
    const stateString = JSON.stringify(gameState, null, 0);
    return require('crypto').createHash('sha256').update(stateString).digest('hex');
  }

  private getPlayerGameView(gameState: GameState, playerId: string): Partial<GameState> {
    // Return sanitized view of game state for specific player
    return {
      ...gameState,
      players: gameState.players.map(p => ({
        ...p,
        hand: p.id === playerId ? p.hand : [] // Hide other players' hands
      }))
    };
  }

  private updateResponseTime(gameRoom: GameRoom, responseTime: number): void {
    gameRoom.totalActions++;
    gameRoom.averageResponseTime = 
      (gameRoom.averageResponseTime * (gameRoom.totalActions - 1) + responseTime) / gameRoom.totalActions;
  }

  private initializeTelemetry(gameId: string): void {
    this.telemetryData.set(gameId, {
      startTime: Date.now(),
      playerJoins: 0,
      actionsProcessed: 0,
      averageResponseTime: 0,
      reconnections: 0,
      disconnections: 0
    });
  }

  private updateTelemetry(gameId: string, event: string, data?: any): void {
    const telemetry = this.telemetryData.get(gameId);
    if (telemetry) {
      switch (event) {
        case 'player_joined':
          telemetry.playerJoins++;
          break;
        case 'action_processed':
          telemetry.actionsProcessed++;
          if (data?.responseTime) {
            telemetry.averageResponseTime = 
              (telemetry.averageResponseTime * (telemetry.actionsProcessed - 1) + data.responseTime) / 
              telemetry.actionsProcessed;
          }
          break;
        case 'player_reconnected':
          telemetry.reconnections++;
          break;
        case 'player_disconnected':
          telemetry.disconnections++;
          break;
      }
    }
  }

  // Additional methods would be implemented...
  private pauseGame(gameId: string): void {}
  private cleanupInactiveGames(): void {}
  private processReconnectionTimeouts(): void {}

  // PUBLIC API
  getGame(gameId: string): GameRoom | undefined {
    return this.games.get(gameId);
  }

  getAllGames(): GameRoom[] {
    return Array.from(this.games.values());
  }

  getGameByPlayerId(playerId: string): GameRoom | undefined {
    const gameId = this.playerGameMap.get(playerId);
    return gameId ? this.games.get(gameId) : undefined;
  }

  getTelemetryData(): Map<string, any> {
    return this.telemetryData;
  }
}

// INTERFACES
export interface PlayerAction {
  type: 'play_card' | 'end_turn' | 'choose_discard' | 'pass' | 'ready';
  data: any;
  requiresPlayerTurn: boolean;
}

export interface GameActionResult {
  success: boolean;
  gameState: GameState;
  stateChanged: boolean;
  events: any[];
  error?: string;
}

export interface GameStateSyncData {
  gameState: Partial<GameState>;
  stateHash: string;
  lastEventId?: string;
  serverTimestamp: number;
}

export default DoomlingGameServer;