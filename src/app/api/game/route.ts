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
function sanitizeString(str: any, maxLength: number): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'\"&;]/g, '').substring(0, maxLength).trim();
}

function validateId(id: any): string | null {
  if (typeof id !== 'string') return null;
  // strictly alphanumeric/hyphens/underscores for safe Redis keys
  const sanitized = id.replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 50);
  return sanitized.length > 0 ? sanitized : null;
}

async function getAllRooms() {
  const keys = await redis.keys('room:*');
  if (keys.length === 0) return [];
  const rooms = await redis.mget(...keys);
  
  const now = Date.now();
  const validRooms: any[] = [];
  const staleKeys: string[] = [];
  
  const fetchedRooms = rooms.filter(Boolean) as any[];
  for (let i = 0; i < fetchedRooms.length; i++) {
    const room = fetchedRooms[i];
    const lastUp = room.lastUpdate || room.createdAt || 0;
      // Rooms that haven't been updated in 12 hours are considered ghosts
      if (now - lastUp > 12 * 60 * 60 * 1000) {
      staleKeys.push(`room:${room.id}`);
    } else {
      validRooms.push(room);
    }
  }
  
  // Cleanup ghost rooms silently
  if (staleKeys.length > 0) {
    redis.del(...staleKeys).catch(err => console.error('Failed to clear ghost rooms', err));
  }
  
  return validRooms;
}

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, playerId' };
export async function OPTIONS() { return NextResponse.json({}, { headers: corsHeaders }); }

