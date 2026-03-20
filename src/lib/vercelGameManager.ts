// Alternative game manager for Vercel deployment (no Socket.IO required)
import { Capacitor } from '@capacitor/core';

class VercelGameManager {
  private playerId: string | null = null;
  private playerName: string | null = null;
  private apiUrl: string = 'https://doomlings.vercel.app/api/game'; // Default fallback
  private pollInterval: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private listeners: { [key: string]: Function[] } = {};
  private currentRoomId: string | null = null;
  private lastRoomState: any = null;

  constructor() {
    // Android app connects to Vercel deployment, web uses current origin
    if (typeof window !== 'undefined') {
      if (Capacitor.isNativePlatform()) {
        // Native Android/iOS always use Vercel deployment
        this.apiUrl = 'https://doomlings.vercel.app/api/game';
      } else {
        // Web uses current origin (works for Vercel and localhost)
        this.apiUrl = `${window.location.origin}/api/game`;
      }

      // We intentionally do NOT use beforeunload or pagehide to leave the room.
      // In a mobile environment or a long board game, users often background the app
      // or briefly refresh, and we want them to remain in the room if they do.
      // They can manually leave the room via the UI.
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  private async apiCall(action: string, data: any = {}) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  private startPolling() {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(async () => {
      if (this.currentRoomId && !this.isPolling) {
        this.isPolling = true;
        try {
          const result = await this.apiCall('get-room-state', {
            roomId: this.currentRoomId,
            playerId: this.playerId
          });

          if (result.success && result.room) {
            // Check if room state changed
            const roomStateString = JSON.stringify(result.room);
            const lastStateString = JSON.stringify(this.lastRoomState);

            if (roomStateString !== lastStateString) {
              this.lastRoomState = result.room;

              if (result.room.status === 'playing') {
                this.emit('game-started', result.room);
                this.emit('game-updated', result.room);
              } else {
                this.emit('room-updated', result.room);
              }

              // Check if a new game state payload was synced
              if (result.room.gameStatePayload) {
                this.emit('sync-game-state', result.room.gameStatePayload);
              }
            }
          } else if (result.error === 'Room not found') {
            // Room was deleted, stop polling
            console.log('Room no longer exists, stopping polling');
            this.stopPolling();
            this.currentRoomId = null;
            this.lastRoomState = null;
          }
        } catch (error) {
          console.error('Polling error:', error);
          // Don't stop polling on network errors, just log them
        } finally {
          this.isPolling = false;
        }
      }
    }, 2000); // Poll every 2 seconds
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Public methods matching the Socket.IO interface
  async connect(): Promise<any> {
    console.log('🎮 Connected to Vercel game API');
    
    // Auto-reconnect logic
    if (typeof window !== 'undefined') {
      const savedPlayerId = localStorage.getItem('doomlings_playerId');
      const savedRoomId = localStorage.getItem('doomlings_roomId');
      
      if (savedPlayerId && !this.playerId) {
        this.playerId = savedPlayerId;
        this.playerName = localStorage.getItem('doomlings_playerName') || 'Player';
        
        if (savedRoomId) {
          this.currentRoomId = savedRoomId;
          this.startPolling();
          
          // Try to fetch initial state
          this.apiCall('get-room-state', { roomId: savedRoomId, playerId: savedPlayerId })
            .then(res => {
              if (res.success && res.room) {
                 this.lastRoomState = res.room;
                 this.emit('room-joined', res.room); // let UI know we reconnected
              } else {
                 // Room might be dead
                 this.leaveRoom();
              }
            }).catch(console.error);
        }
      }
    }
    
    return Promise.resolve(this);
  }

  async registerPlayer(playerName: string): Promise<string> {
    const existingPlayerId = typeof window !== 'undefined' ? localStorage.getItem('doomlings_playerId') : null;
    const result = await this.apiCall('register-player', { playerName, playerId: existingPlayerId });

    if (result.success) {
      this.playerId = result.playerId;
      this.playerName = result.playerName;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('doomlings_playerId', result.playerId);
        localStorage.setItem('doomlings_playerName', result.playerName);
      }
      
      this.startPolling();
      return result.playerId;
    }

    throw new Error(result.error || 'Failed to register player');
  }

  async createRoom(data: any) {
    const result = await this.apiCall('create-room', {
      ...data,
      playerId: this.playerId,
      playerName: this.playerName
    });

    if (result.success) {
      this.currentRoomId = result.roomId;
      this.lastRoomState = result.room;
      if (typeof window !== 'undefined') {
        localStorage.setItem('doomlings_roomId', result.roomId);
      }
      this.emit('room-joined', result.room);
      return result;
    }

    throw new Error(result.error || 'Failed to create room');
  }

  async joinRoom(roomId: string, password?: string) {
    const result = await this.apiCall('join-room', {
      roomId,
      password,
      playerId: this.playerId,
      playerName: this.playerName
    });

    if (result.success) {
      this.currentRoomId = roomId;
      this.lastRoomState = result.room;
      if (typeof window !== 'undefined') {
        localStorage.setItem('doomlings_roomId', roomId);
      }
      this.emit('room-joined', result.room);
      return result;
    }

    this.emit('error', result.error || 'Failed to join room');
    throw new Error(result.error || 'Failed to join room');
  }

  async quickMatch(maxPlayers: number) {
    // For now, just create a public room with player auto-added
    return this.createRoom({
      roomName: `Quick Match ${maxPlayers}P`,
      maxPlayers,
      isPrivate: false,
      gameSettings: {
        expansions: ['base'],
        catastropheMode: false,
        catastropheAges: 2,
        normalAges: 8,
        merchantAges: 2
      }
    });
  }

  async setPlayerReady(roomId: string, ready: boolean) {
    const result = await this.apiCall('set-player-ready', {
      roomId,
      playerId: this.playerId,
      ready
    });

    if (result.success) {
      this.lastRoomState = result.room;

      if (result.room.status === 'playing') {
        this.emit('game-started', result.room);
      } else {
        this.emit('room-updated', result.room);
      }
    }

    return result;
  }

  async playCard(roomId: string, cardId: string) {
    const result = await this.apiCall('play-card', {
      roomId,
      playerId: this.playerId,
      cardId
    });

    if (result.success) {
      this.emit('game-updated', result.room);

      // Simulate chat message for card played
      this.emit('chat-message', {
        id: Date.now(),
        playerId: 'system',
        playerName: 'System',
        message: `Card played: ${result.playedCard?.name || 'Unknown'}`,
        timestamp: new Date(),
        type: 'system'
      });
    }

    return result;
  }

  async sendChatMessage(roomId: string, message: string) {
    // For now, just emit locally (would need WebSocket for real-time chat)
    this.emit('chat-message', {
      id: Date.now(),
      playerId: this.playerId,
      playerName: this.playerName,
      message,
      timestamp: new Date(),
      type: 'chat'
    });
  }

  async syncGameState(roomId: string, payload: any) {
    const result = await this.apiCall('sync-game-state', {
      roomId,
      playerId: this.playerId,
      payload
    });

    if (result.success) {
      if (result.room) this.lastRoomState = result.room;
      // Optimistically emit locally as well
      this.emit('sync-game-state', payload);
      return result;
    }

    console.error('Failed to sync game state:', result.error);
    throw new Error(result.error);
  }

  async getPublicRooms() {
    const result = await this.apiCall('get-public-rooms', { playerId: this.playerId });
    if (result.success) {
      return result.rooms;
    }
    return [];
  }

  async getLocalRooms() {
    const result = await this.apiCall('get-local-rooms', { playerId: this.playerId });
    if (result.success) {
      return result.rooms;
    }
    return [];
  }

  // Event listeners
  onRoomUpdated(callback: Function) {
    if (!this.listeners['room-updated']) this.listeners['room-updated'] = [];
    this.listeners['room-updated'].push(callback);
  }

  onRoomJoined(callback: Function) {
    if (!this.listeners['room-joined']) this.listeners['room-joined'] = [];
    this.listeners['room-joined'].push(callback);
  }

  onRoomLeft(callback: Function) {
    if (!this.listeners['room-left']) this.listeners['room-left'] = [];
    this.listeners['room-left'].push(callback);
  }

  onError(callback: Function) {
    if (!this.listeners['error']) this.listeners['error'] = [];
    this.listeners['error'].push(callback);
  }

  onGameStarted(callback: Function) {
    if (!this.listeners['game-started']) this.listeners['game-started'] = [];
    this.listeners['game-started'].push(callback);
  }

  onGameUpdated(callback: Function) {
    if (!this.listeners['game-updated']) this.listeners['game-updated'] = [];
    this.listeners['game-updated'].push(callback);
  }

  onSyncGameState(callback: Function) {
    if (!this.listeners['sync-game-state']) this.listeners['sync-game-state'] = [];
    this.listeners['sync-game-state'].push(callback);
  }

  onChatMessage(callback: Function) {
    if (!this.listeners['chat-message']) this.listeners['chat-message'] = [];
    this.listeners['chat-message'].push(callback);
  }

  onRoomListUpdated(callback: Function) {
    if (!this.listeners['room-list-updated']) this.listeners['room-list-updated'] = [];
    this.listeners['room-list-updated'].push(callback);
  }

  // Utility methods
  isConnected(): boolean {
    return this.playerId !== null;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  getPlayerName(): string | null {
    return this.playerName;
  }

  offAllListeners() {
    this.listeners = {};
  }

  async leaveRoom() {
    if (this.currentRoomId) {
      try {
        await this.apiCall('leave-room', {
          roomId: this.currentRoomId,
          playerId: this.playerId
        });
      } catch (err) {
        console.error('Failed to leave room api fetch', err);
      }
    }
    this.currentRoomId = null;
    this.lastRoomState = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('doomlings_roomId');
    }
    this.stopPolling();
    this.emit('room-left', null);
  }

  disconnect() {
    this.stopPolling();
    this.currentRoomId = null;
    this.lastRoomState = null;
    this.offAllListeners();
  }
}

// Export singleton instance
export default VercelGameManager;