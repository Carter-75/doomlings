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
  onTrinketRemove
}: GameDashboardProps) {
  const currentAge = ageDeck[currentAgeIndex];
  const currentRule = rules[currentRuleIndex];
  const currentChallenge = challenges[currentChallengeIndex];

  return (
    <div className="game-dashboard">
      <div className="columns is-multiline">
        <div className="column is-12">
          <GameTurn
            currentRule={currentRule}
            challengePlayer={null} // We'll pass the player if we extract it from the challenge state
            currentAge={currentAge}
            playerNames={playerNames}
            playerCount={playerCount}
            pocketedTrinkets={pocketedTrinkets}
            trinketState={trinketState}
            trinketsPocketedThisTurn={{}} // This should come from state
            onNextTurn={onNextTurn}
            onTrinketAdd={onTrinketAdd}
            onTrinketRemove={onTrinketRemove}
            onTrinketPocket={onTrinketPocket}
            onResetAll={() => {}} // This will be passed from the page
            isCatastrophe={isCatastrophe}
            isLastAge={currentAgeIndex === ageDeck.length - 1}
          />
        </div>

        <div className="column is-12 mt-4">
          <div className="age-navigation box">
            <div className="is-flex is-justify-content-between is-align-items-center mb-4">
              <AnimatedButton 
                onClick={onPrevAge} 
                className="is-small" 
                disabled={currentAgeIndex <= 0}
              >
                ← Prev Age
              </AnimatedButton>
              <span className="has-text-weight-bold">
                Age {currentAgeIndex + 1} / {ageDeck.length}
              </span>
              <AnimatedButton 
                onClick={onNextAge} 
                className="is-small" 
                disabled={currentAgeIndex >= ageDeck.length - 1}
              >
                Next Age →
              </AnimatedButton>
            </div>

            <div className={`age-display p-5 has-text-centered ${isCatastrophe ? 'catastrophe-age' : ''}`} 
                 style={{ 
                   background: 'rgba(255, 255, 255, 0.02)', 
                   borderRadius: 'var(--border-radius-small)',
                   border: isCatastrophe ? '2px solid var(--error)' : '1px solid rgba(255,255,255,0.05)'
                 }}>
              {currentAge ? (
                <>
                  <h4 className="title is-4 mb-2">{currentAge.name} {isCatastrophe && '🔥'}</h4>
                  <p className="is-italic">{currentAge.description}</p>
                </>
              ) : (
                <p>Generate a deck to see ages.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
