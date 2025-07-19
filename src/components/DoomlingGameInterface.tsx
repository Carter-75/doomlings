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
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);
  const [showCardDetails, setShowCardDetails] = useState<Card | null>(null);
  
  const currentPlayer = room.players.find((p: Player) => p.id === currentPlayerId);
  const isCurrentTurn = room.players[room.currentPlayerIndex]?.id === currentPlayerId;
  const currentTurnPlayer = room.players[room.currentPlayerIndex];

  // Sample cards for demonstration
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
      // Add selection animation
      setAnimatingCard(cardId);
      setTimeout(() => setAnimatingCard(null), 300);
    }
  };

  const handlePlaySelectedCard = () => {
    if (selectedCard && isCurrentTurn) {
      setAnimatingCard(selectedCard);
      setTimeout(() => {
        onPlayCard(selectedCard);
        setSelectedCard(null);
        setAnimatingCard(null);
      }, 500);
    }
  };

  const getCardColorClass = (color?: string) => {
    switch (color) {
      case 'red': return 'border-red-400 bg-gradient-to-br from-red-500/20 to-red-600/30 shadow-red-500/50';
      case 'green': return 'border-green-400 bg-gradient-to-br from-green-500/20 to-green-600/30 shadow-green-500/50';
      case 'blue': return 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-blue-600/30 shadow-blue-500/50';
      case 'purple': return 'border-purple-400 bg-gradient-to-br from-purple-500/20 to-purple-600/30 shadow-purple-500/50';
      case 'colorless': return 'border-gray-300 bg-gradient-to-br from-gray-400/20 to-gray-500/30 shadow-gray-400/50';
      default: return 'border-yellow-400 bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 shadow-yellow-500/50';
    }
  };

  const getCardTypeIcon = (type: string) => {
    switch (type) {
      case 'trait': return '🧬';
      case 'dominant': return '👑';
      case 'treasure': return '💎';
      case 'age': return '⏳';
      case 'catastrophe': return '💥';
      default: return '🎴';
    }
  };

  const getPlayerPosition = (index: number, total: number) => {
    const angle = (360 / total) * index - 90; // Start from top
    const radius = 120;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { x, y, angle };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-pink-500/10 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-indigo-500/10 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Top Header */}
      <div className="relative z-10 bg-gradient-to-r from-black/40 via-purple-900/30 to-black/40 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  🎮
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Doomlings
                  </h1>
                  <div className="text-xs text-purple-300">Multiplayer Game</div>
                </div>
              </div>
              
              {/* Current Age Display */}
              <div className="hidden md:flex bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50 rounded-lg px-4 py-2 backdrop-blur">
                <div className="text-center">
                  <div className="text-yellow-300 font-bold text-sm">Current Age</div>
                  <div className="text-white text-xs">Age of Evolution</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Turn Indicator */}
              <div className={`px-4 py-2 rounded-full border-2 backdrop-blur ${
                isCurrentTurn 
                  ? 'border-green-400 bg-green-500/20 animate-pulse' 
                  : 'border-orange-400 bg-orange-500/20'
              }`}>
                <div className="text-center">
                  <div className="text-xs text-gray-300">
                    {isCurrentTurn ? 'Your Turn' : 'Waiting'}
                  </div>
                  <div className="text-white font-bold text-sm">
                    {currentTurnPlayer?.name}
                  </div>
                </div>
              </div>

              {/* Gene Pool */}
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/50 rounded-lg px-4 py-2 backdrop-blur">
                <div className="text-center">
                  <div className="text-blue-300 text-xs">Gene Pool</div>
                  <div className="text-white font-bold text-lg">{currentPlayer?.genePool || 8}</div>
                </div>
              </div>

              <button
                onClick={onLeaveGame}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        
        {/* Main Game Area - Responsive Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[calc(100vh-120px)]">
          
          {/* Left Panel - Other Players */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mr-3">👥</span>
                Players ({room.players.length})
              </h2>
              
              <div className="space-y-4">
                {room.players
                  .filter((player: Player) => player.id !== currentPlayerId)
                  .map((player: Player, index: number) => (
                    <div key={player.id} className="relative">
                      <div className={`bg-gradient-to-r p-4 rounded-xl border-2 transition-all duration-300 ${
                        room.players[room.currentPlayerIndex]?.id === player.id
                          ? 'from-green-500/30 to-emerald-500/30 border-green-400 shadow-lg shadow-green-500/25 animate-pulse'
                          : 'from-gray-500/20 to-gray-600/20 border-gray-500/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {player.name[0]}
                            </div>
                            <div>
                              <div className="text-white font-bold">{player.name}</div>
                              <div className="text-sm text-gray-300">
                                Cards: {player.hand?.length || 0} | Traits: {player.traitPile?.length || 0}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-yellow-400 font-bold text-lg">{player.score}</div>
                            <div className="text-xs text-gray-400">points</div>
                          </div>
                        </div>
                      </div>
                      
                      {room.players[room.currentPlayerIndex]?.id === player.id && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce">
                          PLAYING
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Center Panel - Game Board */}
          <div className="xl:col-span-6 order-1 xl:order-2">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl min-h-full">
              
              {/* Current Age - Mobile Responsive */}
              <div className="md:hidden mb-6">
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50 rounded-xl p-4 backdrop-blur">
                  <div className="text-center">
                    <div className="text-yellow-300 font-bold mb-2">⏳ Current Age</div>
                    <div className="text-white font-bold text-lg">Age of Evolution</div>
                    <div className="text-gray-300 text-sm mt-2">
                      All players may play an additional trait card this turn.
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Board Center */}
              <div className="flex flex-col items-center justify-center mb-8">
                
                {/* Deck and Discard Area */}
                <div className="flex items-center justify-center space-x-8 mb-8">
                  
                  {/* Draw Deck */}
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-36 bg-gradient-to-br from-purple-600/80 to-indigo-700/80 rounded-lg border-2 border-purple-400/50 shadow-xl transform group-hover:scale-105 transition-all duration-200">
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                        🎴
                      </div>
                    </div>
                    <div className="absolute -top-1 -left-1 w-24 h-36 bg-gradient-to-br from-purple-500/60 to-indigo-600/60 rounded-lg border-2 border-purple-300/40 -z-10"></div>
                    <div className="absolute -top-2 -left-2 w-24 h-36 bg-gradient-to-br from-purple-400/40 to-indigo-500/40 rounded-lg border-2 border-purple-200/30 -z-20"></div>
                    <div className="text-white text-center mt-2 text-sm font-bold">Deck</div>
                    <div className="text-gray-300 text-center text-xs">42 cards</div>
                  </div>

                  {/* Play Area */}
                  <div className="w-32 h-48 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center backdrop-blur">
                    <div className="text-center text-gray-400">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="text-sm">Play Area</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 w-full max-w-md">
                  {isCurrentTurn ? (
                    <>
                      <button
                        onClick={handlePlaySelectedCard}
                        disabled={!selectedCard}
                        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                          selectedCard
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/50 hover:scale-105 animate-pulse'
                            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {selectedCard ? '🎮 Play Selected Card' : '🎯 Select a Card to Play'}
                      </button>
                      
                      <button
                        onClick={onEndTurn}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/50"
                      >
                        ⏭️ End Turn
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4 animate-bounce">⏳</div>
                      <div className="text-gray-300 font-bold text-lg">Waiting for {currentTurnPlayer?.name}'s turn...</div>
                      <div className="text-gray-400 text-sm mt-2">Get ready for your turn!</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Your Hand & Stats */}
          <div className="xl:col-span-3 order-3">
            <div className="space-y-6">
              
              {/* Score Display */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50 rounded-2xl p-4 backdrop-blur-md shadow-xl">
                <div className="text-center">
                  <div className="text-yellow-300 font-bold text-sm mb-1">Your Score</div>
                  <div className="text-white font-bold text-3xl">{currentPlayer?.score || 0}</div>
                  <div className="text-gray-300 text-sm">points</div>
                </div>
              </div>

              {/* Your Trait Pile */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                  <span className="mr-2">🏆</span>
                  Your Traits ({currentPlayer?.traitPile?.length || 0})
                </h3>
                
                {currentPlayer?.traitPile && currentPlayer.traitPile.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {currentPlayer.traitPile.map((card: Card, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border-2 ${getCardColorClass(card.color)} hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold text-sm">{card.name}</div>
                            <div className="text-xs text-gray-300">{getCardTypeIcon(card.type)} {card.type.toUpperCase()}</div>
                          </div>
                          <div className="text-yellow-400 font-bold text-sm">+{card.points}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-6">
                    <div className="text-3xl mb-2">🌱</div>
                    <div className="text-sm">No traits played yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel - Your Hand (Mobile Optimized) */}
        <div className="mt-6">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white mr-3">🃏</span>
                Your Hand ({playerHand.length})
              </span>
              <div className="text-sm text-gray-300">
                {isCurrentTurn ? 'Click to select' : 'Wait for your turn'}
              </div>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
              {playerHand.map((card: Card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`relative group cursor-pointer transform transition-all duration-300 ${
                    selectedCard === card.id
                      ? 'scale-110 -translate-y-4 z-10'
                      : animatingCard === card.id 
                        ? 'scale-105 animate-bounce' 
                        : 'hover:scale-105 hover:-translate-y-2'
                  } ${
                    !isCurrentTurn ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {/* Card */}
                  <div className={`relative w-full aspect-[2/3] rounded-xl border-3 shadow-lg ${getCardColorClass(card.color)} ${
                    selectedCard === card.id ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''
                  }`}>
                    
                    {/* Card Header */}
                    <div className="p-2 border-b border-white/20">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-bold text-xs md:text-sm truncate">{card.name}</div>
                        {card.faceValue && (
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-white/30 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                            {card.faceValue}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-2 flex-1">
                      <div className="text-center mb-2">
                        <div className="text-2xl md:text-3xl">{getCardTypeIcon(card.type)}</div>
                        <div className="text-xs text-gray-300 uppercase font-semibold">{card.type}</div>
                      </div>
                      
                      <div className="text-xs text-gray-200 line-clamp-3 mb-2">
                        {card.effect}
                      </div>
                      
                      {card.action && (
                        <div className="text-xs text-blue-300 line-clamp-2 mb-2">
                          Action: {card.action}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="p-2 border-t border-white/20">
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold text-sm md:text-base">
                          +{card.points} pts
                        </div>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {selectedCard === card.id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-black text-sm font-bold">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default DoomlingGameInterface;