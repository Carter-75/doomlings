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
    <div className="game-setup-section animate-fade-in">
      <h2 className="section-title">Game Setup</h2>
      
      <div className="player-control box glass mt-6">
        <label className="label text-secondary mb-4">Number of Players: <span className="text-white font-bold">{playerCount}</span></label>
        <div className="range-container mb-6">
          <input
            type="range"
            min="1"
            max="6"
            value={playerCount}
            onChange={(e) => onPlayerCountChange(parseInt(e.target.value))}
            className="slider is-fullwidth custom-slider"
            disabled={isGameStarted}
          />
        </div>
        
        <div className="player-count-badges mb-2" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center', gap: '10px' }}>
          {[1, 2, 3, 4, 5, 6].map(num => (
            <button 
              key={num} 
              className={`player-count-badge ${playerCount === num ? 'active' : ''}`}
              onClick={() => !isGameStarted && onPlayerCountChange(num)}
              disabled={isGameStarted}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div className="player-names-grid mt-8 columns is-multiline">
        {playerNames.slice(0, playerCount).map((name, index) => (
          <div key={index} className="column is-half-tablet is-one-third-desktop">
            <div className="field box glass-light p-4">
              <label className="label text-muted is-size-7 uppercase letter-spacing-1">Player {index + 1} Name</label>
              <div className="control">
                <input
                  className="input premium-input"
                  type="text"
                  placeholder={`Player ${index + 1}`}
                  value={name}
                  onChange={(e) => onPlayerNameChange(index, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isGameStarted && (
        <div className="mt-8 px-4">
          <AnimatedButton 
            className="is-primary is-large is-fullwidth button-premium py-6" 
            onClick={onStartGame}
          >
            🚀 Start New Game
          </AnimatedButton>
        </div>
      )}

      <style jsx>{`
        .player-count-badge {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .player-count-badge:hover:not(:disabled) {
          background: rgba(255, 165, 0, 0.1);
          border-color: var(--primary-orange);
          color: var(--primary-orange);
          transform: translateY(-2px);
        }

        .player-count-badge.active {
          background: linear-gradient(135deg, var(--primary-red), var(--primary-orange));
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 15px rgba(252, 163, 17, 0.4);
          transform: scale(1.1);
        }

        .premium-input {
          background: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          height: 48px;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .premium-input:focus {
          border-color: var(--primary-orange) !important;
          box-shadow: 0 0 10px rgba(252, 163, 17, 0.2) !important;
          background: rgba(0, 0, 0, 0.5) !important;
        }

        .custom-slider {
          -webkit-appearance: none;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
        }

        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: var(--primary-orange);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}
