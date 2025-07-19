import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Game interfaces
interface Player {
  id: string;
  name: string;
  socketId: string;
  ready: boolean;
  hand: Card[];
  traitPile: Card[];
  genePool: number;
  dominants: Card[];
  score: number;
}

interface Card {
  id: string;
  name: string;
  type: 'trait' | 'dominant' | 'age' | 'catastrophe' | 'trinket' | 'treasure';
  color?: 'red' | 'green' | 'blue' | 'purple' | 'colorless';
  faceValue?: number;
  effect?: string;
  action?: string;
  points?: number;
  expansion?: string;
}

interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  isPrivate: boolean;
  status: 'waiting' | 'playing' | 'finished';
  currentPlayerIndex: number;
  deck: Card[];
  ageCards: Card[];
  currentAge?: Card;
  gameSettings: {
    expansions: string[];
    catastropheMode: boolean;
    catastropheAges: number;
    normalAges: number;
    merchantAges: number;
  };
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'system';
}

// Global state
const rooms = new Map<string, GameRoom>();
const playerSockets = new Map<string, string>(); // playerId -> socketId
const socketPlayers = new Map<string, string>(); // socketId -> playerId

let io: SocketIOServer;

export async function GET(req: NextRequest) {
  return new Response('Socket.IO server', { status: 200 });
}

export async function POST(req: NextRequest) {
  return new Response('Socket.IO server', { status: 200 });
}

// Initialize Socket.IO server
function initializeSocket(server: HTTPServer) {
  if (io) return io;
  
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: '/api/socket'
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Handle player joining
    socket.on('join-as-player', (playerName: string, callback) => {
      const playerId = uuidv4();
      playerSockets.set(playerId, socket.id);
      socketPlayers.set(socket.id, playerId);
      
      socket.emit('player-registered', { playerId, playerName });
      callback({ success: true, playerId });
    });

    // Handle creating room
    socket.on('create-room', (data: { 
      roomName: string, 
      maxPlayers: number, 
      isPrivate: boolean,
      gameSettings: any
    }, callback) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) {
        callback({ success: false, error: 'Player not registered' });
        return;
      }

      const roomId = generateRoomCode();
      const room: GameRoom = {
        id: roomId,
        name: data.roomName,
        hostId: playerId,
        players: [],
        maxPlayers: data.maxPlayers,
        isPrivate: data.isPrivate,
        status: 'waiting',
        currentPlayerIndex: 0,
        deck: [],
        ageCards: [],
        gameSettings: data.gameSettings,
        createdAt: new Date()
      };

      rooms.set(roomId, room);
      socket.join(roomId);
      
      callback({ success: true, roomId, room });
      
      // Add to public rooms if not private
      if (!data.isPrivate) {
        io.emit('room-list-updated', getPublicRooms());
      }
    });

    // Handle joining room
    socket.on('join-room', (data: { roomId: string, playerName: string }, callback) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) {
        callback({ success: false, error: 'Player not registered' });
        return;
      }

      const room = rooms.get(data.roomId);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        callback({ success: false, error: 'Room is full' });
        return;
      }

      if (room.status !== 'waiting') {
        callback({ success: false, error: 'Game already started' });
        return;
      }

      // Check if player already in room
      if (room.players.find(p => p.id === playerId)) {
        callback({ success: false, error: 'Already in room' });
        return;
      }

      const player: Player = {
        id: playerId,
        name: data.playerName,
        socketId: socket.id,
        ready: false,
        hand: [],
        traitPile: [],
        genePool: 8,
        dominants: [],
        score: 0
      };

      room.players.push(player);
      socket.join(data.roomId);

      // Send room update to all players in room
      io.to(data.roomId).emit('room-updated', room);
      
      // Send system message
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        playerId: 'system',
        playerName: 'System',
        message: `${data.playerName} joined the room`,
        timestamp: new Date(),
        type: 'system'
      };
      io.to(data.roomId).emit('chat-message', systemMessage);
      
      callback({ success: true, room });

      // Update public rooms list
      if (!room.isPrivate) {
        io.emit('room-list-updated', getPublicRooms());
      }
    });

    // Handle quick match
    socket.on('quick-match', (data: { playerName: string, maxPlayers: number }, callback) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) {
        callback({ success: false, error: 'Player not registered' });
        return;
      }

      // Find available public room with same max players
      let availableRoom = null;
      for (const [roomId, room] of rooms.entries()) {
        if (!room.isPrivate && 
            room.status === 'waiting' && 
            room.maxPlayers === data.maxPlayers &&
            room.players.length < room.maxPlayers) {
          availableRoom = room;
          break;
        }
      }

      if (availableRoom) {
        // Join existing room
        socket.emit('join-room', { 
          roomId: availableRoom.id, 
          playerName: data.playerName 
        }, callback);
      } else {
        // Create new room
        socket.emit('create-room', {
          roomName: `Quick Match ${data.maxPlayers}P`,
          maxPlayers: data.maxPlayers,
          isPrivate: false,
          gameSettings: {
            expansions: ['base'],
            catastropheMode: false,
            catastropheAges: 2,
            normalAges: 8,
            merchantAges: 2
          }
        }, (result: any) => {
          if (result.success) {
            // Auto-join the created room
            socket.emit('join-room', {
              roomId: result.roomId,
              playerName: data.playerName
            }, callback);
          } else {
            callback(result);
          }
        });
      }
    });

    // Handle player ready
    socket.on('player-ready', (data: { roomId: string, ready: boolean }) => {
      const playerId = socketPlayers.get(socket.id);
      const room = rooms.get(data.roomId);
      
      if (!room || !playerId) return;
      
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.ready = data.ready;
        io.to(data.roomId).emit('room-updated', room);
        
        // Check if all players are ready
        if (room.players.length >= 2 && room.players.every(p => p.ready)) {
          startGame(room);
        }
      }
    });

    // Handle chat messages
    socket.on('send-chat', (data: { roomId: string, message: string }) => {
      const playerId = socketPlayers.get(socket.id);
      const room = rooms.get(data.roomId);
      
      if (!room || !playerId) return;
      
      const player = room.players.find(p => p.id === playerId);
      if (!player) return;

      const chatMessage: ChatMessage = {
        id: uuidv4(),
        playerId,
        playerName: player.name,
        message: data.message,
        timestamp: new Date(),
        type: 'chat'
      };

      io.to(data.roomId).emit('chat-message', chatMessage);
    });

    // Handle game actions
    socket.on('play-card', (data: { roomId: string, cardId: string }) => {
      const playerId = socketPlayers.get(socket.id);
      const room = rooms.get(data.roomId);
      
      if (!room || !playerId || room.status !== 'playing') return;
      
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (currentPlayer.id !== playerId) return;
      
      // Process card play
      processCardPlay(room, playerId, data.cardId);
    });

    // Handle getting public rooms
    socket.on('get-public-rooms', (callback) => {
      callback(getPublicRooms());
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      const playerId = socketPlayers.get(socket.id);
      if (playerId) {
        // Remove player from rooms
        for (const [roomId, room] of rooms.entries()) {
          const playerIndex = room.players.findIndex(p => p.id === playerId);
          if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            
            // If room becomes empty, delete it
            if (room.players.length === 0) {
              rooms.delete(roomId);
            } else {
              // Notify remaining players
              io.to(roomId).emit('room-updated', room);
              const systemMessage: ChatMessage = {
                id: uuidv4(),
                playerId: 'system',
                playerName: 'System',
                message: `Player disconnected`,
                timestamp: new Date(),
                type: 'system'
              };
              io.to(roomId).emit('chat-message', systemMessage);
            }
          }
        }
        
        playerSockets.delete(playerId);
        socketPlayers.delete(socket.id);
      }
      
      // Update public rooms list
      io.emit('room-list-updated', getPublicRooms());
    });
  });

  return io;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getPublicRooms() {
  const publicRooms = Array.from(rooms.values())
    .filter(room => !room.isPrivate && room.status === 'waiting')
    .map(room => ({
      id: room.id,
      name: room.name,
      currentPlayers: room.players.length,
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt
    }));
  
  return publicRooms;
}

