import { io, Socket } from 'socket.io-client';

class GameSocketManager {
  private static instance: GameSocketManager;
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private playerName: string | null = null;
  private currentRoom: any = null;

  private constructor() {}

  static getInstance(): GameSocketManager {
    if (!GameSocketManager.instance) {
      GameSocketManager.instance = new GameSocketManager();
    }
    return GameSocketManager.instance;
  }

  async connect(): Promise<any> {
    if (this.socket?.connected) return this;

    return new Promise((resolve, reject) => {
      // Connect to the backend (allows overriding for native mobile apps where origin is localhost)
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to real-time multiplayer socket!');
        
        // Auto-reconnect logic
        if (typeof window !== 'undefined') {
          const savedPlayerId = localStorage.getItem('doomlings_playerId');
          const savedPlayerName = localStorage.getItem('doomlings_playerName');
          
          if (savedPlayerId) {
             this.socket?.emit('register', { playerId: savedPlayerId, playerName: savedPlayerName }, (res: any) => {
               if (res.success) {
                  this.playerId = res.playerId;
                  this.playerName = res.playerName;
               }
             });
          }
        }
        resolve(this);
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        reject(err);
      });
      
      this.socket.on('room-updated', (room) => {
          this.currentRoom = room;
      });
      
      this.socket.on('game-started', (room) => {
          this.currentRoom = room;
      });
    });
  }

  async registerPlayer(playerName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject('No socket');
      const savedPlayerId = typeof window !== 'undefined' ? localStorage.getItem('doomlings_playerId') : null;
      
      this.socket.emit('register', { playerId: savedPlayerId, playerName }, (res: any) => {
        if (res.success) {
          this.playerId = res.playerId;
          this.playerName = res.playerName;
          if (typeof window !== 'undefined') {
            localStorage.setItem('doomlings_playerId', res.playerId);
            localStorage.setItem('doomlings_playerName', res.playerName);
          }
          resolve(res.playerId);
        } else {
          reject(res.error);
        }
      });
    });
  }

  async createRoom(data: any): Promise<{success: boolean, room?: any, error?: string}> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject('No socket');
      this.socket.emit('create-room', data, (res: any) => {
        if (res.success) {
          this.currentRoom = res.room;
          resolve(res);
        } else {
          reject(res.error);
        }
      });
    });
  }

  async joinRoom(roomId: string, password?: string): Promise<{success: boolean, room?: any, error?: string}> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject('No socket');
      this.socket.emit('join-room', { roomId, password }, (res: any) => {
        if (res.success) {
          this.currentRoom = res.room;
          resolve(res);
        } else {
          reject(res.error);
        }
      });
    });
  }

  async setPlayerReady(roomId: string, ready: boolean) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject('No socket');
      this.socket.emit('set-ready', { roomId, ready }, (res: any) => {
        if (res.success) resolve(res);
        else reject(res.error);
      });
    });
  }

  async syncGameState(roomId: string, payload: any) {
    if (!this.socket) return;
    this.socket.emit('sync-game-state', { roomId, payload });
  }

  async sendGuestAction(roomId: string, actionType: string, payload: any) {
    if (!this.socket) return;
    this.socket.emit('guest-action', { roomId, actionType, payload });
  }

  onRoomUpdated(callback: (...args: any[]) => void) {
    this.socket?.on('room-updated', callback);
  }

  onRoomJoined(callback: (...args: any[]) => void) {
    this.socket?.on('room-joined', callback);
  }

  onRoomLeft(callback: (...args: any[]) => void) {
    this.socket?.on('room-left', callback);
  }

  onError(callback: (...args: any[]) => void) {
    this.socket?.on('error', callback);
  }

  onRoomListUpdated(callback: (...args: any[]) => void) {
    this.socket?.on('room-list-updated', callback);
  }

  onGameStarted(callback: (...args: any[]) => void) {
    this.socket?.on('game-started', callback);
  }

  onSyncGameState(callback: (...args: any[]) => void) {
    this.socket?.on('sync-game-state', callback);
  }

  onGuestAction(callback: (...args: any[]) => void) {
    this.socket?.on('guest-action', callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  getCurrentRoom(): any {
    return this.currentRoom;
  }

  async getPublicRooms(): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve([]);
      this.socket.emit('get-public-rooms', null, (res: any) => {
        resolve(res.rooms || []);
      });
    });
  }

  async getLocalRooms(): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve([]);
      this.socket.emit('get-local-rooms', null, (res: any) => {
        resolve(res.rooms || []);
      });
    });
  }

  async leaveRoom() {
    return new Promise((resolve, reject) => {
      if (!this.socket) return resolve(null);
      this.socket.emit('leave-room', { roomId: this.currentRoom?.id }, (res: any) => {
        this.currentRoom = null;
        resolve(res);
      });
    });
  }

  async disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default GameSocketManager;