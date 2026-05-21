import { io, Socket } from 'socket.io-client';

class GameSocketManager {
  private static instance: GameSocketManager;
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private playerName: string | null = null;
  private currentRoom: any = null;
  private connectionPromise: Promise<any> | null = null;

  private constructor() {}

  static getInstance(): GameSocketManager {
    if (!GameSocketManager.instance) {
      GameSocketManager.instance = new GameSocketManager();
    }
    return GameSocketManager.instance;
  }

  async connect(): Promise<any> {
    if (this.socket?.connected) return this;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise((resolve, reject) => {
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
                  
                  // Auto-rejoin room if we have a saved roomId
                  const savedRoomId = localStorage.getItem('doomlings_roomId');
                  const savedClaimName = localStorage.getItem('doomlings_claimName');
                  if (savedRoomId) {
                      this.joinRoom(savedRoomId, undefined, savedClaimName || undefined).catch(e => {
                          console.log("Could not auto-rejoin persistent room:", e);
                          localStorage.removeItem('doomlings_roomId');
                          localStorage.removeItem('doomlings_claimName');
                      });
                  }
               }
             });
          }
        }
        resolve(this);
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        this.connectionPromise = null;
        reject(err);
      });
      
      this.socket.on('room-updated', (room) => {
          this.currentRoom = room;
      });
      
      this.socket.on('game-started', (room) => {
          this.currentRoom = room;
      });

      this.socket.on('kicked', () => {
          if (typeof window !== 'undefined') {
              localStorage.removeItem('doomlings_roomId');
              localStorage.removeItem('doomlings_claimName');
          }
          this.leaveRoom();
          // Notify listeners
          if (this.socket) {
              this.socket.emit('internal-local-kicked');
          }
      });
    });

    return this.connectionPromise;
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
      if (this.currentRoom) return reject('Already in a room');
      this.socket.emit('create-room', data, (res: any) => {
        if (res.success) {
          this.currentRoom = res.room;
          if (typeof window !== 'undefined') {
              localStorage.setItem('doomlings_roomId', res.room.id);
          }
          resolve(res);
        } else {
          reject(res.error);
        }
      });
    });
  }

  async renamePlayerInRoom(roomId: string, oldName: string, newName: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve();
      // Update our local tracking if we are renaming ourselves
      if (this.playerName === oldName) {
        this.playerName = newName;
      }
      this.socket.emit('rename-player-in-room', { roomId, oldName, newName }, () => {
        resolve();
      });
    });
  }

  async joinRoom(roomId: string, password?: string, claimName?: string): Promise<{success: boolean, room?: any, error?: string}> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject('No socket');
      if (this.currentRoom && this.currentRoom.id !== roomId) return reject('Already in a room');
      
      this.socket.emit('join-room', { roomId, password, claimName }, (res: any) => {
        if (res.success) {
          this.currentRoom = res.room;
          if (typeof window !== 'undefined') {
              localStorage.setItem('doomlings_roomId', res.room.id);
              if (claimName) localStorage.setItem('doomlings_claimName', claimName);
          }
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
    return this.socket ? this.socket.id : null;
  }

  getPlayerName(): string | null {
    return this.playerName;
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
    if (!this.socket || !this.currentRoom) return;
    this.socket.emit('leave-room', { roomId: this.currentRoom.id });
    this.currentRoom = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('doomlings_roomId');
        localStorage.removeItem('doomlings_claimName');
    }
  }

  async disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connectionPromise = null;
  }
  onKicked(callback: () => void) {
      if (!this.socket) return;
      this.socket.on('internal-local-kicked', callback);
  }

  offKicked(callback: () => void) {
      if (!this.socket) return;
      this.socket.off('internal-local-kicked', callback);
  }

  kickPlayer(roomId: string, playerId: string) {
      if (!this.socket) return;
      this.socket.emit('kick-player', { roomId, playerId });
  }
}

export default GameSocketManager;