'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';
import GameTurn from '@/components/GameTurn';

interface GameDashboardProps {
  ageDeck: any[];
  currentAgeIndex: number;
  rules: any[];
  currentRuleIndex: number;
  challenges: any[];
  currentChallengeIndex: number;
  playerNames: string[];
  playerCount: number;
  pocketedTrinkets: { [key: string]: any[] };
  trinketState: { deck: any[], playerTrinkets: { [key: string]: any[] } };
  onNextTurn: () => void;
  onNextAge: () => void;
  onPrevAge: () => void;
  isCatastrophe: boolean;
  onTrinketPocket: (playerName: string, trinket: any) => void;
  onTrinketAdd: (playerName: string, trinket: any) => void;
  onTrinketRemove: (playerName: string, trinket: any) => void;
  onResetAll: () => void;
}

export default function GameDashboard({
  ageDeck,
  currentAgeIndex,
  rules,
  currentRuleIndex,
  challenges,
  currentChallengeIndex,
  playerNames,
  playerCount,
  pocketedTrinkets,
  trinketState,
  onNextTurn,
  onNextAge,
  onPrevAge,
  isCatastrophe,
  onTrinketPocket,
  onTrinketAdd,
  onTrinketRemove,
  onResetAll
}: GameDashboardProps) {
  const currentAge = ageDeck[currentAgeIndex];
  const currentRule = rules[currentRuleIndex];

  return (
    <div className="game-dashboard animate-fade-in">
      <div className="columns is-multiline">
        <div className="column is-12">
          <GameTurn
            currentRule={currentRule}
            challengePlayer={null}
            currentAge={currentAge}
            playerNames={playerNames}
            playerCount={playerCount}
            pocketedTrinkets={pocketedTrinkets}
            trinketState={trinketState}
            trinketsPocketedThisTurn={{}}
            onNextTurn={onNextTurn}
            onTrinketAdd={onTrinketAdd}
            onTrinketRemove={onTrinketRemove}
            onTrinketPocket={onTrinketPocket}
            onResetAll={onResetAll}
            isCatastrophe={isCatastrophe}
            isLastAge={currentAgeIndex === ageDeck.length - 1}
          />
        </div>

        <div className="column is-12 mt-8">
          <div className="age-navigation-container box glass p-6 border-1 border-white/5 shadow-2xl relative overflow-hidden">
             {/* Subtle background glow */}
             <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" 
                  style={{ background: isCatastrophe ? 'var(--error)' : 'var(--primary-orange)' }}></div>
             
             <div className="is-flex is-justify-content-between is-align-items-center mb-6 border-b border-white/10 pb-4">
                <h3 className="title is-4 m-0 text-secondary">📖 Age Timeline</h3>
                <div className="tag is-dark is-rounded font-bold px-4" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  Age {currentAgeIndex + 1} of {ageDeck.length}
                </div>
             </div>

            <div className="is-flex is-justify-content-center is-align-items-center gap-6 mb-8">
              <AnimatedButton 
                onClick={onPrevAge} 
                className={`button is-medium is-outlined px-6 ${currentAgeIndex <= 0 ? 'opacity-20' : 'is-light hover-scale'}`}
                disabled={currentAgeIndex <= 0}
              >
                ← Previous
              </AnimatedButton>
              
              <div className="age-stepper is-flex gap-2">
                {[...Array(Math.min(ageDeck.length, 12))].map((_, i) => (
                  <div key={i} 
                       className={`stepper-dot ${i === currentAgeIndex ? 'active' : ''} ${i < currentAgeIndex ? 'completed' : ''}`}
                       style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }}>
                  </div>
                ))}
              </div>

              <AnimatedButton 
                onClick={onNextAge} 
                className={`button is-medium is-outlined px-6 ${currentAgeIndex >= ageDeck.length - 1 ? 'opacity-20' : 'is-primary hover-scale'}`} 
                disabled={currentAgeIndex >= ageDeck.length - 1}
              >
                Next Age →
              </AnimatedButton>
            </div>

            <div className={`age-display-preview p-8 has-text-centered rounded-xl transition-all ${isCatastrophe ? 'catastrophe-age shadow-error' : 'shadow-primary'}`} 
                 style={{ 
                   background: isCatastrophe 
                     ? 'rgba(230, 57, 70, 0.08)' 
                     : 'rgba(255, 255, 255, 0.02)', 
                   border: isCatastrophe ? '2px solid rgba(230, 57, 70, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                   backdropFilter: 'blur(10px)'
                 }}>
              {currentAge ? (
                <div className="animate-fade-in">
                  <h4 className="title is-3 mb-3" style={{ color: isCatastrophe ? 'var(--error)' : 'var(--primary-orange)', fontWeight: 800 }}>
                    {currentAge.name} {isCatastrophe && '🔥'}
                  </h4>
                  <p className="is-size-5 text-muted italic px-4">{currentAge.description}</p>
                </div>
              ) : (
                <div className="py-6 opacity-50">
                   <p className="is-size-1 mb-2">🃏</p>
                   <p className="font-bold">No age data available.</p>
                   <p className="is-size-7">Generate a deck in "Age Deck" section.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .stepper-dot.active {
          background: var(--primary-orange);
          box-shadow: 0 0 10px var(--primary-orange);
          border-color: var(--primary-orange) !important;
          transform: scale(1.3);
        }
        .stepper-dot.completed {
          background: rgba(255, 255, 255, 0.4);
        }
        .shadow-error {
          box-shadow: 0 10px 40px rgba(230, 57, 70, 0.2);
        }
        .shadow-primary {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
