// Alternative game manager for Vercel deployment (no Socket.IO required)
class VercelGameManager {
  private playerId: string | null = null;
  private playerName: string | null = null;
  private apiUrl: string;
  private pollInterval: NodeJS.Timeout | null = null;
  private listeners: { [key: string]: Function[] } = {};
  private currentRoomId: string | null = null;
  private lastRoomState: any = null;

  constructor() {
    this.apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/game` : '/api/game';
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
      if (this.currentRoomId) {
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
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
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
    return Promise.resolve(this);
  }

  async registerPlayer(playerName: string): Promise<string> {
    const result = await this.apiCall('register-player', { playerName });
    
    if (result.success) {
      this.playerId = result.playerId;
      this.playerName = result.playerName;
      this.startPolling();
      return result.playerId;
    }
    
    throw new Error(result.error || 'Failed to register player');
  }

  async createRoom(data: any) {
    const result = await this.apiCall('create-room', {
      ...data,
      playerId: this.playerId
    });
    
    if (result.success) {
      this.currentRoomId = result.roomId;
      return result;
    }
    
    throw new Error(result.error || 'Failed to create room');
  }

  async joinRoom(roomId: string) {
    const result = await this.apiCall('join-room', {
      roomId,
      playerId: this.playerId
    });
    
    if (result.success) {
      this.currentRoomId = roomId;
      this.lastRoomState = result.room;
      return result;
    }
    
    throw new Error(result.error || 'Failed to join room');
  }

  async quickMatch(maxPlayers: number) {
    // For now, just create a public room
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

  async getPublicRooms() {
    const result = await this.apiCall('get-public-rooms');
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

  onGameStarted(callback: Function) {
    if (!this.listeners['game-started']) this.listeners['game-started'] = [];
    this.listeners['game-started'].push(callback);
  }

  onGameUpdated(callback: Function) {
    if (!this.listeners['game-updated']) this.listeners['game-updated'] = [];
    this.listeners['game-updated'].push(callback);
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

  disconnect() {
    this.stopPolling();
    this.currentRoomId = null;
    this.lastRoomState = null;
    this.offAllListeners();
  }
}

// Export singleton instance
export default VercelGameManager;