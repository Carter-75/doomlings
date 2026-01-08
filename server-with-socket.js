const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { DoomlingGameServer } = require('./src/modules/doomlings/multiplayer/GameServer');

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

  // Initialize the authoritative game server
  const gameServer = new DoomlingGameServer({
    maxConcurrentGames: 10,
    turnTimeoutMs: 30000,
    reconnectionGracePeriodMs: 60000,
    snapshotIntervalMs: 5000,
    enableTelemetry: true,
    rateLimitConfig: {
      roomCreationPerHour: 10,
      actionsPerMinute: 60,
    },
  });

  // Game state (will be managed by DoomlingGameServer)
  const playerSockets = new Map(); // socket.id -> playerId
  const socketPlayers = new Map(); // playerId -> socket.id

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Get public rooms
    const getPublicRooms = () => {
      return gameServer.getAllGames()
        .filter(game => !game.gameState.config.isPrivate && game.gameState.status === 'setup')
        .map(game => ({
          id: game.id,
          name: game.gameState.config.gameName,
          currentPlayers: game.gameState.players.length,
          maxPlayers: game.gameState.config.maxPlayers,
          createdAt: game.createdAt
        }));
    }

    // Handle player registration
    socket.on('join-as-player', (playerName, callback) => {
      const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      playerSockets.set(socket.id, playerId);
      socketPlayers.set(playerId, socket.id);
      
      socket.emit('player-registered', { playerId, playerName });
      if (callback) callback({ success: true, playerId });
    });

    // Handle creating room
    socket.on('create-room', async (data, callback) => {
      const playerId = playerSockets.get(socket.id);
      if (!playerId) {
        if (callback) callback({ success: false, error: 'Player not registered' });
        return;
      }

      try {
        const gameConfig = {
          gameName: data.roomName,
          maxPlayers: data.maxPlayers,
          minPlayers: 2, // Or get from data
          isPrivate: data.isPrivate,
          enabledExpansions: data.gameSettings.expansions.reduce((acc, exp) => ({ ...acc, [exp]: true }), {}),
          catastropheMode: data.gameSettings.catastropheMode,
          catastropheAges: data.gameSettings.catastropheAges,
          normalAges: data.gameSettings.normalAges,
          merchantAges: data.gameSettings.merchantAges,
        };
        
        const gameId = await gameServer.createGame(playerId, gameConfig);
        const gameState = await gameServer.addPlayerToGame(gameId, playerId, data.playerName, socket.id);

        socket.join(gameId);
        
        if (callback) callback({ success: true, roomId: gameId, room: { id: gameId, ...gameState } });
        
        io.emit('room-list-updated', getPublicRooms());
      } catch (error) {
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Handle joining room
    socket.on('join-room', async (data, callback) => {
      const playerId = playerSockets.get(socket.id);
      if (!playerId) {
        if (callback) callback({ success: false, error: 'Player not registered' });
        return;
      }

      try {
        const gameState = await gameServer.addPlayerToGame(data.roomId, playerId, data.playerName, socket.id);
        socket.join(data.roomId);

        const room = { id: data.roomId, ...gameState };
        io.to(data.roomId).emit('room-updated', room);
        
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

        io.emit('room-list-updated', getPublicRooms());
      } catch (error) {
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Handle quick match (simplified)
    socket.on('quick-match', async (data, callback) => {
      const playerId = playerSockets.get(socket.id);
      if (!playerId) {
        if (callback) callback({ success: false, error: 'Player not registered' });
        return;
      }

      try {
        const publicRooms = getPublicRooms();
        const availableRoom = publicRooms.find(room => room.currentPlayers < room.maxPlayers && room.maxPlayers === data.maxPlayers);

        if (availableRoom) {
          const gameState = await gameServer.addPlayerToGame(availableRoom.id, playerId, data.playerName, socket.id);
          socket.join(availableRoom.id);
          const room = { id: availableRoom.id, ...gameState };
          io.to(availableRoom.id).emit('room-updated', room);
          if (callback) callback({ success: true, room });
        } else {
          const gameConfig = {
            gameName: `${data.playerName}'s Quick Game`,
            maxPlayers: data.maxPlayers,
            minPlayers: 2,
            isPrivate: false,
            enabledExpansions: { base: true },
            catastropheMode: false,
            catastropheAges: 2,
            normalAges: 8,
            merchantAges: 2,
          };
          const gameId = await gameServer.createGame(playerId, gameConfig);
          const gameState = await gameServer.addPlayerToGame(gameId, playerId, data.playerName, socket.id);
          socket.join(gameId);
          const room = { id: gameId, ...gameState };
          if (callback) callback({ success: true, room });
        }
        io.emit('room-list-updated', getPublicRooms());
      } catch (error) {
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Handle player ready
    socket.on('player-ready', async (data) => {
      const playerId = playerSockets.get(socket.id);
      const game = gameServer.getGameByPlayerId(playerId);
      if (!game) return;

      const player = game.gameState.players.find(p => p.id === playerId);
      if (player) {
        player.ready = data.ready;
        io.to(game.id).emit('room-updated', { id: game.id, ...game.gameState });

        // Check if game can start
        if (game.gameState.players.length >= game.gameState.config.minPlayers && game.gameState.players.every(p => p.ready)) {
          try {
            const startedGameState = await gameServer.startGame(game.id);
            io.to(game.id).emit('game-started', { id: game.id, ...startedGameState });
          } catch (error) {
            console.error('Failed to start game:', error);
            // Optionally emit an error to the room
          }
        }
      }
    });

    // Handle chat messages
    socket.on('send-chat', (data) => {
      const playerId = playerSockets.get(socket.id);
      const game = gameServer.getGameByPlayerId(playerId);
      if (!game) return;
      
      const player = game.gameState.players.find(p => p.id === playerId);
      if (!player) return;

      const chatMessage = {
        id: Date.now(),
        playerId,
        playerName: player.name,
        message: data.message,
        timestamp: new Date(),
        type: 'chat'
      };

      io.to(game.id).emit('chat-message', chatMessage);
    });

    // Handle player actions
    socket.on('play-card', async (data) => {
      const playerId = playerSockets.get(socket.id);
      const game = gameServer.getGameByPlayerId(playerId);
      if (!game) return;

      try {
        const action = { type: 'play_card', data: { cardId: data.cardId }, requiresPlayerTurn: true };
        const result = await gameServer.processPlayerAction(game.id, playerId, action, socket.id);
        
        if (result.success) {
          io.to(game.id).emit('game-updated', { id: game.id, ...result.gameState });
        } else {
          // Handle error, e.g., emit to the specific player
          socket.emit('action-error', { error: result.error });
        }
      } catch (error) {
        socket.emit('action-error', { error: error.message });
      }
    });

    // Handle getting public rooms
    socket.on('get-public-rooms', (callback) => {
      if (callback) callback(getPublicRooms());
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      const playerId = playerSockets.get(socket.id);
      if (playerId) {
        const game = gameServer.getGameByPlayerId(playerId);
        if (game) {
          await gameServer.handlePlayerDisconnection(game.id, playerId);
          
          // Notify room
          const player = game.gameState.players.find(p => p.id === playerId);
          const systemMessage = {
            id: Date.now(),
            playerId: 'system',
            playerName: 'System',
            message: `${player?.name || 'A player'} disconnected`,
            timestamp: new Date(),
            type: 'system'
          };
          io.to(game.id).emit('chat-message', systemMessage);
          io.to(game.id).emit('room-updated', { id: game.id, ...game.gameState });
        }
        
        playerSockets.delete(socket.id);
        socketPlayers.delete(playerId);
      }
      
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