'use client';

import React from 'react';
import GameTurn from '@/components/GameTurn';

interface GameDashboardProps {
  ageDeck: any[];
  currentAgeIndex: number;
  rules: any[];
  currentRuleIndex: number;
  challenges: any[];
  currentChallengeIndex: number;
  challengePlayer: string | null;
  playerNames: string[];
  playerCount: number;
  pocketedTrinkets: { [key: string]: any[] };
  trinketState: { deck: any[], playerTrinkets: { [key: string]: any[] } };
  trinketsPocketedThisTurn: { [key: string]: boolean };
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
  challengePlayer,
  playerNames,
  playerCount,
  pocketedTrinkets,
  trinketState,
  trinketsPocketedThisTurn,
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
  const nextCatastropheIndex = ageDeck.findIndex((age, index) => index > currentAgeIndex && Boolean(age?.isCatastrophe));
  const nextCatastropheAgeNumber = nextCatastropheIndex >= 0 ? nextCatastropheIndex + 1 : null;
  const agesUntilNextCatastrophe = nextCatastropheIndex >= 0 ? nextCatastropheIndex - currentAgeIndex : null;

  return (
    <div className="game-dashboard animate-fade-in">
      <div className="columns is-multiline">
        <div className="column is-12">
          <GameTurn
            currentRule={currentRule}
            challengePlayer={challengePlayer}
            currentAge={currentAge}
            currentAgeNumber={currentAgeIndex + 1}
            totalAges={ageDeck.length}
            nextCatastropheAgeNumber={nextCatastropheAgeNumber}
            agesUntilNextCatastrophe={agesUntilNextCatastrophe}
            playerNames={playerNames}
            playerCount={playerCount}
            pocketedTrinkets={pocketedTrinkets}
            trinketState={trinketState}
            trinketsPocketedThisTurn={trinketsPocketedThisTurn}
            onNextTurn={onNextTurn}
            onTrinketAdd={onTrinketAdd}
            onTrinketRemove={onTrinketRemove}
            onTrinketPocket={onTrinketPocket}
            onResetAll={onResetAll}
            isCatastrophe={isCatastrophe}
            isLastAge={currentAgeIndex === ageDeck.length - 1}
          />
        </div>
      </div>
    </div>
  );
}