function startGame(room: GameRoom) {
  room.status = 'playing';
  
  // Initialize game deck (simplified for now)
  room.deck = []; // Will be populated with actual card data
  
  // Deal initial cards
  room.players.forEach(player => {
    player.hand = dealCards(room.deck, 5); // Deal 5 cards initially
    player.genePool = 8; // Starting gene pool
  });
  
  // Send game started event
  io.to(room.id).emit('game-started', room);
  
  const systemMessage: ChatMessage = {
    id: uuidv4(),
    playerId: 'system',
    playerName: 'System',
    message: 'Game started! Good luck everyone!',
    timestamp: new Date(),
    type: 'system'
  };
  io.to(room.id).emit('chat-message', systemMessage);
}

function dealCards(deck: Card[], count: number): Card[] {
  // Simple card dealing - will be improved with actual game logic
  return [];
}

function processCardPlay(room: GameRoom, playerId: string, cardId: string) {
  // Game logic for card play - to be implemented
  const player = room.players.find(p => p.id === playerId);
  if (!player) return;
  
  // Find and remove card from hand
  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  if (cardIndex === -1) return;
  
  const card = player.hand.splice(cardIndex, 1)[0];
  
  // Add to trait pile (simplified)
  player.traitPile.push(card);
  
  // Move to next player
  room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
  
  // Send game update
  io.to(room.id).emit('game-updated', room);
  
  const systemMessage: ChatMessage = {
    id: uuidv4(),
    playerId: 'system',
    playerName: 'System',
    message: `${player.name} played ${card.name}`,
    timestamp: new Date(),
    type: 'system'
  };
  io.to(room.id).emit('chat-message', systemMessage);
}