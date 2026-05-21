import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory state for fast real-time sync (bypassing Redis for transient states)
// Rooms: roomId -> GameState
const rooms = new Map();
// Socket to Player mapping
const playerSockets = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Player connected: ${socket.id}`);

    // Register a player
    socket.on('register', ({ playerId, playerName }, callback) => {
      const pid = playerId || socket.id;
      playerSockets.set(socket.id, { id: pid, name: playerName || 'Player' });
      console.log(`[Socket.io] Registered ${playerName} (${pid})`);
      if (callback) callback({ success: true, playerId: pid, playerName: playerName || 'Player' });
    });

    // Create room
    socket.on('create-room', (data, callback) => {
      const player = playerSockets.get(socket.id);
      if (!player) return callback({ success: false, error: 'Not registered' });

      // Generate room code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let roomId = '';
      for (let i = 0; i < 6; i++) roomId += chars.charAt(Math.floor(Math.random() * chars.length));

      const roomState = {
        id: roomId,
        name: data.roomName || `${player.name}'s Room`,
        password: data.password || null,
        hostId: player.id,
        players: [
          {
            id: player.id,
            name: data.hostName || player.name,
            ready: false,
            hand: [],
            traitPile: [],
            genePool: 8,
            score: 0
          },
          ...(data.placeholderNames || []).map(name => ({
            id: `placeholder-${name}-${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            isPlaceholder: true,
            ready: false,
            hand: [],
            traitPile: [],
            genePool: 8,
            score: 0
          }))
        ],
        maxPlayers: data.maxPlayers || 6,
        isPrivate: !!data.isPrivate,
        status: 'waiting',
        currentPlayerIndex: 0,
        gameSettings: data.gameSettings || {},
        gameStatePayload: null // For generic state sync if needed
      };

      rooms.set(roomId, roomState);
      socket.join(roomId);
      
      console.log(`[Socket.io] Room ${roomId} created by ${player.name}`);
      io.emit('room-list-updated');
      if (callback) callback({ success: true, roomId, room: roomState });
    });

    // Join room
    socket.on('join-room', (data, callback) => {
      const player = playerSockets.get(socket.id);
      if (!player) return callback({ success: false, error: 'Not registered' });

      const roomState = rooms.get(data.roomId);
      if (!roomState) return callback({ success: false, error: 'Room not found' });
      
      if (roomState.password && roomState.password !== data.password) {
        return callback({ success: false, error: 'Incorrect password' });
      }
      
      if (roomState.players.length >= roomState.maxPlayers) {
        return callback({ success: false, error: 'Room is full' });
      }

      // Find if they are claiming a placeholder
      const placeholder = data.claimName ? roomState.players.find(p => p.isPlaceholder && p.name === data.claimName) : null;
      
      if (placeholder) {
        placeholder.id = player.id;
        placeholder.isPlaceholder = false;
      } else if (!roomState.players.find(p => p.id === player.id)) {
        roomState.players.push({
          id: player.id,
          name: data.claimName || player.name,
          ready: false,
          hand: [],
          traitPile: [],
          genePool: 8,
          score: 0
        });
      }

      socket.join(data.roomId);
      io.to(data.roomId).emit('room-updated', roomState);
      io.emit('room-list-updated');
      
      console.log(`[Socket.io] ${player.name} joined ${data.roomId}`);
      if (callback) callback({ success: true, room: roomState });
    });

    // Set Ready
    socket.on('set-ready', (data, callback) => {
      const player = playerSockets.get(socket.id);
      if (!player) return;

      const roomState = rooms.get(data.roomId);
      if (!roomState) return;

      const roomPlayer = roomState.players.find(p => p.id === player.id);
      if (roomPlayer) {
        roomPlayer.ready = !!data.ready;
        
        // Check if all ready to start
        if (roomState.players.every(p => p.ready)) {
            roomState.status = 'playing';
            io.to(data.roomId).emit('game-started', roomState);
            io.emit('room-list-updated');
        } else {
            io.to(data.roomId).emit('room-updated', roomState);
        }
      }
      if (callback) callback({ success: true });
    });

    // Handle generic state sync
    socket.on('sync-game-state', (data) => {
      const player = playerSockets.get(socket.id);
      if (!player) return;

      const roomState = rooms.get(data.roomId);
      if (!roomState) return;

      if (roomState.hostId === player.id) {
        roomState.gameStatePayload = data.payload;
        socket.to(data.roomId).emit('sync-game-state', data.payload);
      }
    });

    // Handle guest RPC actions relayed to the host
    socket.on('rename-player-in-room', (data, callback) => {
      const { roomId, oldName, newName } = data;
      const roomState = rooms.get(roomId);
      
      if (!roomState) return callback({ success: false, error: 'Room not found' });
      // Only host can rename players for the whole room list? Or anyone? Let's allow host or the player themselves
      
      const playerInRoom = roomState.players.find(p => p.name === oldName);
      if (playerInRoom) {
        playerInRoom.name = newName;
        io.to(roomId).emit('room-updated', { room: roomState });
        io.emit('room-list-updated');
      }
      if (callback) callback({ success: true });
    });

    socket.on('guest-action', (data) => {
      const player = playerSockets.get(socket.id);
      if (!player || !data.roomId) return;
      // Blind relay to the room. The host will intercept it and process the action.
      socket.to(data.roomId).emit('guest-action', data);
    });

    socket.on('get-public-rooms', (_, callback) => {
      const publicRooms = Array.from(rooms.values())
        .filter(r => !r.isPrivate && r.status === 'waiting')
        .map(r => ({ 
          id: r.id, 
          name: r.name, 
          currentPlayers: r.players.filter(p => !p.isPlaceholder).length, 
          maxPlayers: r.maxPlayers,
          players: r.players.map(p => ({ name: p.name, isPlaceholder: p.isPlaceholder }))
        }));
      if (callback) callback({ success: true, rooms: publicRooms });
    });

    socket.on('get-local-rooms', (_, callback) => {
      // Stub local rooms to just public rooms since IP matching is harder over basic sockets
      const localRooms = Array.from(rooms.values())
        .filter(r => r.status === 'waiting')
        .map(r => ({ 
          id: r.id, 
          name: r.name, 
          currentPlayers: r.players.filter(p => !p.isPlaceholder).length, 
          maxPlayers: r.maxPlayers, 
          password: r.password,
          players: r.players.map(p => ({ name: p.name, isPlaceholder: p.isPlaceholder }))
        }));
      if (callback) callback({ success: true, rooms: localRooms });
    });

    socket.on('kick-player', (data) => {
      const host = playerSockets.get(socket.id);
      if (!host || !data.roomId || !data.playerId) return;

      const room = rooms.get(data.roomId);
      if (!room || room.hostId !== host.id) return; // Only host can kick

      const targetPlayerIndex = room.players.findIndex(p => p.id === data.playerId);
      if (targetPlayerIndex !== -1) {
        const targetPlayer = room.players[targetPlayerIndex];
        const oldName = targetPlayer.name;
        
        // Find target socket
        let targetSocketId = null;
        for (const [sid, p] of playerSockets.entries()) {
          if (p.id === data.playerId) {
            targetSocketId = sid;
            break;
          }
        }

        if (targetSocketId) {
          io.to(targetSocketId).emit('kicked');
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) targetSocket.leave(data.roomId);
        }

        // Remove slot entirely
        room.players.splice(targetPlayerIndex, 1);

        io.to(data.roomId).emit('room-updated', room);
        io.emit('room-list-updated');
        
        io.to(data.roomId).emit('player-kicked-from-room', {
          playerName: oldName
        });
      }
    });

    socket.on('leave-room', (data, callback) => {
      const player = playerSockets.get(socket.id);
      if (player && data.roomId) {
        const room = rooms.get(data.roomId);
        if (room) {
          const index = room.players.findIndex(p => p.id === player.id);
          if (index !== -1) {
            room.players.splice(index, 1);
            socket.leave(data.roomId);
            if (room.players.length === 0) {
              rooms.delete(data.roomId);
            } else {
              if (room.hostId === player.id) room.hostId = room.players[0].id;
              io.to(data.roomId).emit('room-updated', room);
            }
            io.emit('room-list-updated');
          }
        }
      }
      if (callback) callback({ success: true });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const player = playerSockets.get(socket.id);
      if (player) {
        console.log(`[Socket.io] ${player.name} disconnected`);
        playerSockets.delete(socket.id);
        
        // Remove from rooms (simplified)
        for (const [roomId, room] of rooms.entries()) {
          const index = room.players.findIndex(p => p.id === player.id);
          if (index !== -1) {
            room.players.splice(index, 1);
            if (room.players.length === 0) {
              rooms.delete(roomId);
            } else {
               if (room.hostId === player.id) room.hostId = room.players[0].id; // Reassign host
               io.to(roomId).emit('room-updated', room);
            }
            io.emit('room-list-updated');
          }
        }
      }
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
