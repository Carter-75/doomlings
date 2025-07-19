// Professional Top-Down Game Table Component
'use client';

import React from 'react';
import GameCard from './GameCard';
import { Card } from '@/modules/doomlings/types/Card';

interface Player {
  id: string;
  name: string;
  hand: Card[];
  traitPile: Card[];
  genePool: number;
  score: number;
  isCurrentTurn: boolean;
  position: number; // 0-5 for 6 players
}

interface GameTableProps {
  players: Player[];
  currentPlayerId: string;
  currentAge?: Card;
  deckSize: number;
  discardPile: Card[];
  onCardPlay: (cardId: string) => void;
  onCardHover: (card: Card | null) => void;
}

const GameTable: React.FC<GameTableProps> = ({
  players,
  currentPlayerId,
  currentAge,
  deckSize,
  discardPile,
  onCardPlay,
  onCardHover
}) => {

  const getPlayerPositionStyle = (position: number, totalPlayers: number) => {
    const angle = (360 / totalPlayers) * position - 90; // Start from top
    const radius = 220; // Distance from center
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    
    return {
      transform: `translate(${x}px, ${y}px)`,
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      marginLeft: '-80px', // Half of player area width
      marginTop: '-60px'   // Half of player area height
    };
  };

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 overflow-hidden">
      
      {/* Table Felt Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-8 bg-gradient-to-br from-green-600 to-green-800 rounded-full shadow-2xl border-8 border-amber-600">
          {/* Felt Texture Pattern */}
          <div className="absolute inset-0 bg-green-700 rounded-full opacity-50"
               style={{
                 backgroundImage: `radial-gradient(circle at 20% 30%, rgba(0,0,0,0.1) 1px, transparent 1px),
                                  radial-gradient(circle at 80% 70%, rgba(0,0,0,0.1) 1px, transparent 1px)`,
                 backgroundSize: '50px 50px'
               }}>
          </div>
          
          {/* Table Edge Highlight */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-500 shadow-inner"></div>
        </div>
      </div>

      {/* Central Game Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-80 h-80">
          
          {/* Current Age Display */}
          {currentAge && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-black/20 backdrop-blur rounded-lg p-3 text-center">
                <div className="text-yellow-400 font-bold text-sm mb-2">CURRENT AGE</div>
                <GameCard 
                  card={currentAge} 
                  size="small" 
                  isPlayable={false}
                  showDetails={false}
                />
              </div>
            </div>
          )}

          {/* Deck Area */}
          <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
            <div className="relative">
              {/* Deck Stack Effect */}
              <div className="absolute w-20 h-28 bg-blue-900 rounded-lg transform translate-x-1 translate-y-1 border-2 border-blue-700"></div>
              <div className="absolute w-20 h-28 bg-blue-800 rounded-lg transform translate-x-0.5 translate-y-0.5 border-2 border-blue-600"></div>
              <div className="w-20 h-28 bg-blue-700 rounded-lg border-2 border-blue-500 flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors relative z-10">
                <div className="text-center text-white">
                  <div className="text-2xl mb-1">🎴</div>
                  <div className="text-xs font-bold">{deckSize}</div>
                  <div className="text-xs">DECK</div>
                </div>
              </div>
            </div>
          </div>

          {/* Discard Pile */}
          <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
            {discardPile.length > 0 ? (
              <GameCard 
                card={discardPile[discardPile.length - 1]} 
                size="small" 
                isPlayable={false}
                showDetails={false}
              />
            ) : (
              <div className="w-20 h-28 bg-gray-600 rounded-lg border-2 border-gray-500 border-dashed flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-xl mb-1">🗑️</div>
                  <div className="text-xs">DISCARD</div>
                </div>
              </div>
            )}
          </div>

          {/* Play Area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-44 border-3 border-dashed border-yellow-400/50 rounded-xl flex items-center justify-center bg-black/10">
              <div className="text-center text-yellow-400/70">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm font-bold">PLAY AREA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Players Around Table */}
      {otherPlayers.map((player, index) => (
        <div
          key={player.id}
          style={getPlayerPositionStyle(player.position, players.length)}
          className="z-20"
        >
          <PlayerArea 
            player={player} 
            isOtherPlayer={true}
            onCardHover={onCardHover}
          />
        </div>
      ))}

      {/* Current Player Area (Bottom) */}
      {currentPlayer && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
          <CurrentPlayerArea 
            player={currentPlayer}
            onCardPlay={onCardPlay}
            onCardHover={onCardHover}
          />
        </div>
      )}

      {/* Game Status HUD */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur rounded-lg p-4 text-white z-40">
        <div className="text-sm">
          <div className="font-bold text-yellow-400 mb-2">GAME STATUS</div>
          <div>Players: {players.length}</div>
          <div>Current Turn: <span className="text-green-400">{players.find(p => p.isCurrentTurn)?.name}</span></div>
          <div>Age: {currentAge?.name || 'None'}</div>
        </div>
      </div>

      {/* Score Display */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur rounded-lg p-4 text-white z-40">
        <div className="text-sm">
          <div className="font-bold text-yellow-400 mb-2">SCORES</div>
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={player.id} className={`flex justify-between items-center ${player.id === currentPlayerId ? 'text-blue-400' : ''}`}>
                <span>{player.name}</span>
                <span className="font-bold ml-4">{player.score}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// Player Area Component for Other Players
const PlayerArea: React.FC<{
  player: Player;
  isOtherPlayer: boolean;
  onCardHover: (card: Card | null) => void;
}> = ({ player, isOtherPlayer, onCardHover }) => {
  return (
    <div className={`bg-black/30 backdrop-blur rounded-lg p-3 w-40 ${player.isCurrentTurn ? 'ring-2 ring-green-400' : ''}`}>
      <div className="text-center text-white mb-2">
        <div className="font-bold text-sm">{player.name}</div>
        <div className="text-xs text-gray-300">Gene Pool: {player.genePool}</div>
      </div>
      
      {/* Hand Cards (face down for other players) */}
      <div className="flex justify-center mb-2 space-x-1">
        {player.hand.slice(0, Math.min(5, player.hand.length)).map((_, index) => (
          <div key={index} className="w-4 h-6 bg-blue-900 rounded border border-blue-700 shadow-sm"></div>
        ))}
        {player.hand.length > 5 && (
          <div className="text-xs text-white self-center ml-1">+{player.hand.length - 5}</div>
        )}
      </div>

      {/* Trait Pile */}
      {player.traitPile.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {player.traitPile.slice(0, 3).map((card, index) => (
            <GameCard
              key={card.id}
              card={card}
              size="small"
              isPlayable={false}
              showDetails={false}
              onHover={(hovered) => onCardHover(hovered ? card : null)}
            />
          ))}
          {player.traitPile.length > 3 && (
            <div className="text-xs text-white text-center">+{player.traitPile.length - 3}</div>
          )}
        </div>
      )}
    </div>
  );
};

// Current Player Area Component
const CurrentPlayerArea: React.FC<{
  player: Player;
  onCardPlay: (cardId: string) => void;
  onCardHover: (card: Card | null) => void;
}> = ({ player, onCardPlay, onCardHover }) => {
  return (
    <div className="bg-black/40 backdrop-blur rounded-xl p-4 max-w-screen-lg">
      {/* Player Info */}
      <div className="text-center text-white mb-4">
        <div className="font-bold text-lg">{player.name} {player.isCurrentTurn && '(Your Turn)'}</div>
        <div className="flex justify-center space-x-6 text-sm">
          <span>Gene Pool: <span className="font-bold text-blue-400">{player.genePool}</span></span>
          <span>Score: <span className="font-bold text-yellow-400">{player.score}</span></span>
          <span>Hand: <span className="font-bold text-green-400">{player.hand.length}</span></span>
        </div>
      </div>

      {/* Hand Cards */}
      <div className="flex justify-center space-x-2 mb-4 overflow-x-auto pb-2">
        {player.hand.map((card) => (
          <GameCard
            key={card.id}
            card={card}
            size="medium"
            isPlayable={player.isCurrentTurn}
            isInHand={true}
            onClick={() => onCardPlay(card.id)}
            onHover={(hovered) => onCardHover(hovered ? card : null)}
            showDetails={true}
          />
        ))}
      </div>

      {/* Trait Pile */}
      {player.traitPile.length > 0 && (
        <div>
          <div className="text-center text-white text-sm font-bold mb-2">Your Trait Pile</div>
          <div className="flex justify-center space-x-1 flex-wrap">
            {player.traitPile.map((card) => (
              <GameCard
                key={card.id}
                card={card}
                size="small"
                isPlayable={false}
                isInTraitPile={true}
                onHover={(hovered) => onCardHover(hovered ? card : null)}
                showDetails={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameTable;