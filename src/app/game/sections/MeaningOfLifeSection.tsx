'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';
import MeaningOfLifeCard from '@/components/MeaningOfLifeCard';

interface MeaningOfLifeSectionProps {
  playerNames: string[];
  playerCount: number;
  playerMeanings: { [key: string]: any[] };
  selectedMeanings: { [key: string]: string };
  revealedMeanings: { [key: string]: boolean };
  onAssignMeanings: () => void;
  onRevealAll: () => void;
  onChooseMeaning: (playerName: string, cardName: string) => void;
  onToggleViewPlayer: (playerName: string) => void;
  viewingPlayer: string | null;
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
  viewingPlayer
}: MeaningOfLifeSectionProps) {
  return (
    <div className="meaning-of-life-section">
      <h2 className="section-title">Meaning of Life</h2>
      
      <div className="player-control box mb-4">
        <AnimatedButton className="is-primary is-fullwidth" onClick={onAssignMeanings}>
          Assign Meaning of Life Cards
        </AnimatedButton>
      </div>

      <div className="player-meaning-cards-grid">
        {playerNames.slice(0, playerCount).map((playerName, index) => {
          const pName = playerName.trim() || `Player ${index + 1}`;
          const hasCards = playerMeanings[pName] && playerMeanings[pName].length > 0;
          const isRevealed = revealedMeanings[pName];
          const isViewing = viewingPlayer === pName;

          return (
            <div key={index} className="player-meaning-card-container box mb-4">
              <h3 className="title is-5 has-text-centered">{pName}</h3>
              
              {hasCards && !isRevealed && (
                <div className="mb-3">
                  <AnimatedButton 
                    className="is-info is-small is-fullwidth"
                    onClick={() => onToggleViewPlayer(pName)}
                  >
                    {isViewing ? 'Hide Cards' : 'View Cards'}
                  </AnimatedButton>
                </div>
              )}

              {(isViewing || isRevealed) && hasCards && (
                <div className="meaning-cards-container">
                  {playerMeanings[pName]?.map((card, cardIndex) => (
                    <MeaningOfLifeCard
                      key={cardIndex}
                      card={card}
                      isSelected={selectedMeanings[pName] === card.name}
                      isRevealed={isRevealed || false}
                      onChoose={() => onChooseMeaning(pName, card.name)}
                      isViewing={isViewing}
                      canSelect={!isRevealed}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="player-control box mt-4">
        <AnimatedButton className="is-warning is-fullwidth" onClick={onRevealAll}>
          Reveal All Meanings
        </AnimatedButton>
      </div>
    </div>
  );
}
