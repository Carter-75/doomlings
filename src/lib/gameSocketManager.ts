// Simple wrapper that uses Vercel API for multiplayer sync
import VercelGameManager from './vercelGameManager';

class GameSocketManager {
  private static instance: GameSocketManager;
  private vercelManager: VercelGameManager;

  private constructor() {
    this.vercelManager = new VercelGameManager();
  }

  static getInstance(): GameSocketManager {
    if (!GameSocketManager.instance) {
      GameSocketManager.instance = new GameSocketManager();
    }
    return GameSocketManager.instance;
  }

  async connect(): Promise<VercelGameManager> {
    await this.vercelManager.connect();
    console.log('✅ Connected to multiplayer service!');
    return this.vercelManager;
  }

  async registerPlayer(playerName: string): Promise<string> {
    return this.vercelManager.registerPlayer(playerName);
  }

  async createRoom(data: any) {
    return this.vercelManager.createRoom(data);
  }

  async joinRoom(roomId: string, password?: string) {
    return this.vercelManager.joinRoom(roomId, password);
  }

  async quickMatch(maxPlayers: number) {
    return this.vercelManager.quickMatch(maxPlayers);
  }

  async setPlayerReady(roomId: string, ready: boolean) {
    return this.vercelManager.setPlayerReady(roomId, ready);
  }

  async playCard(roomId: string, cardId: string) {
    return this.vercelManager.playCard(roomId, cardId);
  }

  async sendChatMessage(roomId: string, message: string) {
    return this.vercelManager.sendChatMessage(roomId, message);
  }

  async syncGameState(roomId: string, payload: any) {
    return this.vercelManager.syncGameState(roomId, payload);
  }

  async getPublicRooms() {
    return this.vercelManager.getPublicRooms();
  }

  async getLocalRooms() {
    return this.vercelManager.getLocalRooms();
  }

  onRoomUpdated(callback: (...args: any[]) => void) {
    this.vercelManager.onRoomUpdated(callback);
  }

  onGameStarted(callback: (...args: any[]) => void) {
    this.vercelManager.onGameStarted(callback);
  }

  onRoomJoined(callback: (...args: any[]) => void) {
    this.vercelManager.onRoomJoined(callback);
  }

  onRoomLeft(callback: (...args: any[]) => void) {
    this.vercelManager.onRoomLeft(callback);
  }

  onError(callback: (...args: any[]) => void) {
    this.vercelManager.onError(callback);
  }

  onGameUpdated(callback: (...args: any[]) => void) {
    this.vercelManager.onGameUpdated(callback);
  }

  onSyncGameState(callback: (...args: any[]) => void) {
    this.vercelManager.onSyncGameState(callback);
  }

  onChatMessage(callback: (...args: any[]) => void) {
    this.vercelManager.onChatMessage(callback);
  }

  onRoomListUpdated(callback: (...args: any[]) => void) {
    this.vercelManager.onRoomListUpdated(callback);
  }

  isConnected(): boolean {
    return this.vercelManager.isConnected();
  }

  getPlayerId(): string | null {
    return this.vercelManager.getPlayerId();
  }

  getPlayerName(): string | null {
    return this.vercelManager.getPlayerName();
  }

  offAllListeners() {
    this.vercelManager.offAllListeners();
  }

  async leaveRoom() {
    this.vercelManager.leaveRoom();
  }

  async disconnect() {
    this.vercelManager.disconnect();
  }
}

export default GameSocketManager;