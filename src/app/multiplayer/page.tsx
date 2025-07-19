'use client';

import React, { useState, useEffect } from 'react';
import GameSocketManager from '@/lib/gameSocketManager';
import DoomlingGameInterface from '@/components/DoomlingGameInterface';

const MultiplayerPage = () => {
  const [socketManager] = useState(() => GameSocketManager.getInstance());
  const [currentView, setCurrentView] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    // Set up socket listeners
    socketManager.onRoomUpdated((room) => {
      setCurrentRoom(room);
      if (currentView === 'menu' && room && room.players.find(p => p.name === socketManager.getPlayerName())) {
        setCurrentView('lobby');
        setChatMessages([]);
      }
    });

    socketManager.onGameStarted((room) => {
      setCurrentRoom(room);
      setCurrentView('game');
    });

    socketManager.onGameUpdated((room) => {
      setCurrentRoom(room);
    });

    socketManager.onChatMessage((message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socketManager.onRoomListUpdated((rooms) => {
      setPublicRooms(rooms);
    });

    // Load public rooms
    loadPublicRooms();

    return () => {
      socketManager.offAllListeners();
    };
  }, [socketManager]);

  const loadPublicRooms = async () => {
    try {
      const rooms = await socketManager.getPublicRooms();
      setPublicRooms(rooms);
    } catch (error) {
      console.error('Failed to load public rooms:', error);
    }
  };

  const handleJoinAsPlayer = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      await socketManager.connect();
      await socketManager.registerPlayer(playerName);
      loadPublicRooms();
    } catch (error) {
      setError('Failed to connect to game server');
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateRoom = async (maxPlayers: number, isPrivate: boolean = false) => {
    try {
      const response = await socketManager.createRoom({
        roomName: `${playerName}'s Room`,
        maxPlayers,
        isPrivate,
        gameSettings: {
          expansions: ['base'],
          catastropheMode: false,
          catastropheAges: 2,
          normalAges: 8,
          merchantAges: 2
        }
      });
      
      // Auto-join the created room
      await socketManager.joinRoom(response.roomId);
      setCurrentRoom(response.room);
      setCurrentView('lobby');
      setChatMessages([]);
    } catch (error) {
      setError(`Failed to create room: ${error}`);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      const response = await socketManager.joinRoom(roomId);
      setCurrentRoom(response.room);
      setCurrentView('lobby');
      setChatMessages([]);
      setRoomCode('');
    } catch (error) {
      setError(`Failed to join room: ${error}`);
    }
  };

  const handleQuickMatch = async (maxPlayers: number) => {
    setIsConnecting(true);
    try {
      await socketManager.quickMatch(maxPlayers);
      // The socket events will handle the UI updates
    } catch (error) {
      setError(`Failed to find match: ${error}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePlayerReady = () => {
    if (currentRoom) {
      const newReadyState = !playerReady;
      setPlayerReady(newReadyState);
      socketManager.setPlayerReady(currentRoom.id, newReadyState);
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim() && currentRoom) {
      socketManager.sendChatMessage(currentRoom.id, chatInput.trim());
      setChatInput('');
    }
  };

  const handlePlayCard = (cardId: string) => {
    if (currentRoom) {
      socketManager.playCard(currentRoom.id, cardId);
    }
  };

  const handleEndTurn = () => {
    // TODO: Implement end turn logic
    console.log('End turn clicked');
  };

  const handleLeaveGame = () => {
    setCurrentView('menu');
    setCurrentRoom(null);
    setChatMessages([]);
    setPlayerReady(false);
    setError('');
  };

  if (!socketManager.isConnected() && currentView === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">
              🎮 Doomlings Multiplayer
            </h1>
            <p className="text-xl text-gray-300">
              Play the full Doomlings card game online with friends!
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white/10 backdrop-blur rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Join the Game
            </h2>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
                  placeholder="Enter your name"
                  maxLength={20}
                />
              </div>
              
              <button
                onClick={handleJoinAsPlayer}
                disabled={isConnecting || !playerName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Enter Game'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">
              Welcome, {socketManager.getPlayerName()}!
            </h1>
            <p className="text-xl text-gray-300">
              Choose how you want to play
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Quick Match */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">🚀 Quick Match</h2>
              <p className="text-gray-300 mb-4">
                Jump into a game with random players
              </p>
              
              <div className="space-y-3">
                {[2, 3, 4, 5, 6].map(playerCount => (
                  <button
                    key={playerCount}
                    onClick={() => handleQuickMatch(playerCount)}
                    disabled={isConnecting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    {playerCount} Players
                  </button>
                ))}
              </div>
            </div>

            {/* Private Room */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">🏠 Private Room</h2>
              
              <div className="mb-4">
                <h3 className="text-white font-bold mb-2">Create Room</h3>
                <div className="space-y-2">
                  {[2, 3, 4, 5, 6].map(playerCount => (
                    <button
                      key={playerCount}
                      onClick={() => handleCreateRoom(playerCount, true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
                    >
                      Create {playerCount}P Room
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold mb-2">Join Room</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
                    placeholder="Room Code"
                    maxLength={6}
                  />
                  <button
                    onClick={() => handleJoinRoom(roomCode)}
                    disabled={!roomCode.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Public Rooms */}
          <div className="max-w-4xl mx-auto mt-8 bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">🌐 Public Rooms</h2>
              <button
                onClick={loadPublicRooms}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
            
            {publicRooms.length === 0 ? (
              <p className="text-gray-300 text-center py-4">
                No public rooms available. Create one or use quick match!
              </p>
            ) : (
              <div className="space-y-2">
                {publicRooms.map(room => (
                  <div key={room.id} className="flex justify-between items-center bg-white/5 rounded p-3">
                    <div>
                      <span className="text-white font-bold">{room.name}</span>
                      <span className="text-gray-300 ml-2">
                        ({room.currentPlayers}/{room.maxPlayers})
                      </span>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={room.currentPlayers >= room.maxPlayers}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-1 px-3 rounded transition-colors text-sm"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="max-w-4xl mx-auto mt-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'lobby' && currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Game Lobby</h1>
            <div className="flex justify-center items-center space-x-4">
              <span className="text-xl text-gray-300">
                Room: <span className="font-bold text-white">{currentRoom.id}</span>
              </span>
              <button
                onClick={handleLeaveGame}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded transition-colors text-sm"
              >
                Leave Room
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Players Panel */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
              </h2>
              
              <div className="space-y-3">
                {currentRoom.players.map((player: any, index: number) => (
                  <div key={player.id} className="flex justify-between items-center bg-white/5 rounded p-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {player.id === currentRoom.hostId ? '👑' : '🎮'}
                      </div>
                      <div>
                        <div className="text-white font-bold">{player.name}</div>
                        <div className="text-gray-300 text-sm">
                          {player.id === socketManager.getPlayerId() ? '(You)' : ''}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-sm font-bold ${
                      player.ready 
                        ? 'bg-green-500/20 text-green-200 border border-green-500' 
                        : 'bg-red-500/20 text-red-200 border border-red-500'
                    }`}>
                      {player.ready ? 'Ready' : 'Not Ready'}
                    </div>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="flex items-center bg-white/5 rounded p-3">
                    <div className="text-2xl mr-3">⏳</div>
                    <div className="text-gray-400 italic">Waiting for player...</div>
                  </div>
                ))}
              </div>

              {/* Ready Button */}
              <button
                onClick={handlePlayerReady}
                className={`w-full mt-4 font-bold py-3 px-4 rounded transition-colors ${
                  playerReady
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {playerReady ? 'Cancel Ready' : 'Ready to Play!'}
              </button>

              {/* Game Info */}
              <div className="mt-4 p-3 bg-white/5 rounded">
                <h3 className="text-white font-bold mb-2">Game Settings</h3>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>Expansions: {currentRoom.gameSettings.expansions.join(', ')}</div>
                  <div>Normal Ages: {currentRoom.gameSettings.normalAges}</div>
                  <div>Catastrophe Ages: {currentRoom.gameSettings.catastropheAges}</div>
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 flex flex-col">
              <h2 className="text-2xl font-bold text-white mb-4">💬 Chat</h2>
              
              <div className="flex-1 bg-white/5 rounded p-3 mb-4 h-64 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="text-gray-400 italic text-center py-8">
                    No messages yet. Say hello to other players!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`${
                        msg.type === 'system' ? 'text-yellow-300 italic' : 'text-white'
                      }`}>
                        {msg.type === 'system' ? (
                          <span>🤖 {msg.message}</span>
                        ) : (
                          <span>
                            <span className="font-bold text-blue-300">{msg.playerName}:</span> {msg.message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
                  placeholder="Type your message..."
                  maxLength={200}
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-6xl mx-auto mt-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'game' && currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">🎮 Game In Progress</h1>
            <p className="text-xl text-gray-300">
              Full game interface coming soon! This shows the game has started.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Players</h2>
                {currentRoom.players.map((player: any, index: number) => (
                  <div key={player.id} className="flex justify-between items-center bg-white/5 rounded p-3 mb-2">
                    <span className="text-white font-bold">{player.name}</span>
                    <div className="text-right text-gray-300 text-sm">
                      <div>Gene Pool: {player.genePool}</div>
                      <div>Cards: {player.hand?.length || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Game Status</h2>
                <div className="text-gray-300 space-y-2">
                  <div>Status: {currentRoom.status}</div>
                  <div>Current Player: Player {currentRoom.currentPlayerIndex + 1}</div>
                </div>
                
                <button
                  onClick={handleBackToMenu}
                  className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Leave Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MultiplayerPage;