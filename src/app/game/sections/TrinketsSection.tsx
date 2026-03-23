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
    <div className="trinkets-section animate-fade-in">
      <h2 className="section-title">Trinkets</h2>
      
      <div className="player-control box glass p-6 mt-6 has-text-centered shadow-lg">
        <AnimatedButton id="assign-trinkets-btn" className="is-primary is-fullwidth button-premium py-6" onClick={onAssignTrinkets}>
          💎 Assign Trinkets
        </AnimatedButton>
        <p className="has-text-centered mt-4 is-size-7 text-muted italic">
          Each player receives 2 trinkets to pick from. <br/>
          Trinkets Left in Deck: <span className="text-white font-bold">{trinketState.deck.length}</span>
        </p>
      </div>

      <div className="player-trinkets-container mt-8">
        <h4 className="title is-5 text-secondary pl-2 mb-4">Player Trinkets & Pocketed Points</h4>
        <div className="columns is-multiline">
          {playerNames.slice(0, playerCount).filter(n => n.trim()).map((playerName, index) => {
            const pName = playerName.trim();
            const currentTrinkets = trinketState.playerTrinkets[pName] || [];
            const pocketed = pocketedTrinkets[pName] || [];
            const totalPoints = pocketed.reduce((sum, t) => sum + t.points, 0);

            return (
              <div key={index} className="column is-half-tablet is-one-third-desktop">
                <div className="player-trinket-box box glass-light p-4 h-full border-white/5 transition-all">
                  <h3 className="title is-5 mb-4 has-text-centered border-b border-white/10 pb-2">{pName}</h3>
                  
                  <div className="trinkets-display-grid mb-4">
                    {currentTrinkets.map((trinket, tIndex) => (
                      <div key={tIndex} className="mb-2">
                        <TrinketCard
                          trinket={trinket}
                          onAdd={() => onTrinketAdd(pName, trinket)}
                          onRemove={() => onTrinketRemove(pName, trinket)}
                          onPocket={() => onTrinketPocket(pName, trinket)}
                          isPocketDisabled={currentTrinkets.length !== 1}
                        />
                      </div>
                    ))}
                    {currentTrinkets.length === 0 && pocketed.length === 0 && (
                      <p className="has-text-centered text-muted is-size-7 italic py-4">Waiting for trinkets...</p>
                    )}
                  </div>

                  {pocketed.length > 0 && (
                    <div className="pocketed-trinkets-info mt-4 pt-3 border-t border-white/10">
                      <div className="is-flex is-justify-content-between is-align-items-center">
                        <span className="text-muted is-size-7 uppercase letter-spacing-1">Pocketed Points</span>
                        <span className="tag is-success is-rounded font-bold shadow-sm">+{totalPoints}</span>
                      </div>
                      <div className="mt-2 is-flex is-flex-wrap-wrap gap-1">
                        {pocketed.map((t, idx) => (
                          <span key={idx} className="tag is-dark is-small opacity-80" title={t.name}>💎</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
