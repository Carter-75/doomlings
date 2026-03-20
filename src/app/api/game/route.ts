import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis 
const redis = Redis.fromEnv();

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

// Utility to get all rooms
async function getAllRooms() {
  const keys = await redis.keys('room:*');
  if (keys.length === 0) return [];
  const rooms = await redis.mget(...keys);
  return rooms.filter(Boolean) as any[];
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'register-player': {
        const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const player = {
          id: playerId,
          name: data.playerName,
          lastSeen: Date.now()
        };
        // Auto expire players after 2 hours (7200 seconds)
        await redis.set(`player:${playerId}`, player, { ex: 7200 });

        return NextResponse.json({
          success: true,
          playerId,
          playerName: data.playerName
        });
      }

      case 'create-room': {
        let hostPlayerId = data.playerId;
        let player: any = await redis.get(`player:${hostPlayerId}`);
        if (!player) {
          player = {
            id: hostPlayerId,
            name: data.playerName || 'Player',
            lastSeen: Date.now()
          };
          await redis.set(`player:${hostPlayerId}`, player, { ex: 7200 });
        }

        const roomName = data.roomName || `${data.playerName || 'Player'}'s Room`;
        
        // Check if room name is already taken
        const allRooms = await getAllRooms();
        for (const existingRoom of allRooms) {
          if (existingRoom.name === roomName) {
            return NextResponse.json({
              success: false,
              error: 'Room name is already taken'
            });
          }
        }

        const roomId = generateRoomCode();
        const clientIp = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1').split(',')[0];
        const room = {
          id: roomId,
          name: roomName,
          password: data.password || null,
          hostId: hostPlayerId,
          players: [
            {
              id: hostPlayerId,
              name: data.playerName || 'Player',
              ready: false,
              hand: [],
              traitPile: [],
              genePool: 8,
              score: 0
            }
          ],
          maxPlayers: data.maxPlayers || 6,
          isPrivate: data.isPrivate,
          isLocal: data.isLocal || false,
          wifiIp: data.isLocal ? clientIp : null,
          status: 'waiting',
          currentPlayerIndex: 0,
          gameSettings: data.gameSettings,
          createdAt: Date.now(),
          lastUpdate: Date.now()
        };

        // Expire rooms after 2 hours (7200 seconds) to auto-cleanup inactive games
        await redis.set(`room:${roomId}`, room, { ex: 7200 });

        return NextResponse.json({
          success: true,
          roomId,
          room
        });
      }

      case 'join-room': {
        const targetRoom: any = await redis.get(`room:${data.roomId}`);
        if (!targetRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' });
        }

        if (targetRoom.password && targetRoom.password !== data.password) {
          return NextResponse.json({ success: false, error: 'Incorrect password' });
        }

        if (targetRoom.players.length >= targetRoom.maxPlayers) {
          return NextResponse.json({ success: false, error: 'Room is full' });
        }

        if (targetRoom.status !== 'waiting') {
          return NextResponse.json({ success: false, error: 'Game already started' });
        }

        let player: any = await redis.get(`player:${data.playerId}`);
        if (!player) {
          player = {
            id: data.playerId,
            name: data.playerName || 'Player',
            lastSeen: Date.now()
          };
          await redis.set(`player:${data.playerId}`, player, { ex: 7200 });
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
          await redis.set(`room:${data.roomId}`, targetRoom, { ex: 7200 });
        }

        return NextResponse.json({
          success: true,
          room: targetRoom
        });
      }

      case 'get-room-state': {
        const roomForState: any = await redis.get(`room:${data.roomId}`);
        if (!roomForState) {
          return NextResponse.json({ success: false, error: 'Room not found' });
        }

        return NextResponse.json({
          success: true,
          room: roomForState
        });
      }

      case 'set-player-ready': {
        const readyRoom: any = await redis.get(`room:${data.roomId}`);
        if (!readyRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' });
        }

        const playerInRoom = readyRoom.players.find((p: any) => p.id === data.playerId);
        if (!playerInRoom) {
          return NextResponse.json({ success: false, error: 'Player not in room' });
        }

        playerInRoom.ready = data.ready;
        readyRoom.lastUpdate = Date.now();

        const minPlayers = 1; 
        if (readyRoom.players.length >= minPlayers && readyRoom.players.every((p: any) => p.ready)) {
          readyRoom.status = 'playing';
          readyRoom.currentPlayerIndex = 0;

          readyRoom.players.forEach((p: any) => {
            p.hand = generateInitialHand(p.id);
            p.traitPile = [];
            p.genePool = 8;
            p.score = 0;
          });
        }

        await redis.set(`room:${data.roomId}`, readyRoom, { ex: 7200 });

        return NextResponse.json({
          success: true,
          room: readyRoom
        });
      }

      case 'play-card': {
        const gameRoom: any = await redis.get(`room:${data.roomId}`);
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

        gameRoom.currentPlayerIndex = (gameRoom.currentPlayerIndex + 1) % gameRoom.players.length;
        gameRoom.lastUpdate = Date.now();

        await redis.set(`room:${data.roomId}`, gameRoom, { ex: 7200 });

        return NextResponse.json({
          success: true,
          room: gameRoom,
          playedCard
        });
      }

      case 'get-public-rooms': {
        const allRooms = await getAllRooms();
        const publicRooms = allRooms
          .filter((room: any) => !room.isPrivate && room.status === 'waiting' && !room.isLocal)
          .map((room: any) => ({
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
      }

      case 'get-local-rooms': {
        const clientIp = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1').split(',')[0];
        const allRooms = await getAllRooms();
        const localRooms = allRooms
          .filter((room: any) => room.isLocal && room.wifiIp === clientIp && room.status === 'waiting')
          .map((room: any) => ({
            id: room.id,
            name: room.name,
            password: room.password,
            currentPlayers: room.players.length,
            maxPlayers: room.maxPlayers,
            createdAt: room.createdAt
          }));

        return NextResponse.json({
          success: true,
          rooms: localRooms
        });
      }

      case 'sync-game-state': {
        const syncRoom: any = await redis.get(`room:${data.roomId}`);
        if (!syncRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' });
        }

        // Ensure only the host can forcefully push full game state syncs
        if (syncRoom.hostId !== data.playerId) {
          return NextResponse.json({ success: false, error: 'Only the host can sync game state' });
        }

        syncRoom.gameStatePayload = data.payload;
        syncRoom.lastUpdate = Date.now();

        await redis.set(`room:${data.roomId}`, syncRoom, { ex: 7200 });

        return NextResponse.json({
          success: true,
          room: syncRoom
        });
      }

      case 'leave-room': {
        const leavingRoom: any = await redis.get(`room:${data.roomId}`);
        if (!leavingRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' });
        }

        leavingRoom.players = leavingRoom.players.filter((p: any) => p.id !== data.playerId);

        if (leavingRoom.players.length === 0) {
          await redis.del(`room:${data.roomId}`);
        } else if (leavingRoom.hostId === data.playerId) {
          // Re-assign host if host leaves
          leavingRoom.hostId = leavingRoom.players[0].id;
          await redis.set(`room:${data.roomId}`, leavingRoom, { ex: 7200 });
        } else {
          await redis.set(`room:${data.roomId}`, leavingRoom, { ex: 7200 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' });
  }
}

export async function GET() {
  const allRooms = await getAllRooms();
  return NextResponse.json({
    status: 'Doomlings API Running via Vercel KV Redis',
    timestamp: new Date().toISOString(),
    rooms: allRooms.length,
    roomDetails: allRooms.map((room: any) => ({
      id: room.id,
      name: room.name,
      playerCount: room.players?.length || 0,
      maxPlayers: room.maxPlayers,
      status: room.status
    }))
  });
}