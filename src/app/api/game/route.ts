import { NextRequest, NextResponse } from 'next/server';

// In-memory game state (Note: This will reset on serverless function restarts)
// For production, you'd want to use a database like Supabase, PlanetScale, or Redis

let gameState = {
  rooms: new Map(),
  players: new Map(),
};

// Sample card data
const sampleCards = [
  { id: '1', name: 'Slumbering Ancient', type: 'dominant', color: 'purple', faceValue: 3, effect: 'At World\'s End: Choose effect based on discarded card color.', points: 6 },
  { id: '2', name: 'Solar Powered', type: 'trait', color: 'green', faceValue: 2, effect: 'Attach. Value equals host\'s face value.', action: 'Draw 1 card.', points: 3 },
  { id: '3', name: 'Fierce Predator', type: 'trait', color: 'red', faceValue: 4, effect: 'Discard up to 2 traits from trait pile. Draw 2 for each.', points: 5 },
  { id: '4', name: 'Echolocation', type: 'trait', color: 'blue', faceValue: 1, effect: 'Draw 1 card at start of each turn.', points: 4 },
  { id: '5', name: 'Crystal of Power', type: 'treasure', effect: 'Gene Pool cannot be reduced below 5.', points: 4 },
  { id: '6', name: 'Vampirism', type: 'trait', color: 'red', faceValue: 3, effect: 'Steal a trait from opponent\'s trait pile.', points: 3 },
  { id: '7', name: 'Camouflage', type: 'trait', color: 'green', faceValue: 2, effect: '+1 Gene Pool. +2 for each card in hand.', points: 3 }
];

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateInitialHand(playerId: string) {
  const shuffled = [...sampleCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5).map(card => ({
    ...card,
    id: `${card.id}-${playerId}-${Date.now()}-${Math.random()}`
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'register-player':
        const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        gameState.players.set(playerId, {
          id: playerId,
          name: data.playerName,
          lastSeen: Date.now()
        });
        
        return NextResponse.json({
          success: true,
          playerId,
          playerName: data.playerName
        });
      
      case 'create-room':
        // Ensure player exists, if not create them
        let hostPlayerId = data.playerId;
        if (!gameState.players.has(hostPlayerId)) {
          gameState.players.set(hostPlayerId, {
            id: hostPlayerId,
            name: data.playerName || 'Player',
            lastSeen: Date.now()
          });
        }

        const roomId = generateRoomCode();
        const room = {
          id: roomId,
          name: data.roomName,
          hostId: hostPlayerId,
          players: [],
          maxPlayers: data.maxPlayers,
          isPrivate: data.isPrivate,
          status: 'waiting',
          currentPlayerIndex: 0,
          gameSettings: data.gameSettings,
          createdAt: Date.now(),
          lastUpdate: Date.now()
        };
        
        gameState.rooms.set(roomId, room);
        
        return NextResponse.json({
          success: true,
          roomId,
          room
        });
      
      case 'join-room':
        const targetRoom = gameState.rooms.get(data.roomId);
        if (!targetRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' });
        }
        
        if (targetRoom.players.length >= targetRoom.maxPlayers) {
          return NextResponse.json({ success: false, error: 'Room is full' });
        }
        
        if (targetRoom.status !== 'waiting') {
          return NextResponse.json({ success: false, error: 'Game already started' });
        }
        
        // Ensure player exists, get from data if not in gameState
        let player = gameState.players.get(data.playerId);
        if (!player) {
          player = {
            id: data.playerId,
            name: data.playerName || 'Player',
            lastSeen: Date.now()
          };
          gameState.players.set(data.playerId, player);
        }
        
        if (!targetRoom.players.find((p: any) => p.id === data.playerId)) {
          targetRoom.players.push({
            id: data.playerId,
            name: player.name,
            ready: false,
            hand: [],
            traitPile: [],
            genePool: 8,
            score: 0
          });
          targetRoom.lastUpdate = Date.now();
        }
        
        return NextResponse.json({
          success: true,
          room: targetRoom
        });
        
      case 'get-room-state':
        const roomForState = gameState.rooms.get(data.roomId);
        if (!roomForState) {
          return NextResponse.json({ success: false, error: 'Room not found' });
        }
        
        return NextResponse.json({
          success: true,
          room: roomForState
        });
        
      case 'set-player-ready':
        const readyRoom = gameState.rooms.get(data.roomId);
        if (!readyRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' });
        }
        
        const playerInRoom = readyRoom.players.find((p: any) => p.id === data.playerId);
        if (!playerInRoom) {
          return NextResponse.json({ success: false, error: 'Player not in room' });
        }
        
        playerInRoom.ready = data.ready;
        readyRoom.lastUpdate = Date.now();
        
        // Check if all players are ready to start game
        const minPlayers = 1; // Allow single player for testing
        if (readyRoom.players.length >= minPlayers && readyRoom.players.every((p: any) => p.ready)) {
          readyRoom.status = 'playing';
          readyRoom.currentPlayerIndex = 0;
          
          // Deal initial hands
          readyRoom.players.forEach((player: any) => {
            player.hand = generateInitialHand(player.id);
            player.traitPile = [];
            player.genePool = 8;
            player.score = 0;
          });
        }
        
        return NextResponse.json({
          success: true,
          room: readyRoom
        });
        
      case 'play-card':
        const gameRoom = gameState.rooms.get(data.roomId);
        if (!gameRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' });
        }
        
        if (gameRoom.status !== 'playing') {
          return NextResponse.json({ success: false, error: 'Game not started' });
        }
        
        const currentPlayer = gameRoom.players[gameRoom.currentPlayerIndex];
        if (currentPlayer.id !== data.playerId) {
          return NextResponse.json({ success: false, error: 'Not your turn' });
        }
        
        const cardIndex = currentPlayer.hand.findIndex((card: any) => card.id === data.cardId);
        if (cardIndex === -1) {
          return NextResponse.json({ success: false, error: 'Card not found in hand' });
        }
        
        const playedCard = currentPlayer.hand.splice(cardIndex, 1)[0];
        currentPlayer.traitPile.push(playedCard);
        currentPlayer.score += playedCard.points || 0;
        
        // Move to next player
        gameRoom.currentPlayerIndex = (gameRoom.currentPlayerIndex + 1) % gameRoom.players.length;
        gameRoom.lastUpdate = Date.now();
        
        return NextResponse.json({
          success: true,
          room: gameRoom,
          playedCard
        });
        
      case 'get-public-rooms':
        const publicRooms = Array.from(gameState.rooms.values())
          .filter(room => !room.isPrivate && room.status === 'waiting')
          .map(room => ({
            id: room.id,
            name: room.name,
            currentPlayers: room.players.length,
            maxPlayers: room.maxPlayers,
            createdAt: room.createdAt
          }));
          
        return NextResponse.json({
          success: true,
          rooms: publicRooms
        });
        
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' });
  }
}

export async function GET() {
  // Clean up old rooms and players (older than 1 hour)
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  // Clean old rooms
  for (const [roomId, room] of gameState.rooms.entries()) {
    if (now - room.lastUpdate > oneHour) {
      gameState.rooms.delete(roomId);
    }
  }
  
  // Clean old players
  for (const [playerId, player] of gameState.players.entries()) {
    if (now - player.lastSeen > oneHour) {
      gameState.players.delete(playerId);
    }
  }
  
  return NextResponse.json({
    status: 'Doomlings API Running',
    timestamp: new Date().toISOString(),
    players: gameState.players.size,
    rooms: gameState.rooms.size
  });
}