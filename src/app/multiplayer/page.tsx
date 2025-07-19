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
    // Clear any existing listeners
    socketManager.offAllListeners();
    
    // Set up socket listeners
    socketManager.onRoomUpdated((room: any) => {
      setCurrentRoom(room);
      if (currentView === 'menu' && room && room.players.find((p: any) => p.name === socketManager.getPlayerName())) {
        setCurrentView('lobby');
        setChatMessages([]);
      }
    });

    socketManager.onGameStarted((room: any) => {
      setCurrentRoom(room);
      setCurrentView('game');
    });

    socketManager.onGameUpdated((room: any) => {
      setCurrentRoom(room);
    });

    socketManager.onChatMessage((message: any) => {
      setChatMessages(prev => [...prev, message]);
    });

    socketManager.onRoomListUpdated((rooms: any) => {
      setPublicRooms(rooms);
    });

    // Load public rooms on mount
    loadPublicRooms();

    return () => {
      // Don't remove listeners on unmount to persist across re-renders
    };
  }, [socketManager, currentView]); // Add currentView as dependency

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
      
      // Room creation now automatically adds the player, no need to join separately
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
    // Implement end turn logic
    if (currentRoom) {
      // Future implementation: handle turn end logic
    }
  };

  const handleLeaveGame = () => {
    setCurrentView('menu');
    setCurrentRoom(null);
    setChatMessages([]);
    setPlayerReady(false);
    setError('');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setCurrentRoom(null);
    setChatMessages([]);
    setPlayerReady(false);
    setError('');
  };

  if (!socketManager.isConnected() && currentView === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 bg-blue-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-20 w-32 h-32 bg-purple-500/10 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-pink-500/10 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-2xl animate-bounce">
                🎮
              </div>
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
                Doomlings
              </h1>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                Multiplayer
              </div>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                Play the full Doomlings card game online with friends in epic real-time multiplayer battles!
              </p>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center">
                <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white mr-3">🚀</span>
                Join the Game
              </h2>
              
              {error && (
                <div className="bg-red-500/20 border-2 border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur">
                  <div className="flex items-center">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white text-sm font-bold mb-3">
                    Your Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur transition-all duration-200"
                    placeholder="Enter your awesome name"
                    maxLength={20}
                  />
                </div>
                
                <button
                  onClick={handleJoinAsPlayer}
                  disabled={isConnecting || !playerName.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-purple-500/50 disabled:shadow-none"
                >
                  {isConnecting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🎯</span>
                      Enter Game Arena
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 bg-blue-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-20 w-32 h-32 bg-purple-500/10 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-pink-500/10 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl shadow-2xl mr-4">
                🎮
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Welcome, {socketManager.getPlayerName()}!
                </h1>
                <p className="text-xl text-purple-300">Choose your battle mode</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Quick Match */}
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center text-3xl shadow-xl mb-4">
                  🚀
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Quick Match</h2>
                <p className="text-gray-300">Jump into battle with random players instantly!</p>
              </div>
              
              <div className="space-y-3">
                {[2, 3, 4, 5, 6].map(playerCount => (
                  <button
                    key={playerCount}
                    onClick={() => handleQuickMatch(playerCount)}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-green-500/50"
                  >
                    <div className="flex items-center justify-center">
                      <span className="mr-2">⚔️</span>
                      {playerCount} Player Battle
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Private Room */}
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto flex items-center justify-center text-3xl shadow-xl mb-4">
                  🏠
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Private Room</h2>
                <p className="text-gray-300">Create or join private games with friends</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-bold mb-3 flex items-center">
                    <span className="mr-2">🎯</span>
                    Create Room
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map(playerCount => (
                      <button
                        key={playerCount}
                        onClick={() => handleCreateRoom(playerCount, true)}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm shadow-lg hover:shadow-blue-500/50"
                      >
                        {playerCount}P
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[5, 6].map(playerCount => (
                      <button
                        key={playerCount}
                        onClick={() => handleCreateRoom(playerCount, true)}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm shadow-lg hover:shadow-blue-500/50"
                      >
                        {playerCount} Players
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold mb-3 flex items-center">
                    <span className="mr-2">🔑</span>
                    Join Room
                  </h3>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-white/20 border-2 border-white/30 rounded-lg text-white placeholder-white/60 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur transition-all duration-200"
                      placeholder="Room Code"
                      maxLength={6}
                    />
                    <button
                      onClick={() => handleJoinRoom(roomCode)}
                      disabled={!roomCode.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-purple-500/50"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Public Rooms */}
          <div className="max-w-5xl mx-auto mt-8">
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white mr-3">🌐</span>
                  Public Rooms
                </h2>
                <button
                  onClick={loadPublicRooms}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🔄 Refresh
                </button>
              </div>
              
              {publicRooms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-300 text-lg">No public rooms available right now</p>
                  <p className="text-gray-400 text-sm mt-2">Create one or use quick match to start playing!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publicRooms.map(room => (
                    <div key={room.id} className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/10 p-4 backdrop-blur">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <div className="text-white font-bold">{room.name}</div>
                          <div className="text-gray-300 text-sm">
                            Players: {room.currentPlayers}/{room.maxPlayers}
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={room.currentPlayers >= room.maxPlayers}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 text-sm shadow-lg hover:shadow-green-500/50"
                        >
                          {room.currentPlayers >= room.maxPlayers ? 'Full' : 'Join'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="max-w-5xl mx-auto mt-4">
              <div className="bg-red-500/20 border-2 border-red-500 text-red-200 px-6 py-4 rounded-xl backdrop-blur">
                <div className="flex items-center">
                  <span className="mr-3 text-2xl">⚠️</span>
                  <div>{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'lobby' && currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 bg-blue-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-20 w-32 h-32 bg-purple-500/10 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-pink-500/10 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl shadow-2xl mr-4 animate-pulse">
                🏟️
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Game Lobby
                </h1>
                <div className="flex items-center justify-center space-x-4 mt-2">
                  <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400/50 px-4 py-2 rounded-xl backdrop-blur">
                    <span className="text-yellow-300 font-bold">Room: </span>
                    <span className="text-white font-bold text-xl">{currentRoom.id}</span>
                  </div>
                  <button
                    onClick={handleBackToMenu}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/50"
                  >
                    🚪 Leave Room
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Players Panel */}
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white mr-3">👥</span>
                Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
              </h2>
              
              <div className="space-y-4">
                {currentRoom.players.map((player: any, index: number) => {
                  const isCurrentPlayer = player.id === socketManager.getPlayerId();
                  return (
                    <div key={player.id} className="relative">
                      <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        isCurrentPlayer
                          ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400 shadow-lg shadow-purple-500/25'
                          : 'bg-gradient-to-r from-white/10 to-white/5 border-white/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {player.name[0]}
                              </div>
                              {player.id === currentRoom.hostId && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                  👑
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-white font-bold text-lg flex items-center">
                                {player.name}
                                {isCurrentPlayer && (
                                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">YOU</span>
                                )}
                              </div>
                              <div className="text-gray-300 text-sm">
                                {player.id === currentRoom.hostId ? 'Room Host' : 'Player'}
                              </div>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${
                            player.ready 
                              ? 'bg-green-500/30 text-green-200 border-green-400 animate-pulse' 
                              : 'bg-red-500/30 text-red-200 border-red-400'
                          }`}>
                            {player.ready ? '✅ Ready' : '⏳ Not Ready'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Empty slots */}
                {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_: any, index: number) => (
                  <div key={`empty-${index}`} className="p-4 rounded-xl border-2 border-dashed border-white/30 bg-white/5">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gray-500/30 rounded-full flex items-center justify-center text-2xl">
                        ⏳
                      </div>
                      <div className="text-gray-400 italic">Waiting for player to join...</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ready Button */}
              <button
                onClick={handlePlayerReady}
                className={`w-full mt-6 font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-lg shadow-xl ${
                  playerReady
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/50'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/50 animate-pulse'
                }`}
              >
                {playerReady ? '❌ Cancel Ready' : '✅ Ready to Play!'}
              </button>

              {/* Game Settings */}
              <div className="mt-6 p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/10 backdrop-blur">
                <h3 className="text-white font-bold mb-3 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Game Settings
                </h3>
                <div className="text-gray-300 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Expansions:</span>
                    <span className="text-white">{currentRoom.gameSettings.expansions.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Normal Ages:</span>
                    <span className="text-white">{currentRoom.gameSettings.normalAges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Catastrophe Ages:</span>
                    <span className="text-white">{currentRoom.gameSettings.catastropheAges}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl flex flex-col">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white mr-3">💬</span>
                Chat
              </h2>
              
              <div className="flex-1 bg-gradient-to-br from-black/20 to-black/10 rounded-xl p-4 mb-6 min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar border border-white/10">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">💭</div>
                    <div className="text-gray-400 text-lg">No messages yet</div>
                    <div className="text-gray-500 text-sm mt-2">Say hello to other players!</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg: any, index: number) => (
                      <div key={index} className={`${
                        msg.type === 'system' 
                          ? 'text-center' 
                          : msg.playerId === socketManager.getPlayerId() 
                            ? 'text-right' 
                            : 'text-left'
                      }`}>
                        {msg.type === 'system' ? (
                          <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg px-3 py-2 inline-block">
                            <span className="text-yellow-300">🤖 {msg.message}</span>
                          </div>
                        ) : (
                          <div className={`inline-block max-w-[80%] ${
                            msg.playerId === socketManager.getPlayerId()
                              ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50'
                              : 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/50'
                          } rounded-xl px-4 py-2 backdrop-blur`}>
                            <div className="font-bold text-sm text-white mb-1">{msg.playerName}</div>
                            <div className="text-white">{msg.message}</div>
                          </div>
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
                  className="flex-1 px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur transition-all duration-200"
                  placeholder="Type your message..."
                  maxLength={200}
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-blue-500/50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-6xl mx-auto mt-6">
              <div className="bg-red-500/20 border-2 border-red-500 text-red-200 px-6 py-4 rounded-xl backdrop-blur">
                <div className="flex items-center">
                  <span className="mr-3 text-2xl">⚠️</span>
                  <div>{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>
      </div>
    );
  }

  if (currentView === 'game' && currentRoom) {
    return (
      <DoomlingGameInterface
        room={currentRoom}
        currentPlayerId={socketManager.getPlayerId() || ''}
        onPlayCard={handlePlayCard}
        onEndTurn={handleEndTurn}
        onLeaveGame={handleLeaveGame}
      />
    );
  }

  return null;
};

export default MultiplayerPage;