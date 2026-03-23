'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';

interface GameSetupSectionProps {
  playerCount: number;
  playerNames: string[];
  onPlayerCountChange: (count: number) => void;
  onPlayerNameChange: (index: number, name: string) => void;
  onStartGame: () => void;
  isGameStarted: boolean;
}

export default function GameSetupSection({
  playerCount,
  playerNames,
  onPlayerCountChange,
  onPlayerNameChange,
  onStartGame,
  isGameStarted
}: GameSetupSectionProps) {
  return (
    <div className="game-setup-section">
      <h2 className="section-title">Game Setup</h2>
      
      <div className="player-control box">
        <label className="label">Number of Players: {playerCount}</label>
        <input
          type="range"
          min="1"
          max="6"
          value={playerCount}
          onChange={(e) => onPlayerCountChange(parseInt(e.target.value))}
          className="slider is-fullwidth"
          disabled={isGameStarted}
        />
        <div className="player-count-badges mt-2">
          {[1, 2, 3, 4, 5, 6].map(num => (
            <span 
              key={num} 
              className={`tag is-medium ${playerCount === num ? 'is-primary' : 'is-light'}`}
              onClick={() => !isGameStarted && onPlayerCountChange(num)}
              style={{ cursor: isGameStarted ? 'default' : 'pointer', margin: '0 4px' }}
            >
              {num}
            </span>
          ))}
        </div>
      </div>

      <div className="player-names-grid mt-4">
        {playerNames.slice(0, playerCount).map((name, index) => (
          <div key={index} className="field">
            <label className="label">Player {index + 1} Name</label>
            <div className="control">
              <input
                className="input"
                type="text"
                placeholder={`Player ${index + 1}`}
                value={name}
                onChange={(e) => onPlayerNameChange(index, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {!isGameStarted && (
        <div className="mt-6">
          <AnimatedButton 
            className="is-primary is-large is-fullwidth" 
            onClick={onStartGame}
          >
            🚀 Start New Game
          </AnimatedButton>
        </div>
      )}
    </div>
  );
}
