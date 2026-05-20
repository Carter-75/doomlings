'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';
import MeaningOfLifeCard from '@/components/MeaningOfLifeCard';

interface MeaningOfLifeSectionProps {
  playerNames: string[];
  playerCount: number;
  playerMeanings: { [key: string]: any[] };
  selectedMeanings: { [key: string]: string | null };
  revealedMeanings: { [key: string]: boolean };
  onAssignMeanings: () => void;
  onRevealAll: () => void;
  onChooseMeaning: (playerName: string, cardName: string) => void;
  onToggleViewPlayer: (playerName: string) => void;
  viewingPlayer: string | null;
  ageMultiplier?: number;
  isGuest?: boolean;
  guestIdentity?: string | null;
}

export default function MeaningOfLifeSection({
  playerNames,
  playerCount,
  playerMeanings,
  selectedMeanings,
  revealedMeanings,
  onAssignMeanings,
  onRevealAll,
  onChooseMeaning,
  onToggleViewPlayer,
  viewingPlayer,
  ageMultiplier = 1,
  isGuest,
  guestIdentity
}: MeaningOfLifeSectionProps) {
  const activePlayerKeys = playerNames
    .slice(0, playerCount)
    .map((playerName, index) => playerName.trim() || `Player ${index + 1}`)
    .filter((pName) => (playerMeanings[pName] || []).length > 0);
  const safeMultiplier = Number.isFinite(ageMultiplier) ? ageMultiplier : 1;

  // Parse description and replace "sM" with calculated values
  const parseDescription = (description: string) => {
    return description.replace(/(\+|^|\s)(-?\d+)sM/g, (_match, prefix, amount) => {
      const calculated = Math.round(Number(amount) * safeMultiplier);
      return `${prefix}${calculated}`;
    });
  };
  const anyRevealed = activePlayerKeys.some((pName) => Boolean(revealedMeanings[pName]));

  return (
    <div className="meaning-of-life-section animate-fade-in">
      <h2 className="section-title">Meaning of Life</h2>
      
      <div className="player-control box glass p-6 mt-6 has-text-centered shadow-lg">
        <AnimatedButton 
          id="assign-mol-btn" 
          className="is-primary is-fullwidth button-premium py-6" 
          onClick={onAssignMeanings}
          disabled={isGuest}
        >
          🎴 Assign Meaning of Life Cards
        </AnimatedButton>
        <p className="mt-4 text-muted is-size-7 italic">Each player will receive 2 secret objectives to choose from.</p>
      </div>

      <div className="player-meaning-cards-container mt-8">
        <h4 className="title is-5 text-secondary pl-2 mb-4">Player Hidden Objectives</h4>
        <div className="columns is-multiline">
          {playerNames.slice(0, playerCount).map((playerName, index) => {
            const pName = playerName.trim() || `Player ${index + 1}`;
            const hasCards = playerMeanings[pName] && playerMeanings[pName].length > 0;
            const isRevealed = revealedMeanings[pName];
            const isViewing = viewingPlayer === pName;

            return (
              <div key={index} className="column is-half-tablet is-one-third-desktop">
                <div className={`player-meaning-card-box box glass-light p-4 h-full border-white/5 transition-all ${isViewing ? 'viewing-active' : ''}`}>
                  <h3 className="title is-5 mb-4 has-text-centered border-b border-white/10 pb-2">{pName}</h3>
                  
                  {hasCards && !isRevealed && (
                    <div className="mb-4">
                      <AnimatedButton 
                        className={`is-small is-fullwidth ${isViewing ? 'mol-view-toggle-active' : 'mol-view-toggle'}`}
                        onClick={() => onToggleViewPlayer(pName)}
                        disabled={isGuest && pName !== guestIdentity}
                      >
                        {isViewing ? '🙈 Hide Cards' : '👁️ View Cards'}
                      </AnimatedButton>
                    {(isViewing || isRevealed) && hasCards && (
                      <div className="meaning-cards-grid-display animate-slide-up">
                        {playerMeanings[pName]?.map((card, cardIndex) => (
                          <div key={cardIndex} className="mb-3">
                            <MeaningOfLifeCard
                              meaning={{
                                ...card,
                                description: parseDescription(card.description)
                              }}
                              isSelected={selectedMeanings[pName] === card.name}
                              isRevealed={isRevealed || false}
                              onChoose={() => {
                                if (!isGuest || pName === guestIdentity) onChooseMeaning(pName, card.name);
                              }}
                              isViewing={isViewing}
                              canSelect={!isRevealed && (!isGuest || pName === guestIdentity)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                  )}

                  {!hasCards && (
                    <div className="has-text-centered py-4">
                      <p className="text-muted is-size-7 italic">Waiting for assignment...</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="reveal-control-container box glass mt-8 p-4 border-dashed border-2 border-warning/30">
        <AnimatedButton 
          className="is-warning is-fullwidth py-4 font-bold" 
          onClick={onRevealAll}
          disabled={isGuest}
        >
          {anyRevealed ? '🙈 Hide All Final Meanings' : '⚠️ Reveal All Final Meanings'}
        </AnimatedButton>
      </div>

      <style jsx>{`
        .viewing-active {
          border-color: var(--primary-orange) !important;
          box-shadow: 0 0 15px rgba(252, 163, 17, 0.2) !important;
        }
        .mol-view-toggle {
          background: transparent !important;
          border: 1px solid var(--primary-orange) !important;
          color: var(--primary-orange) !important;
        }
        .mol-view-toggle-active {
          background: var(--primary-orange) !important;
          border: 1px solid var(--primary-orange) !important;
          color: #111 !important;
        }
        .meaning-cards-grid-display {
           display: flex;
           flex-direction: column;
           gap: 12px;
        }
      `}</style>
    </div>
  );
}
