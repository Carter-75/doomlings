import { io, Socket } from 'socket.io-client';
import VercelGameManager from './vercelGameManager';

class GameSocketManager {
  private static instance: GameSocketManager;
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private playerName: string | null = null;
  private vercelManager: VercelGameManager | null = null;
  private useVercelFallback = false;

  private constructor() { }

  static getInstance(): GameSocketManager {
    if (!GameSocketManager.instance) {
      GameSocketManager.instance = new GameSocketManager();
    }
    return GameSocketManager.instance;
  }

  connect(): Promise<Socket | VercelGameManager> {
    return new Promise(async (resolve, reject) => {
      // First try Socket.IO connection
      try {
        if (this.socket?.connected) {
          resolve(this.socket);
          return;
        }

        // Determine the correct Socket.IO server URL
        let serverUrl = 'http://localhost:3000'; // Default for local development

        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;

          if (hostname === 'doomlings.vercel.app') {
            // Production Vercel deployment - use public demo server
            serverUrl = 'https://doomlings-socket-demo.glitch.me';
          } else if (hostname.includes('.vercel.app')) {
            // Preview deployments - use public demo server
            serverUrl = 'https://doomlings-socket-demo.glitch.me';
          } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Local development - use local server
            serverUrl = window.location.origin;
          } else {
            // Other domains - use public demo server
            serverUrl = 'https://doomlings-socket-demo.glitch.me';
          }
        }

        console.log(`🎮 Attempting Socket.IO connection to: ${serverUrl}`);
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to Socket.IO game server successfully!');
          resolve(this.socket!);
        });

        this.socket.on('connect_error', (error) => {
          console.log('❌ Socket.IO connection failed, falling back to Vercel API:', error.message);
          this.fallbackToVercelAPI().then(resolve).catch(reject);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from game server');
        });

        // Timeout fallback
        setTimeout(() => {
          if (!this.socket?.connected) {
            console.log('🔄 Socket.IO timeout, falling back to Vercel API');
            this.fallbackToVercelAPI().then(resolve).catch(reject);
          }
        }, 8000);

      } catch (error) {
        console.log('🔄 Socket.IO unavailable, using Vercel API fallback');
        this.fallbackToVercelAPI().then(resolve).catch(reject);
      }
    });
  }

  private async fallbackToVercelAPI(): Promise<VercelGameManager> {
    this.useVercelFallback = true;
    this.vercelManager = new VercelGameManager();
    await this.vercelManager.connect();
    console.log('✅ Connected to Vercel API game service successfully!');
    return this.vercelManager;
  }

  async registerPlayer(playerName: string): Promise<string> {
    if (this.useVercelFallback && this.vercelManager) {
      this.playerId = await this.vercelManager.registerPlayer(playerName);
      this.playerName = playerName;
      return this.playerId;
    }

    if (!this.socket) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (this.useVercelFallback && this.vercelManager) {
        this.vercelManager.registerPlayer(playerName).then(resolve).catch(reject);
        return;
      }

      this.socket?.emit('join-as-player', playerName, (response: any) => {
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

  async createRoom(data: any) {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.createRoom(data);
    }

    return new Promise((resolve, reject) => {
      this.socket?.emit('create-room', data, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async joinRoom(roomId: string, password?: string) {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.joinRoom(roomId, password);
    }

    return new Promise((resolve, reject) => {
      this.socket?.emit('join-room', {
        roomId,
        password,
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

  async quickMatch(maxPlayers: number) {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.quickMatch(maxPlayers);
    }

    return new Promise((resolve, reject) => {
      this.socket?.emit('quick-match', {
        maxPlayers,
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

  async setPlayerReady(roomId: string, ready: boolean) {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.setPlayerReady(roomId, ready);
    }

    this.socket?.emit('player-ready', { roomId, ready });
  }

  async playCard(roomId: string, cardId: string) {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.playCard(roomId, cardId);
    }

    this.socket?.emit('play-card', { roomId, cardId });
  }

  async sendChatMessage(roomId: string, message: string) {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.sendChatMessage(roomId, message);
    }

    this.socket?.emit('send-chat', { roomId, message });
  }

  async syncGameState(roomId: string, payload: any) {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.syncGameState(roomId, payload);
    }

    // For socket io, just emit it to everyone
    this.socket?.emit('sync-game-state', { roomId, payload });
  }

  async getPublicRooms() {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.getPublicRooms();
    }

    return new Promise<any[]>((resolve, reject) => {
      this.socket?.emit('get-public-rooms', (rooms: any[]) => {
        resolve(rooms || []);
      });
    });
  }

  async getLocalRooms() {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.getLocalRooms();
    }

    return new Promise<any[]>((resolve, reject) => {
      this.socket?.emit('get-local-rooms', (rooms: any[]) => {
        resolve(rooms || []);
      });
    });
  }

  // Event listeners - delegate to appropriate manager
  onRoomUpdated(callback: (...args: any[]) => void) {
    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.onRoomUpdated(callback);
    } else {
      this.socket?.on('room-updated', callback);
    }
  }

  onGameStarted(callback: (...args: any[]) => void) {
    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.onGameStarted(callback);
    } else {
      this.socket?.on('game-started', callback);
    }
  }

  onRoomJoined(callback: (...args: any[]) => void) {
    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.onRoomJoined(callback);
    } else {
      this.socket?.on('room-joined', callback);
    }
  }

  onError(callback: (...args: any[]) => void) {
    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.onError(callback);
    } else {
      this.socket?.on('error', callback);
    }
  }

  onGameUpdated(callback: (...args: any[]) => void) {
    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.onGameUpdated(callback);
    } else {
      this.socket?.on('game-updated', callback);
    }
  }

  onSyncGameState(callback: (...args: any[]) => void) {
    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.onSyncGameState(callback);
    } else {
      this.socket?.on('sync-game-state', callback);
    }
  }

  onChatMessage(callback: (...args: any[]) => void) {
    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.onChatMessage(callback);
    } else {
      this.socket?.on('chat-message', callback);
    }
  }

  onRoomListUpdated(callback: (...args: any[]) => void) {
    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.onRoomListUpdated(callback);
    } else {
      this.socket?.on('room-list-updated', callback);
    }
  }

  isConnected(): boolean {
    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.isConnected();
    }
    return this.socket?.connected || false;
  }

  getPlayerId(): string | null {
    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.getPlayerId();
    }
    return this.playerId;
  }

  getPlayerName(): string | null {
    if (this.useVercelFallback && this.vercelManager) {
      return this.vercelManager.getPlayerName();
    }
    return this.playerName;
  }

  offAllListeners() {
    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.offAllListeners();
    } else {
      this.socket?.removeAllListeners();
    }
  }

  async leaveRoom() {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.leaveRoom();
    } else {
      this.socket?.emit('leave-room');
    }
  }

  async disconnect() {
    if (!this.socket && !this.useVercelFallback) {
      await this.connect();
    }

    if (this.useVercelFallback && this.vercelManager) {
      this.vercelManager.disconnect();
    } else {
      this.socket?.disconnect();
    }
  }
}

export default GameSocketManager;