'use client';

import React, { useState, useEffect } from 'react';

const MultiplayerPage = () => {
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Doomlings Multiplayer
          </h1>
          <p className="text-xl text-purple-200">
            Play the full Doomlings card game online with friends!
          </p>
        </div>

        {!isConnected ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Join the Game
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white text-sm font-bold mb-3">
                    Your Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:border-purple-400 focus:outline-none"
                    placeholder="Enter your name"
                    maxLength={20}
                  />
                </div>
                
                <button
                  onClick={() => setIsConnected(true)}
                  disabled={!playerName.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300"
                >
                  Enter Game Arena
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-white text-xl">
              Welcome, {playerName}! Game functionality coming soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerPage;