'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';

interface ChallengesSectionProps {
  challenges: any[];
  currentChallengeIndex: number;
  assignedChallenges: { [key: string]: string };
  playerNames: string[];
  playerCount: number;
  onRollChallenge: () => void;
  onAssignChallenge: (playerName: string, challengeName: string) => void;
}

export default function ChallengesSection({
  challenges,
  currentChallengeIndex,
  assignedChallenges,
  playerNames,
  playerCount,
  onRollChallenge,
  onAssignChallenge
}: ChallengesSectionProps) {
  const currentChallenge = challenges[currentChallengeIndex];

  return (
    <div className="challenges-section">
      <h2 className="section-title">Challenges</h2>
      
      <div className="player-control box has-text-centered">
        {currentChallenge ? (
          <div className="current-challenge mb-4 fade-in">
            <h3 className="title is-4" style={{ color: 'var(--primary-orange)' }}>{currentChallenge.name}</h3>
            <p className="subtitle is-6">{currentChallenge.description}</p>
          </div>
        ) : (
          <p className="mb-4">No challenge active. Roll to start!</p>
        )}
        <AnimatedButton className="is-primary is-fullwidth" onClick={onRollChallenge}>
          🎲 Roll New Challenge
        </AnimatedButton>
      </div>

      <div className="assigned-challenges-grid mt-4">
        {playerNames.slice(0, playerCount).map((playerName, index) => {
          const pName = playerName.trim() || `Player ${index + 1}`;
          const assigned = Object.keys(assignedChallenges).find(key => assignedChallenges[key] === pName);
          
          return (
            <div key={index} className="box p-3 mb-3">
              <div className="is-flex is-justify-content-between is-align-items-center">
                <span className="has-text-weight-bold">{pName}</span>
                {assigned ? (
                  <span className="tag is-success">{assigned}</span>
                ) : (
                  <AnimatedButton 
                    className="is-small is-info" 
                    disabled={!currentChallenge}
                    onClick={() => onAssignChallenge(pName, currentChallenge.name)}
                  >
                    Assign Current
                  </AnimatedButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
