'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';
import TrinketCard from '@/components/TrinketCard';

interface TrinketsSectionProps {
  playerNames: string[];
  playerCount: number;
  trinketState: { deck: any[], playerTrinkets: { [key: string]: any[] } };
  pocketedTrinkets: { [key: string]: any[] };
  onAssignTrinkets: () => void;
  onTrinketAdd: (playerName: string, trinket: any) => void;
  onTrinketRemove: (playerName: string, trinket: any) => void;
  onTrinketPocket: (playerName: string, trinket: any) => void;
}

export default function TrinketsSection({
  playerNames,
  playerCount,
  trinketState,
  pocketedTrinkets,
  onAssignTrinkets,
  onTrinketAdd,
  onTrinketRemove,
  onTrinketPocket
}: TrinketsSectionProps) {
  return (
    <div className="trinkets-section">
      <h2 className="section-title">Trinkets</h2>
      
      <div className="player-control box mb-4">
        <AnimatedButton className="is-primary is-fullwidth" onClick={onAssignTrinkets}>
          Assign Trinkets
        </AnimatedButton>
        <p className="has-text-centered mt-2 is-size-7 text-muted">
          Trinkets Left in Deck: {trinketState.deck.length}
        </p>
      </div>

      <div className="player-trinkets-grid">
        {playerNames.slice(0, playerCount).filter(n => n.trim()).map((playerName, index) => {
          const pName = playerName.trim();
          const currentTrinkets = trinketState.playerTrinkets[pName] || [];
          const pocketed = pocketedTrinkets[pName] || [];
          const totalPoints = pocketed.reduce((sum, t) => sum + t.points, 0);

          return (
            <div key={index} className="player-trinket-section box mb-4">
              <h3 className="title is-5 has-text-centered">{pName}</h3>
              
              <div className="trinkets-container mb-3">
                {currentTrinkets.map((trinket, tIndex) => (
                  <TrinketCard
                    key={tIndex}
                    trinket={trinket}
                    onAdd={() => onTrinketAdd(pName, trinket)}
                    onRemove={() => onTrinketRemove(pName, trinket)}
                    onPocket={() => onTrinketPocket(pName, trinket)}
                    isPocketDisabled={currentTrinkets.length !== 1}
                  />
                ))}
              </div>

              {pocketed.length > 0 && (
                <div className="pocketed-trinkets-info mt-2 pt-2 border-t border-white/5">
                  <p className="has-text-weight-bold">Pocketed Points: {totalPoints}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
