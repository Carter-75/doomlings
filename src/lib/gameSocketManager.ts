import { io, Socket } from 'socket.io-client';

class GameSocketManager {
  private static instance: GameSocketManager;
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private playerName: string | null = null;

  private constructor() {}

  static getInstance(): GameSocketManager {
    if (!GameSocketManager.instance) {
      GameSocketManager.instance = new GameSocketManager();
    }
    return GameSocketManager.instance;
  }

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io({
        path: '/api/socket'
      });

      this.socket.on('connect', () => {
        console.log('Connected to game server');
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from game server');
      });
    });
  }

  async registerPlayer(playerName: string): Promise<string> {
    if (!this.socket) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join-as-player', playerName, (response: any) => {
        if (response.success) {
          this.playerId = response.playerId;
          this.playerName = playerName;
          resolve(response.playerId);
        } else {
          reject(new Error('Failed to register player'));
        }
      });
    });
  }

  createRoom(roomData: {
    roomName: string;
    maxPlayers: number;
    isPrivate: boolean;
    gameSettings: any;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('create-room', roomData, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  joinRoom(roomId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('join-room', { 
        roomId, 
        playerName: this.playerName 
      }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  quickMatch(maxPlayers: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('quick-match', { 
        playerName: this.playerName,
        maxPlayers 
      }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  setPlayerReady(roomId: string, ready: boolean) {
    this.socket?.emit('player-ready', { roomId, ready });
  }

  sendChatMessage(roomId: string, message: string) {
    this.socket?.emit('send-chat', { roomId, message });
  }

  playCard(roomId: string, cardId: string) {
    this.socket?.emit('play-card', { roomId, cardId });
  }

  getPublicRooms(): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve([]);
        return;
      }

      this.socket.emit('get-public-rooms', (rooms: any[]) => {
        resolve(rooms);
      });
    });
  }

  onRoomUpdated(callback: (room: any) => void) {
    this.socket?.on('room-updated', callback);
  }

  onGameStarted(callback: (room: any) => void) {
    this.socket?.on('game-started', callback);
  }

  onGameUpdated(callback: (room: any) => void) {
    this.socket?.on('game-updated', callback);
  }

  onChatMessage(callback: (message: any) => void) {
    this.socket?.on('chat-message', callback);
  }

  onRoomListUpdated(callback: (rooms: any[]) => void) {
    this.socket?.on('room-list-updated', callback);
  }

  offAllListeners() {
    this.socket?.off();
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.playerId = null;
    this.playerName = null;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  getPlayerName(): string | null {
    return this.playerName;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default GameSocketManager;