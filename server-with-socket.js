const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Game state
  const rooms = new Map();
  const playerSockets = new Map();
  const socketPlayers = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Generate room code
    function generateRoomCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    // Get public rooms
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

    // Handle player joining
    socket.on('join-as-player', (playerName, callback) => {
      const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      playerSockets.set(playerId, socket.id);
      socketPlayers.set(socket.id, playerId);
      
      socket.emit('player-registered', { playerId, playerName });
      if (callback) callback({ success: true, playerId });
    });

    // Handle creating room
    socket.on('create-room', (data, callback) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) {
        if (callback) callback({ success: false, error: 'Player not registered' });
        return;
      }

      const roomId = generateRoomCode();
      const room = {
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
      
      if (callback) callback({ success: true, roomId, room });
      
      // Add to public rooms if not private
      if (!data.isPrivate) {
        io.emit('room-list-updated', getPublicRooms());
      }
    });

    // Handle joining room
    socket.on('join-room', (data, callback) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) {
        if (callback) callback({ success: false, error: 'Player not registered' });
        return;
      }

      const room = rooms.get(data.roomId);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        if (callback) callback({ success: false, error: 'Room is full' });
        return;
      }

      if (room.status !== 'waiting') {
        if (callback) callback({ success: false, error: 'Game already started' });
        return;
      }

      // Check if player already in room
      if (room.players.find(p => p.id === playerId)) {
        if (callback) callback({ success: false, error: 'Already in room' });
        return;
      }

      const player = {
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
      const systemMessage = {
        id: Date.now(),
        playerId: 'system',
        playerName: 'System',
        message: `${data.playerName} joined the room`,
        timestamp: new Date(),
        type: 'system'
      };
      io.to(data.roomId).emit('chat-message', systemMessage);
      
      if (callback) callback({ success: true, room });

      // Update public rooms list
      if (!room.isPrivate) {
        io.emit('room-list-updated', getPublicRooms());
      }
    });

    // Handle quick match
    socket.on('quick-match', (data, callback) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) {
        if (callback) callback({ success: false, error: 'Player not registered' });
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
        const joinData = { 
          roomId: availableRoom.id, 
          playerName: data.playerName 
        };
        socket.emit('join-room', joinData, callback);
      } else {
        // Create new room
        const roomData = {
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
        };
        
        socket.emit('create-room', roomData, (result) => {
          if (result.success) {
            // Auto-join the created room
            socket.emit('join-room', {
              roomId: result.roomId,
              playerName: data.playerName
            }, callback);
          } else {
            if (callback) callback(result);
          }
        });
      }
    });

    // Handle player ready
    socket.on('player-ready', (data) => {
      const playerId = socketPlayers.get(socket.id);
      const room = rooms.get(data.roomId);
      
      if (!room || !playerId) return;
      
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.ready = data.ready;
        io.to(data.roomId).emit('room-updated', room);
        
        // Check if all players are ready
        if (room.players.length >= 2 && room.players.every(p => p.ready)) {
          // Start game
          room.status = 'playing';
          io.to(data.roomId).emit('game-started', room);
          
          const systemMessage = {
            id: Date.now(),
            playerId: 'system',
            playerName: 'System',
            message: 'Game started! Good luck everyone!',
            timestamp: new Date(),
            type: 'system'
          };
          io.to(data.roomId).emit('chat-message', systemMessage);
        }
      }
    });

    // Handle chat messages
    socket.on('send-chat', (data) => {
      const playerId = socketPlayers.get(socket.id);
      const room = rooms.get(data.roomId);
      
      if (!room || !playerId) return;
      
      const player = room.players.find(p => p.id === playerId);
      if (!player) return;

      const chatMessage = {
        id: Date.now(),
        playerId,
        playerName: player.name,
        message: data.message,
        timestamp: new Date(),
        type: 'chat'
      };

      io.to(data.roomId).emit('chat-message', chatMessage);
    });

    // Handle getting public rooms
    socket.on('get-public-rooms', (callback) => {
      if (callback) callback(getPublicRooms());
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
            const playerName = room.players[playerIndex].name;
            room.players.splice(playerIndex, 1);
            
            // If room becomes empty, delete it
            if (room.players.length === 0) {
              rooms.delete(roomId);
            } else {
              // Notify remaining players
              io.to(roomId).emit('room-updated', room);
              const systemMessage = {
                id: Date.now(),
                playerId: 'system',
                playerName: 'System',
                message: `${playerName} disconnected`,
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

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});