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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  const currentPlayer = room.players.find((p: Player) => p.id === currentPlayerId);
  const isCurrentTurn = room.players[room.currentPlayerIndex]?.id === currentPlayerId;
  const currentTurnPlayer = room.players[room.currentPlayerIndex];

  // Enhanced sample cards with better variety
  const sampleCards: Card[] = [
    {
      id: '1',
      name: 'Slumbering Ancient',
      type: 'dominant',
      color: 'purple',
      faceValue: 3,
      effect: 'At World\'s End: Choose effect based on card color from your discard pile.',
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
      name: 'Fierce Predator',
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
    },
    {
      id: '6',
      name: 'Vampirism',
      type: 'trait',
      color: 'red',
      faceValue: 3,
      effect: 'Steal a trait from opponent\'s trait pile.',
      points: 3
    },
    {
      id: '7',
      name: 'Camouflage',
      type: 'trait',
      color: 'green',
      faceValue: 2,
      effect: '+1 Gene Pool. +2 for each card in hand.',
      points: 3
    }
  ];

  // Use player's actual hand from server, fallback to sample cards for demo
  const playerHand = currentPlayer?.hand && currentPlayer.hand.length > 0 
    ? currentPlayer.hand 
    : sampleCards.slice(0, 5);

  const playerTraits = currentPlayer?.traitPile || [];

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
      case 'red': return 'border-red-400 bg-gradient-to-br from-red-600/80 to-red-800/90 shadow-red-500/60';
      case 'green': return 'border-green-400 bg-gradient-to-br from-green-600/80 to-green-800/90 shadow-green-500/60';
      case 'blue': return 'border-blue-400 bg-gradient-to-br from-blue-600/80 to-blue-800/90 shadow-blue-500/60';
      case 'purple': return 'border-purple-400 bg-gradient-to-br from-purple-600/80 to-purple-800/90 shadow-purple-500/60';
      case 'colorless': return 'border-gray-300 bg-gradient-to-br from-gray-600/80 to-gray-800/90 shadow-gray-400/60';
      default: return 'border-yellow-400 bg-gradient-to-br from-yellow-600/80 to-yellow-800/90 shadow-yellow-500/60';
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

  const getCardBackgroundImage = (color?: string) => {
    switch (color) {
      case 'red': return 'url("https://images.unsplash.com/photo-1664140545987-731fd14f88f2")'; // Golden energy for red cards
      case 'green': return 'url("https://images.unsplash.com/photo-1551076192-487813ceb8dc")'; // Natural tones for green
      case 'blue': return 'url("https://images.unsplash.com/photo-1642844358483-24d3b6df1144")'; // Blue/purple abstract
      case 'purple': return 'url("https://images.unsplash.com/photo-1551596210-0b9ed313f604")'; // Mystical pyramid
      case 'colorless': return 'url("https://images.unsplash.com/photo-1551076191-7ff87d3ed219")'; // Mystical statue
      default: return 'url("https://images.unsplash.com/photo-1664140545987-731fd14f88f2")';
    }
  };

  const renderRealisticCard = (card: Card, isInHand: boolean = false, isSelected: boolean = false) => (
    <div
      key={card.id}
      onClick={() => isInHand && handleCardClick(card.id)}
      onMouseEnter={() => setHoveredCard(card.id)}
      onMouseLeave={() => setHoveredCard(null)}
      className={`relative group cursor-pointer transform transition-all duration-300 ${
        isSelected
          ? 'scale-110 -translate-y-6 z-20'
          : animatingCard === card.id 
            ? 'scale-105 animate-bounce' 
            : hoveredCard === card.id
              ? 'scale-105 -translate-y-2 z-10'
              : ''
      } ${
        !isCurrentTurn && isInHand ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      style={{
        minHeight: isInHand ? '240px' : '120px',
        minWidth: isInHand ? '160px' : '80px'
      }}
    >
      {/* Card Frame - Premium Design */}
      <div className={`relative w-full h-full rounded-2xl border-4 shadow-2xl ${getCardColorClass(card.color)} ${
        isSelected ? 'ring-4 ring-yellow-400 ring-opacity-90 animate-pulse' : ''
      }`}>
        
        {/* Card Background with Image */}
        <div 
          className="absolute inset-1 rounded-xl opacity-30 bg-cover bg-center"
          style={{ backgroundImage: getCardBackgroundImage(card.color) }}
        />
        
        {/* Overlay for readability */}
        <div className="absolute inset-1 rounded-xl bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* Card Header */}
        <div className="relative z-10 p-3 border-b-2 border-white/30">
          <div className="flex items-center justify-between">
            <div className="text-white font-bold text-sm md:text-base truncate flex-1 mr-2">
              {card.name}
            </div>
            {card.faceValue && (
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur border-2 border-white/40 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg">
                {card.faceValue}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-300 uppercase font-semibold mt-1 flex items-center">
            <span className="mr-1">{getCardTypeIcon(card.type)}</span>
            {card.type}
            {card.color && <span className="ml-2 capitalize">{card.color}</span>}
          </div>
        </div>

        {/* Card Body */}
        <div className="relative z-10 p-3 flex-1 flex flex-col justify-between">
          {/* Main Art Area */}
          <div className="text-center mb-3 flex-1 flex items-center justify-center">
            <div className="text-4xl md:text-6xl opacity-80 drop-shadow-lg">
              {getCardTypeIcon(card.type)}
            </div>
          </div>
          
          {/* Effect Text */}
          <div className="space-y-2">
            {card.effect && (
              <div className="text-xs text-gray-200 bg-black/30 backdrop-blur rounded-lg p-2 leading-relaxed">
                {card.effect}
              </div>
            )}
            
            {card.action && (
              <div className="text-xs text-blue-300 bg-blue-900/30 backdrop-blur rounded-lg p-2 leading-relaxed">
                <span className="font-bold">Action:</span> {card.action}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="relative z-10 p-3 border-t-2 border-white/30">
          <div className="text-center">
            <div className="text-yellow-400 font-bold text-sm md:text-lg flex items-center justify-center">
              <span className="mr-1">⭐</span>
              <span>{card.points} pts</span>
            </div>
          </div>
        </div>

        {/* Premium Effects */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 border-2 border-yellow-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-black text-sm font-bold">✓</span>
          </div>
        )}

        {/* Rarity Shine Effect */}
        {(card.type === 'dominant' || card.type === 'treasure') && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full animate-ping opacity-60" />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      
      {/* Game Table Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(139, 69, 19, 0.3) 0%, transparent 70%), url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Table Felt Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-green-800/20 via-green-900/30 to-slate-900/50 opacity-70" />

      {/* Top Header */}
      <div className="relative z-10 bg-gradient-to-r from-black/60 via-purple-900/40 to-black/60 backdrop-blur-xl border-b border-white/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  🎮
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Doomlings Arena
                  </h1>
                  <div className="text-xs text-purple-300">Multiplayer Championship</div>
                </div>
              </div>
              
              {/* Current Age Display */}
              <div className="hidden md:flex bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400/60 rounded-xl px-4 py-2 backdrop-blur-md shadow-lg">
                <div className="text-center">
                  <div className="text-yellow-300 font-bold text-sm">⏳ Current Age</div>
                  <div className="text-white text-sm font-semibold">{room.currentAge?.name || 'Age of Evolution'}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Turn Indicator */}
              <div className={`px-4 py-2 rounded-full border-2 backdrop-blur-md shadow-lg ${
                isCurrentTurn 
                  ? 'border-green-400 bg-green-500/30 animate-pulse shadow-green-400/50' 
                  : 'border-orange-400 bg-orange-500/30 shadow-orange-400/50'
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
              <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/60 rounded-xl px-4 py-2 backdrop-blur-md shadow-lg">
                <div className="text-center">
                  <div className="text-blue-300 text-xs">🧬 Gene Pool</div>
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
        
        {/* Main Game Table - Top Down View */}
        <div className="relative max-w-7xl mx-auto">
          
          {/* Game Table Surface */}
          <div className="relative bg-gradient-to-br from-green-800/40 to-green-900/60 rounded-[3rem] border-8 border-amber-900/60 shadow-2xl backdrop-blur-md overflow-hidden">
            
            {/* Table Texture */}
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full bg-gradient-radial from-green-700/30 via-green-800/20 to-green-900/40" />
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23000" fill-opacity="0.1" fill-rule="evenodd"%3E%3Cpath d="M0 0h20v20H0V0zm10 0h20v20H10V0z"/%3E%3C/g%3E%3C/svg%3E")',
                  backgroundSize: '40px 40px'
                }}
              />
            </div>

            <div className="relative z-10 p-8 min-h-[600px]">
              
              {/* Center Play Area */}
              <div className="absolute inset-0 flex items-center justify-center">
                
                {/* Central Game Elements */}
                <div className="flex items-center justify-center space-x-12">
                  
                  {/* Draw Deck */}
                  <div className="relative group cursor-pointer">
                    <div className="relative">
                      {/* Multiple card stack effect */}
                      <div className="absolute -top-2 -left-2 w-20 h-32 bg-gradient-to-br from-indigo-600/60 to-purple-700/60 rounded-lg border-2 border-indigo-400/40 shadow-lg" />
                      <div className="absolute -top-1 -left-1 w-20 h-32 bg-gradient-to-br from-indigo-600/70 to-purple-700/70 rounded-lg border-2 border-indigo-400/50 shadow-lg" />
                      <div className="w-20 h-32 bg-gradient-to-br from-indigo-600/90 to-purple-700/90 rounded-lg border-2 border-indigo-400/80 shadow-2xl transform group-hover:scale-105 transition-all duration-200 flex items-center justify-center">
                        <div className="text-white text-3xl drop-shadow-lg">🎴</div>
                      </div>
                    </div>
                    <div className="text-white text-center mt-2 text-sm font-bold drop-shadow">Deck</div>
                    <div className="text-gray-300 text-center text-xs">42 cards</div>
                  </div>

                  {/* Current Age Card */}
                  <div className="relative">
                    <div className="w-32 h-20 bg-gradient-to-br from-yellow-600/80 to-orange-700/80 rounded-xl border-3 border-yellow-400/80 shadow-xl flex items-center justify-center backdrop-blur-md">
                      <div className="text-center text-white">
                        <div className="text-2xl mb-1">⏳</div>
                        <div className="text-xs font-bold">Current Age</div>
                      </div>
                    </div>
                    <div className="text-white text-center mt-2 text-sm font-bold">
                      {room.currentAge?.name || 'Age of Evolution'}
                    </div>
                  </div>

                  {/* Play Area */}
                  <div className="w-32 h-40 border-2 border-dashed border-white/40 rounded-xl flex items-center justify-center backdrop-blur-sm bg-white/5">
                    <div className="text-center text-gray-300">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="text-sm font-semibold">Play Area</div>
                    </div>
                  </div>
                </div>

                {/* Other Players Around Table */}
                {room.players
                  .filter((player: Player) => player.id !== currentPlayerId)
                  .map((player: Player, index: number) => {
                    const angle = (360 / (room.players.length - 1)) * index - 90;
                    const radius = 200;
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    
                    return (
                      <div
                        key={player.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`
                        }}
                      >
                        <div className={`relative ${
                          room.players[room.currentPlayerIndex]?.id === player.id
                            ? 'animate-pulse'
                            : ''
                        }`}>
                          {/* Player Area */}
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mx-auto mb-2">
                              {player.name[0]}
                            </div>
                            <div className="text-white font-bold text-sm">{player.name}</div>
                            <div className="text-gray-300 text-xs">
                              Cards: {player.hand?.length || 0} | Score: {player.score || 0}
                            </div>
                            
                            {/* Player's Trait Pile */}
                            {player.traitPile && player.traitPile.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1 mt-2 max-w-24">
                                {player.traitPile.slice(0, 3).map((trait, idx) => (
                                  <div key={idx} className="w-6 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded border shadow-sm" />
                                ))}
                                {player.traitPile.length > 3 && (
                                  <div className="w-6 h-8 bg-gray-700 rounded border flex items-center justify-center text-xs text-white">
                                    +{player.traitPile.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Turn Indicator */}
                          {room.players[room.currentPlayerIndex]?.id === player.id && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce shadow-lg">
                              PLAYING
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              {/* Action Buttons - Centered */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-4">
                  {isCurrentTurn ? (
                    <>
                      <button
                        onClick={handlePlaySelectedCard}
                        disabled={!selectedCard}
                        className={`py-3 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                          selectedCard
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/50 hover:scale-105 animate-pulse'
                            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed'
                        } backdrop-blur-md`}
                      >
                        {selectedCard ? '🎮 Play Selected Card' : '🎯 Select a Card to Play'}
                      </button>
                      
                      <button
                        onClick={onEndTurn}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/50 backdrop-blur-md"
                      >
                        ⏭️ End Turn
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-3xl mb-2 animate-bounce">⏳</div>
                      <div className="text-gray-300 font-bold text-lg">Waiting for {currentTurnPlayer?.name}'s turn...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Your Score & Stats - Top Right */}
          <div className="absolute -top-4 right-8 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400/60 rounded-2xl p-4 backdrop-blur-md shadow-xl">
            <div className="text-center">
              <div className="text-yellow-300 font-bold text-sm mb-1">Your Score</div>
              <div className="text-white font-bold text-3xl">{currentPlayer?.score || 0}</div>
              <div className="text-gray-300 text-xs">points</div>
            </div>
          </div>

          {/* Your Trait Pile - Top Left */}
          <div className="absolute -top-4 left-8 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-4 shadow-xl max-w-xs">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center">
              <span className="mr-2">🏆</span>
              Your Traits ({playerTraits.length})
            </h3>
            
            {playerTraits.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {playerTraits.map((card: Card, index: number) => (
                  <div key={index} className="relative">
                    {renderRealisticCard(card, false, false)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                <div className="text-2xl mb-2">🌱</div>
                <div className="text-sm">No traits played yet</div>
                <div className="text-xs text-gray-500 mt-1">Play trait cards to build your collection</div>
              </div>
            )}
          </div>
        </div>

        {/* Your Hand - Bottom Panel */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl rounded-3xl border-2 border-white/20 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white mr-3">🃏</span>
                Your Hand ({playerHand.length})
              </span>
              <div className="text-sm text-gray-300">
                {isCurrentTurn ? 'Click to select • Premium Card View' : 'Wait for your turn'}
              </div>
            </h2>
            
            <div className="flex justify-center">
              <div className="flex space-x-4 overflow-x-auto pb-4" style={{ maxWidth: '100%' }}>
                {playerHand.map((card: Card) => renderRealisticCard(card, true, selectedCard === card.id))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      {showCardDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full">
            {renderRealisticCard(showCardDetails, false, false)}
            <button
              onClick={() => setShowCardDetails(null)}
              className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-stops));
        }
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
};

export default DoomlingGameInterface;