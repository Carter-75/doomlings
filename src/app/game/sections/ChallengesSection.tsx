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
    <div className="challenges-section animate-fade-in">
      <h2 className="section-title">Challenges</h2>
      
      <div className="challenge-display-container box glass p-6 mt-6 has-text-centered shadow-lg">
        {currentChallenge ? (
          <div className="current-challenge mb-6 fade-in p-4 border-2 border-white/5 bg-black/20 rounded-xl glass-light">
            <h3 className="title is-4 mb-2" style={{ color: 'var(--primary-orange)', fontWeight: 800 }}>{currentChallenge.name}</h3>
            <p className="subtitle is-6 text-muted font-italic">{currentChallenge.description}</p>
          </div>
        ) : (
          <div className="no-challenge mb-6 p-8 border-2 border-dashed border-white/10 rounded-xl">
             <p className="text-muted is-size-5">No challenge active. Roll to start!</p>
          </div>
        )}
        <AnimatedButton id="roll-challenge-btn" className="is-primary is-fullwidth button-premium py-6" onClick={onRollChallenge}>
          🎲 Roll New Challenge
        </AnimatedButton>
      </div>

      <div className="assigned-challenges-container mt-8">
        <h4 className="title is-5 text-secondary pl-2 mb-4">Player Assignments</h4>
        <div className="columns is-multiline">
          {playerNames.slice(0, playerCount).map((playerName, index) => {
            const pName = playerName.trim() || `Player ${index + 1}`;
            const assigned = Object.keys(assignedChallenges).find(key => assignedChallenges[key] === pName);
            
            return (
              <div key={index} className="column is-half-tablet is-one-third-desktop">
                <div className="box glass-light p-4 h-full border-white/5 hover-scale transition-all">
                  <div className="is-flex is-flex-direction-column is-justify-content-center is-align-items-center gap-3">
                    <span className="has-text-weight-bold is-size-5 mb-1">{pName}</span>
                    {assigned ? (
                      <span className="tag is-success is-medium px-4 font-bold border-1 border-white/20 shadow-sm">{assigned}</span>
                    ) : (
                      <AnimatedButton 
                        className="is-small is-info px-6 is-outlined" 
                        disabled={!currentChallenge}
                        onClick={() => onAssignChallenge(pName, currentChallenge.name)}
                      >
                        Assign Current
                      </AnimatedButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
