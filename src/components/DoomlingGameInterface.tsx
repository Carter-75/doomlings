'use client';

import React, { useState, useEffect } from 'react';

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

interface Player {
  id: string;
  name: string;
  hand: Card[];
  traitPile: Card[];
  genePool: number;
  score: number;
  ready: boolean;
}

interface GameProps {
  room: any;
  currentPlayerId: string;
  onPlayCard: (cardId: string) => void;
  onEndTurn: () => void;
  onLeaveGame: () => void;
}

const DoomlingGameInterface: React.FC<GameProps> = ({ 
  room, 
  currentPlayerId, 
  onPlayCard, 
  onEndTurn, 
  onLeaveGame 
}) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [currentAge, setCurrentAge] = useState<Card | null>(null);
  
  const currentPlayer = room.players.find((p: Player) => p.id === currentPlayerId);
  const isCurrentTurn = room.players[room.currentPlayerIndex]?.id === currentPlayerId;
  const currentTurnPlayer = room.players[room.currentPlayerIndex];

  // Sample cards for demonstration - in real game these come from server
  const sampleCards: Card[] = [
    {
      id: '1',
      name: 'Slumbering',
      type: 'dominant',
      color: 'purple',
      faceValue: 3,
      effect: 'At World\'s End: Discard 1 from hand. Choose effect based on card color.',
      points: 6
    },
    {
      id: '2',
      name: 'Solar Powered',
      type: 'trait',
      color: 'green',
      faceValue: 2,
      effect: 'Attach. Value equals host\'s face value.',
      action: 'Draw 1 card.',
      points: 3
    },
    {
      id: '3',
      name: 'Fierce',
      type: 'trait',
      color: 'red',
      faceValue: 4,
      effect: 'Discard up to 2 traits from trait pile. Draw 2 for each.',
      points: 5
    },
    {
      id: '4',
      name: 'Echolocation',
      type: 'trait',
      color: 'blue',
      faceValue: 1,
      effect: 'Draw 1 card at start of each turn.',
      points: 4
    },
    {
      id: '5',
      name: 'Crystal of Power',
      type: 'treasure',
      effect: 'Gene Pool cannot be reduced below 5.',
      points: 4
    }
  ];

  // Use player's actual hand from server, fallback to sample cards for demo
  const playerHand = currentPlayer?.hand && currentPlayer.hand.length > 0 
    ? currentPlayer.hand 
    : sampleCards;

  const handleCardClick = (cardId: string) => {
    if (!isCurrentTurn) return;
    
    if (selectedCard === cardId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
    }
  };

  const handlePlaySelectedCard = () => {
    if (selectedCard && isCurrentTurn) {
      onPlayCard(selectedCard);
      setSelectedCard(null);
    }
  };

  const getCardColorClass = (color?: string) => {
    switch (color) {
      case 'red': return 'border-red-500 bg-red-500/10';
      case 'green': return 'border-green-500 bg-green-500/10';
      case 'blue': return 'border-blue-500 bg-blue-500/10';
      case 'purple': return 'border-purple-500 bg-purple-500/10';
      case 'colorless': return 'border-gray-400 bg-gray-400/10';
      default: return 'border-yellow-500 bg-yellow-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Game Header */}
      <div className="bg-black/30 backdrop-blur p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-white">🎮 Doomlings Game</h1>
            <div className="text-white">
              <span className="text-sm opacity-75">Current Turn: </span>
              <span className={`font-bold ${isCurrentTurn ? 'text-green-400' : 'text-white'}`}>
                {currentTurnPlayer?.name}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-white text-sm">
              Gene Pool: <span className="font-bold text-blue-400">{currentPlayer?.genePool || 8}</span>
            </div>
            <button
              onClick={onLeaveGame}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Other Players */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h2 className="text-xl font-bold text-white mb-4">Other Players</h2>
              <div className="space-y-3">
                {room.players
                  .filter((player: Player) => player.id !== currentPlayerId)
                  .map((player: Player, index: number) => (
                    <div key={player.id} className="bg-white/5 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className={`font-bold ${
                            room.players[room.currentPlayerIndex]?.id === player.id 
                              ? 'text-green-400' 
                              : 'text-white'
                          }`}>
                            {player.name}
                            {room.players[room.currentPlayerIndex]?.id === player.id && (
                              <span className="ml-2 text-xs bg-green-500 px-2 py-1 rounded">TURN</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-300">
                            Gene Pool: {player.genePool} | Cards: {player.hand?.length || 0}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-400 font-bold">{player.score} pts</div>
                          <div className="text-xs text-gray-400">
                            Traits: {player.traitPile?.length || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Game Status */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 mt-4">
              <h2 className="text-xl font-bold text-white mb-4">Game Status</h2>
              <div className="text-gray-300 space-y-2">
                <div>Phase: <span className="text-white font-bold">Playing Cards</span></div>
                <div>Deck: <span className="text-blue-400">42 cards remaining</span></div>
                <div>Current Age: <span className="text-purple-400">Age of Evolution</span></div>
              </div>
            </div>
          </div>

          {/* Center Panel - Game Board */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h2 className="text-xl font-bold text-white mb-4">Game Board</h2>
              
              {/* Current Age Display */}
              <div className="bg-purple-900/50 border-2 border-purple-500 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold text-purple-200 mb-2">Current Age</h3>
                <div className="text-white font-bold">Age of Evolution</div>
                <div className="text-gray-300 text-sm mt-1">
                  All players may play an additional trait card this turn.
                </div>
              </div>

              {/* Last Played Cards */}
              <div className="mb-4">
                <h3 className="text-white font-bold mb-2">Recent Plays</h3>
                <div className="bg-white/5 rounded-lg p-3 min-h-[100px]">
                  <div className="text-gray-400 text-center text-sm">
                    No cards played yet this turn
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isCurrentTurn && (
                <div className="space-y-2">
                  <button
                    onClick={handlePlaySelectedCard}
                    disabled={!selectedCard}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded transition-colors"
                  >
                    {selectedCard ? 'Play Selected Card' : 'Select a Card to Play'}
                  </button>
                  
                  <button
                    onClick={onEndTurn}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    End Turn
                  </button>
                </div>
              )}
              
              {!isCurrentTurn && (
                <div className="text-center py-4">
                  <div className="text-gray-400">Waiting for {currentTurnPlayer?.name}'s turn...</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Your Hand & Trait Pile */}
          <div className="lg:col-span-1">
            {/* Your Hand */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
              <h2 className="text-xl font-bold text-white mb-4">Your Hand</h2>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {playerHand.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCard === card.id
                        ? 'ring-2 ring-yellow-400 scale-105'
                        : 'hover:scale-102'
                    } ${getCardColorClass(card.color)} ${
                      !isCurrentTurn ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-white text-sm">{card.name}</div>
                      {card.faceValue && (
                        <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {card.faceValue}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-300 mb-1">
                      {card.type.toUpperCase()} {card.color && `• ${card.color.toUpperCase()}`}
                    </div>
                    <div className="text-xs text-gray-200">{card.effect}</div>
                    {card.action && (
                      <div className="text-xs text-blue-300 mt-1">Action: {card.action}</div>
                    )}
                    <div className="text-right text-xs text-yellow-400 mt-1">
                      +{card.points} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Trait Pile */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-3">Your Trait Pile</h2>
              <div className="text-center text-gray-400 text-sm py-4">
                No traits played yet
              </div>
              <div className="text-center text-yellow-400 font-bold">
                Current Score: {currentPlayer?.score || 0} points
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoomlingGameInterface;