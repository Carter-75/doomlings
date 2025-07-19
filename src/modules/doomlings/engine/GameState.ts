// Complete Doomlings Game State Management
// Implements Master Spec Requirements 7, 8, 9, 10, 11, 12, 17, 24

import { Card, AgeCard, CatastropheCard, BirthOfLifeCard } from '../types/Card';

export interface GameState {
  // Game Metadata
  gameId: string;
  seed: number; // Deterministic randomness seed
  version: string;
  timestamp: Date;
  
  // Player Management
  players: Player[];
  currentPlayerIndex: number;
  turnNumber: number;
  
  // Game Phase
  phase: GamePhase;
  round: number;
  
  // Decks and Cards
  traitDeck: Card[];
  ageDeck: (AgeCard | CatastropheCard | BirthOfLifeCard)[];
  discardPile: Card[];
  
  // Age System
  currentAge: AgeCard | CatastropheCard | BirthOfLifeCard | null;
  ageHistory: (AgeCard | CatastropheCard | BirthOfLifeCard)[];
  catastropheCount: number;
  
  // Game Configuration
  config: GameConfig;
  
  // Effect Systems
  activeEffects: ActiveEffect[];
  effectQueue: QueuedEffect[];
  
  // Game Status
  status: 'setup' | 'playing' | 'world_end' | 'finished';
  worldEndTriggered: boolean;
  winner?: Player;
  finalScores?: PlayerScore[];
  
  // Deterministic Event Log
  eventLog: GameEvent[];
  stateSnapshots: StateSnapshot[];
}

export interface Player {
  id: string;
  name: string;
  socketId?: string;
  
  // Core Player State
  hand: Card[];
  traitPile: Card[];
  genePool: number;
  
  // Counters and Status
  dominantCount: number;
  passedTurns: number;
  skippedStabilizations: number;
  
  // Flags
  hasEmptyHand: boolean;
  skipNextPlay: boolean;
  skipNextStabilize: boolean;
  
  // Scoring
  currentScore: number;
  scoreBreakdown: ScoreBreakdown;
  
  // Real-time Status
  connected: boolean;
  ready: boolean;
  lastAction: Date;
}

export interface GameConfig {
  // Player Setup
  minPlayers: 2;
  maxPlayers: 6;
  
  // Expansions (Req 3, 22)
  enabledExpansions: {
    base: true;
    upgrade: boolean;
    imaginaryEnds: boolean;
    overlush: boolean;
    shadowPuppets: boolean;
    legendsEnderas: boolean;
    promos: boolean;
  };
  
  // Age Deck Configuration (Req 6, 26)
  catastropheSpacing: 'standard' | 'custom'; // Standard = 3 spaced piles
  catastropheCount: number; // Default 3
  guaranteeFinalCatastrophe: boolean;
  extendedFourthPile: boolean; // House rule variant
  
  // House Rules (Req 26)
  emptyHandDrawRule: 3 | 5; // Cards to draw on empty hand
  draftStartEnabled: boolean;
  alternateGenePoolCap: number | null; // Custom Gene Pool maximum
  additionalCatastrophesPerMode: number; // Extra catastrophes for variants
  
  // Game Flow Options
  turnTimeLimit?: number; // Seconds, null = unlimited
  reconnectionGracePeriod: number; // Seconds
  spectatorMode: boolean;
  
  // Advanced Settings
  deterministicMode: boolean; // Use fixed seed for testing
  debugMode: boolean; // Enable verbose logging
  telemetryEnabled: boolean;
}

export type GamePhase = 
  | 'setup'
  | 'birth_of_life'
  | 'age_reveal'
  | 'start_of_turn'
  | 'empty_hand_check'
  | 'trait_play'
  | 'effect_resolution'
  | 'additional_plays'
  | 'stabilize'
  | 'end_of_turn'
  | 'catastrophe_resolution'
  | 'world_end_scoring'
  | 'finished';

export interface ActiveEffect {
  id: string;
  sourceCardId: string;
  type: string;
  value: any;
  target: string[];
  duration: 'instant' | 'end_turn' | 'end_round' | 'permanent' | 'world_end';
  stackable: boolean;
  priority: number;
  appliedAt: number; // Turn number
}

export interface QueuedEffect {
  id: string;
  sourceCardId: string;
  playerId: string;
  effect: any;
  priority: number;
  timestamp: number;
  resolved: boolean;
}

export interface ScoreBreakdown {
  faceValue: number;
  dominantBonuses: number;
  colorBonuses: number;
  varietyBonuses: number;
  speciesBonuses: number;
  treasureBonuses: number;
  worldEndBonuses: number;
  penaltyPoints: number;
  total: number;
}

export interface PlayerScore extends ScoreBreakdown {
  playerId: string;
  playerName: string;
  rank: number;
  tiebreaker?: string;
}

// Game Events for Deterministic Replay (Req 24)
export interface GameEvent {
  id: string;
  timestamp: number;
  turn: number;
  phase: GamePhase;
  playerId?: string;
  type: GameEventType;
  data: any;
  seed?: number; // RNG seed at event time
}

export type GameEventType = 
  | 'game_start'
  | 'player_join'
  | 'player_leave' 
  | 'age_reveal'
  | 'catastrophe_reveal'
  | 'card_play'
  | 'card_draw'
  | 'card_discard'
  | 'stabilize'
  | 'effect_trigger'
  | 'gene_pool_change'
  | 'turn_start'
  | 'turn_end'
  | 'round_start'
  | 'round_end'
  | 'world_end'
  | 'game_end';

export interface StateSnapshot {
  turn: number;
  timestamp: number;
  stateHash: string;
  compressedState: string; // JSON.stringify + compression
}

// Turn Flow State Machine (Req 8)
export interface TurnFlowContext {
  currentPlayer: Player;
  phase: GamePhase;
  canProgress: boolean;
  pendingEffects: QueuedEffect[];
  phaseData?: {
    drewCards?: number;
    playedCards?: Card[];
    discardedCards?: Card[];
    genePoolChanges?: number;
    effectsTriggered?: string[];
  };
}

// Age Deck Construction State (Req 6, 7)
export interface AgeDeckConstruction {
  birthOfLife: BirthOfLifeCard;
  normalAges: AgeCard[];
  catastrophes: CatastropheCard[];
  constructedDeck: (AgeCard | CatastropheCard | BirthOfLifeCard)[];
  pileConfiguration: {
    pile1: (AgeCard | CatastropheCard)[];
    pile2: (AgeCard | CatastropheCard)[];
    pile3: (AgeCard | CatastropheCard)[];
    pile4?: (AgeCard | CatastropheCard)[]; // Extended variant
  };
}

// World's End Scoring Context (Req 17)
export interface WorldEndScoringContext {
  triggered: boolean;
  triggerSource: 'third_catastrophe' | 'custom_rule' | 'manual';
  scoringOrder: string[]; // Player IDs in scoring order
  scoringEvents: ScoringEvent[];
  finalRanking: PlayerScore[];
  tiebreakers: TiebreakerResult[];
}

export interface ScoringEvent {
  step: number;
  type: 'face_value' | 'continuous_modifier' | 'conditional_bonus' | 'penalty' | 'tiebreaker';
  playerId: string;
  points: number;
  source: string;
  description: string;
}

export interface TiebreakerResult {
  playerId: string;
  criterion: string;
  value: number | string;
  rank: number;
}

export default GameState;