export async function POST(request: NextRequest) {

  try {
    const rawText = await request.text();
    // Deny massive payloads to prevent DoS memory exhaustion
    if (rawText.length > 500000) {
      return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413, headers: corsHeaders });
    }
    
    const body = JSON.parse(rawText || '{}');
    const action = typeof body.action === 'string' ? body.action : '';
    const data = body.data && typeof body.data === 'object' ? body.data : {};

    switch (action) {
      case 'register-player': {
        const safePlayerName = sanitizeString(data.playerName, 30) || 'Player';
        let playerId = validateId(data.playerId);
        if (!playerId) {
            playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }
        const player = {
          id: playerId,
          name: safePlayerName,
          lastSeen: Date.now()
        };
        // Auto expire players after 2 hours (7200 seconds)
        await redis.set(`player:${playerId}`, player, { ex: 7200 });

        return NextResponse.json({
          success: true,
          playerId,
          playerName: safePlayerName
        }, { headers: corsHeaders });
      }

      case 'create-room': {
        const hostPlayerId = validateId(data.playerId);
        if (!hostPlayerId) return NextResponse.json({ success: false, error: 'Invalid Player ID' }, { headers: corsHeaders });
        
        const safePlayerName = sanitizeString(data.playerName, 30) || 'Player';
        let player: any = await redis.get(`player:${hostPlayerId}`);
        if (!player) {
          player = {
            id: hostPlayerId,
            name: safePlayerName,
            lastSeen: Date.now()
          };
          await redis.set(`player:${hostPlayerId}`, player, { ex: 7200 });
        }

        const roomName = sanitizeString(data.roomName, 40) || `${safePlayerName}'s Room`;
        const password = sanitizeString(data.password, 30) || null;
        let maxPlayers = typeof data.maxPlayers === 'number' ? Math.max(2, Math.min(10, data.maxPlayers)) : 6;
        
        // Check if room name is already taken
        const allRooms = await getAllRooms();
        const clientIpRequest = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1').split(',')[0];
        const nowRequest = Date.now();
        for (const existingRoom of allRooms) {
          if (existingRoom.name === roomName) {
            const lastUp = existingRoom.lastUpdate || existingRoom.createdAt || 0;
            // Ghost room detection: if it's been dead 1 hour OR it's from the exact same wifi IP and older than 5 minutes
            if (nowRequest - lastUp > 60 * 60 * 1000 || (existingRoom.wifiIp === clientIpRequest && nowRequest - lastUp > 5 * 60 * 1000)) {
              await redis.del(`room:${existingRoom.id}`);
              continue; // Safe to replace the dead/old room
            }
            return NextResponse.json({
              success: false,
              error: 'Room name is already taken'
            }, { headers: corsHeaders });
          }
        }

        const roomId = generateRoomCode();
        const clientIp = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1').split(',')[0];
        const room = {
          id: roomId,
          name: roomName,
          password: password,
          hostId: hostPlayerId,
          players: [
            {
              id: hostPlayerId,
              name: safePlayerName,
              ready: false,
              hand: [],
              traitPile: [],
              genePool: 8,
              score: 0
            }
          ],
          maxPlayers: maxPlayers,
          isPrivate: !!data.isPrivate,
          isLocal: !!data.isLocal,
          wifiIp: data.isLocal ? clientIp : null,
          status: 'waiting',
          currentPlayerIndex: 0,
          gameSettings: typeof data.gameSettings === 'object' ? data.gameSettings : {},
          createdAt: Date.now(),
          lastUpdate: Date.now()
        };

        // Expire rooms after 2 hours (7200 seconds) to auto-cleanup inactive games
        await redis.set(`room:${roomId}`, room, { ex: 7200 });

        return NextResponse.json({
          success: true,
          roomId,
          room
        }, { headers: corsHeaders });
      }

      case 'join-room': {
        const safeRoomId = validateId(data.roomId);
        if (!safeRoomId) return NextResponse.json({ success: false, error: 'Invalid Room ID' }, { headers: corsHeaders });
        
        const targetRoom: any = await redis.get(`room:${safeRoomId}`);
        if (!targetRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { headers: corsHeaders });
        }

        const providedPassword = sanitizeString(data.password, 30) || null;
        if (targetRoom.password && targetRoom.password !== providedPassword) {
          return NextResponse.json({ success: false, error: 'Incorrect password' }, { headers: corsHeaders });
        }

        if (targetRoom.players.length >= targetRoom.maxPlayers) {
          return NextResponse.json({ success: false, error: 'Room is full' }, { headers: corsHeaders });
        }

        if (targetRoom.status !== 'waiting') {
          return NextResponse.json({ success: false, error: 'Game already started' }, { headers: corsHeaders });
        }

        const joinPlayerId = validateId(data.playerId);
        if (!joinPlayerId) return NextResponse.json({ success: false, error: 'Invalid Player ID' }, { headers: corsHeaders });
        
        const safePlayerName = sanitizeString(data.playerName, 30) || 'Player';
        let player: any = await redis.get(`player:${joinPlayerId}`);
        if (!player) {
          player = {
            id: joinPlayerId,
            name: safePlayerName,
            lastSeen: Date.now()
          };
          await redis.set(`player:${joinPlayerId}`, player, { ex: 7200 });
        }

        if (!targetRoom.players.find((p: any) => p.id === joinPlayerId)) {
          targetRoom.players.push({
            id: joinPlayerId,
            name: player.name,
            ready: false,
            hand: [],
            traitPile: [],
            genePool: 8,
            score: 0
          });
          targetRoom.lastUpdate = Date.now();
          await redis.set(`room:${safeRoomId}`, targetRoom, { ex: 7200 });
        }

        return NextResponse.json({
          success: true,
          room: targetRoom
        }, { headers: corsHeaders });
      }

      case 'get-room-state': {
        const safeRoomId = validateId(data.roomId);
        if (!safeRoomId) return NextResponse.json({ success: false, error: 'Invalid Room ID' }, { headers: corsHeaders });
        
        const roomForState: any = await redis.get(`room:${safeRoomId}`);
        if (!roomForState) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { headers: corsHeaders });
        }

        return NextResponse.json({
          success: true,
          room: roomForState
        }, { headers: corsHeaders });
      }

      case 'set-player-ready': {
        const safeRoomId = validateId(data.roomId);
        const readyPlayerId = validateId(data.playerId);
        if (!safeRoomId || !readyPlayerId) return NextResponse.json({ success: false, error: 'Invalid identifiers' }, { headers: corsHeaders });
        
        const readyRoom: any = await redis.get(`room:${safeRoomId}`);
        if (!readyRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { headers: corsHeaders });
        }

        const playerInRoom = readyRoom.players.find((p: any) => p.id === readyPlayerId);
        if (!playerInRoom) {
          return NextResponse.json({ success: false, error: 'Player not in room' }, { headers: corsHeaders });
        }

        playerInRoom.ready = !!data.ready;
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

        await redis.set(`room:${safeRoomId}`, readyRoom, { ex: 7200 });

        return NextResponse.json({
          success: true,
          room: readyRoom
        }, { headers: corsHeaders });
      }

      case 'play-card': {
        const safeRoomId = validateId(data.roomId);
        const playCardPlayerId = validateId(data.playerId);
        const safeCardId = validateId(data.cardId);
        
        if (!safeRoomId || !playCardPlayerId || !safeCardId) return NextResponse.json({ success: false, error: 'Invalid identifiers' }, { headers: corsHeaders });
        
        const gameRoom: any = await redis.get(`room:${safeRoomId}`);
        if (!gameRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { headers: corsHeaders });
        }

        if (gameRoom.status !== 'playing') {
          return NextResponse.json({ success: false, error: 'Game not started' }, { headers: corsHeaders });
        }

        const currentPlayer = gameRoom.players[gameRoom.currentPlayerIndex];
        if (currentPlayer.id !== playCardPlayerId) {
          return NextResponse.json({ success: false, error: 'Not your turn' }, { headers: corsHeaders });
        }

        const cardIndex = currentPlayer.hand.findIndex((card: any) => card.id === safeCardId);
        if (cardIndex === -1) {
          return NextResponse.json({ success: false, error: 'Card not found in hand' }, { headers: corsHeaders });
        }

        const playedCard = currentPlayer.hand.splice(cardIndex, 1)[0];
        currentPlayer.traitPile.push(playedCard);
        currentPlayer.score += playedCard.points || 0;

        gameRoom.currentPlayerIndex = (gameRoom.currentPlayerIndex + 1) % gameRoom.players.length;
        gameRoom.lastUpdate = Date.now();

        await redis.set(`room:${safeRoomId}`, gameRoom, { ex: 7200 });

        return NextResponse.json({
          success: true,
          room: gameRoom,
          playedCard
        }, { headers: corsHeaders });
      }

      case 'get-public-rooms': {
        const fetchingPlayerId = validateId(data.playerId);
        const allRooms = await getAllRooms();
        const publicRooms = allRooms
          .filter((room: any) => !room.isPrivate && room.status === 'waiting' && !room.isLocal && (!fetchingPlayerId || !room.players.some((p:any) => p.id === fetchingPlayerId)))
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
        }, { headers: corsHeaders });
      }

      case 'get-local-rooms': {
        const clientIp = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1').split(',')[0];
        const fetchingPlayerId = validateId(data.playerId);
        const allRooms = await getAllRooms();
        const localRooms = allRooms
          .filter((room: any) => room.isLocal && room.wifiIp === clientIp && room.status === 'waiting' && (!fetchingPlayerId || !room.players.some((p:any) => p.id === fetchingPlayerId)))
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
        }, { headers: corsHeaders });
      }

      case 'sync-game-state': {
        const safeRoomId = validateId(data.roomId);
        const syncPlayerId = validateId(data.playerId);
        if (!safeRoomId || !syncPlayerId) return NextResponse.json({ success: false, error: 'Invalid identifiers' }, { headers: corsHeaders });

        const syncRoom: any = await redis.get(`room:${safeRoomId}`);
        if (!syncRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { headers: corsHeaders });
        }

        // Ensure the player is actually in the room to sync state
        const isPlayerInRoom = syncRoom.players.some((p: any) => p.id === syncPlayerId);
        if (!isPlayerInRoom) {
          return NextResponse.json({ success: false, error: 'Only players in the room can sync game state' }, { headers: corsHeaders });
        }

        syncRoom.gameStatePayload = data.payload;
        syncRoom.lastUpdate = Date.now();

        await redis.set(`room:${safeRoomId}`, syncRoom, { ex: 7200 });

        return NextResponse.json({
          success: true,
          room: syncRoom
        }, { headers: corsHeaders });
      }

      case 'leave-room': {
        const safeRoomId = validateId(data.roomId);
        const leavePlayerId = validateId(data.playerId);
        if (!safeRoomId || !leavePlayerId) return NextResponse.json({ success: false, error: 'Invalid identifiers' }, { headers: corsHeaders });
        
        const leavingRoom: any = await redis.get(`room:${safeRoomId}`);
        if (!leavingRoom) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { headers: corsHeaders });
        }

        leavingRoom.players = leavingRoom.players.filter((p: any) => p.id !== leavePlayerId);

        if (leavingRoom.players.length === 0) {
          await redis.del(`room:${safeRoomId}`);
        } else if (leavingRoom.hostId === leavePlayerId) {
          // Re-assign host if host leaves
          leavingRoom.hostId = leavingRoom.players[0].id;
          await redis.set(`room:${safeRoomId}`, leavingRoom, { ex: 7200 });
        } else {
          await redis.set(`room:${safeRoomId}`, leavingRoom, { ex: 7200 });
        }

        return NextResponse.json({ success: true }, { headers: corsHeaders });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { headers: corsHeaders });
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
