'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';

interface ChallengesSectionProps {
  challenges: any[];
  currentChallengeIndex: number;
  assignedChallenges: { [key: string]: string };
  playerNames: string[];
  playerCount: number;
  catastropheMode: boolean;
  currentRule: any | null;
  challengePlayer: string | null;
  onRollChallenge: () => void;
  onAssignChallenge: (playerName: string, challengeName: string) => void;
  onCatastropheToggle: (checked: boolean) => void;
  manualCatastropheOverride: boolean;
  isCatastrophe: boolean;
  currentAge: any | null;
  isGuest?: boolean;
}

export default function ChallengesSection({
  playerNames,
  playerCount,
  catastropheMode,
  currentRule,
  challengePlayer,
  onRollChallenge,
  onCatastropheToggle,
  manualCatastropheOverride,
  isCatastrophe,
  currentAge,
  isGuest,
}: ChallengesSectionProps) {
  const activePlayers = playerNames.slice(0, playerCount).filter(n => n.trim());
  const parsedChallenge = React.useMemo(() => {
    if (!currentRule) {
      return null;
    }

    if (typeof currentRule === 'string') {
      const [rawTitle, ...rest] = currentRule.split(':');
      const cleanedTitle = (rawTitle || '').replace(/^\s*\d+\.\s*/, '').trim();
      const description = rest.join(':').trim();

      return {
        title: cleanedTitle || currentRule,
        description: description || currentRule,
      };
    }

    return {
      title: currentRule.title || currentRule.name || currentRule.challenge || 'Challenge',
      description: currentRule.description || currentRule.rule || currentRule.text || '',
    };
  }, [currentRule]);

  return (
    <div className="challenges-section animate-fade-in">
      <h2 className="section-title">Challenges</h2>

      {/* Catastrophe Mode Toggle */}
      <div className="box glass p-5 mt-6 mb-4">
        <div className="is-flex is-align-items-center is-justify-content-space-between">
          <div>
            <p className="font-bold" style={{ color: catastropheMode ? 'var(--error)' : 'var(--text-muted)' }}>
              🐱 Catastrophe Mode {catastropheMode ? '(ACTIVE)' : ''}
            </p>
            {currentAge && isCatastrophe && !manualCatastropheOverride && (
              <p className="is-size-7 text-muted mt-1">⚡ Auto-enabled for current Catastrophe Age</p>
            )}
            {manualCatastropheOverride && (
              <p className="is-size-7 text-muted mt-1">🖱️ Manual Override Active (resets on next turn)</p>
            )}
          </div>
          <div
            onClick={() => {
              if (!isGuest) onCatastropheToggle(!catastropheMode);
            }}
            style={{
              width: 48, height: 26, borderRadius: 13, cursor: isGuest ? 'not-allowed' : 'pointer',
              background: catastropheMode ? 'var(--error)' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.3s', flexShrink: 0,
              opacity: isGuest ? 0.5 : 1
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: catastropheMode ? 25 : 3,
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              transition: 'left 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }} />
          </div>
        </div>
      </div>

      {/* Challenge Display */}
      <div className="challenge-display-container box glass p-6 mt-2 has-text-centered shadow-lg">
        {parsedChallenge ? (
          <div className={`current-challenge mb-6 animate-fade-in p-5 rounded-xl ${catastropheMode ? 'glass-light border-2' : 'glass-light'}`}
            style={{ borderColor: catastropheMode ? 'rgba(255,50,50,0.3)' : 'rgba(255,255,255,0.05)' }}>
            {challengePlayer && (
              <div className="mb-3">
                <span className="tag is-medium font-bold px-5 py-2" style={{
                  background: catastropheMode ? 'rgba(255,50,50,0.2)' : 'rgba(252,163,17,0.2)',
                  color: catastropheMode ? 'var(--error)' : 'var(--primary-orange)',
                  border: `1px solid ${catastropheMode ? 'rgba(255,50,50,0.4)' : 'rgba(252,163,17,0.4)'}`,
                  borderRadius: 20, letterSpacing: '0.5px',
                }}>
                  🎯 Challenge for: {challengePlayer}
                </span>
              </div>
            )}
            <h3 className="title is-4 mb-2" style={{ color: catastropheMode ? 'var(--error)' : 'var(--primary-orange)', fontWeight: 800 }}>
              {parsedChallenge.title}
            </h3>
            {parsedChallenge.description && (
              <p className="subtitle is-6 text-muted">{parsedChallenge.description}</p>
            )}
          </div>
        ) : (
          <div className="no-challenge mb-6 p-8 border-2 border-dashed border-white/10 rounded-xl">
            <p className="text-muted is-size-5">No challenge active. Roll to start!</p>
          </div>
        )}
        <AnimatedButton
          id="roll-challenge-btn"
          className={`is-fullwidth button-premium py-6 ${catastropheMode ? 'is-danger' : 'is-primary'}`}
          onClick={onRollChallenge}
          disabled={isGuest}
        >
          🎲 Roll New Challenge
        </AnimatedButton>
        {currentRule && (
          <p className="mt-3 is-size-7 text-muted italic">
            The challenge target is picked randomly from your active players.
          </p>
        )}
      </div>

      {/* Active Players (just display, no manual assignment) */}
      {activePlayers.length > 0 && (
        <div className="mt-8">
          <h4 className="title is-5 text-secondary pl-2 mb-4">Active Players</h4>
          <div className="columns is-multiline">
            {activePlayers.map((pName, index) => {
              const isCurrentTarget = pName === challengePlayer;
              return (
                <div key={index} className="column is-half-tablet is-one-third-desktop">
                  <div
                    className="box p-4 h-full has-text-centered transition-all"
                    style={{
                      background: isCurrentTarget ? 'rgba(252,163,17,0.1)' : 'rgba(255,255,255,0.03)',
                      border: isCurrentTarget ? '2px solid rgba(252,163,17,0.5)' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 16,
                      boxShadow: isCurrentTarget ? '0 0 20px rgba(252,163,17,0.15)' : 'none',
                    }}
                  >
                    <p className="font-bold is-size-5">{pName}</p>
                    {isCurrentTarget && (
                      <span className="tag is-warning is-rounded mt-2 font-bold is-small">🎯 This Turn's Challenge</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
