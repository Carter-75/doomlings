import React from 'react';
import AnimatedButton from './AnimatedButton';
import TrinketCard from './TrinketCard';
import { Rule, Age, Trinket, TrinketState } from '../lib/types';

interface GameTurnProps {
  playerCount: number;
  playerNames: string[];
  currentRule: Rule | null;
  challengePlayer: string | null;
  currentAge: Age | null;
  isCatastrophe: boolean;
  isLastAge: boolean;
  trinketState: TrinketState;
  pocketedTrinkets: { [key: string]: Trinket[] };
  onNextTurn: () => void;
  handleTrinketAdd: (playerName: string, trinket: Trinket) => void;
  handleTrinketRemove: (playerName: string, trinket: Trinket) => void;
  handleTrinketPocket: (playerName: string, trinket: Trinket) => void;
}

const GameTurn: React.FC<GameTurnProps> = ({
  playerCount,
  playerNames,
  currentRule,
  challengePlayer,
  currentAge,
  isCatastrophe,
  isLastAge,
  trinketState,
  pocketedTrinkets,
  onNextTurn,
  handleTrinketAdd,
  handleTrinketRemove,
  handleTrinketPocket,
}) => {
  return (
    <div id="gameTurn" className="section-content">
      <h1 className="title is-2 has-text-centered page-title">Game Turn</h1>
      <div className="player-control box">
        <AnimatedButton className="is-primary is-fullwidth" onClick={onNextTurn}>
          Start Next Turn (New Age & Challenge)
        </AnimatedButton>
      </div>

      <div className="columns is-variable is-2-mobile is-4-desktop is-stretch">
        <div className="column">
          <div className="age-config box">
            <h2 className="title is-4 has-text-centered">Challenge</h2>
            <div className="age-display mt-4 has-text-centered">
              {currentRule ? (
                <div className="rule-display">
                  {challengePlayer && (
                    <h3 className="challenge-player-title">For: {challengePlayer}</h3>
                  )}
                  <h4>{currentRule.title}</h4>
                  <p>{currentRule.description}</p>
                </div>
              ) : <p>Roll for a new challenge.</p>}
            </div>
          </div>
        </div>
        <div className="column">
          <div className={`age-display box has-text-centered ${isCatastrophe ? 'catastrophe-age' : ''}`}>
             <h2 className="title is-4 has-text-centered">Current Age</h2>
            {currentAge ? (
              <>
                {isLastAge && (
                    <p className="has-text-weight-bold is-size-5" style={{ color: isCatastrophe ? '#e74c3c' : 'var(--gold-light)'}}>
                        {isCatastrophe ? 'Final Catastrophe!' : 'The Last Age!'}
                    </p>
                )}
                <h4 className="title is-4 mt-4">{currentAge.name}</h4>
                <p>{currentAge.description}</p>
              </>
            ) : <p className="mt-4">No age drawn.</p>}
          </div>
        </div>
      </div>

        <div className="player-trinkets-main-container mt-4">
            <h2 className="section-title">Player Trinkets</h2>
            <div className="columns is-multiline">
            {playerNames.slice(0, playerCount).filter(name => name.trim() !== '').map((playerName, index) => {
                const pName = playerName.trim();
                const currentTrinkets = trinketState.playerTrinkets[pName] || [];
                const pocketed = pocketedTrinkets[pName] || [];
                const totalPoints = pocketed.reduce((sum, t) => sum + t.points, 0);

                return (
                    <div key={`${pName}-${index}`} className="column is-full-touch is-half-desktop">
                        <div className="player-trinket-section box">
                            <h3 className="title is-5 has-text-centered">{pName}</h3>
                            <div className="trinkets-container">
                                {currentTrinkets.map((trinket, tIndex) => (
                                <TrinketCard
                                    key={`${trinket.name}-${tIndex}`}
                                    trinket={trinket}
                                    onAdd={() => handleTrinketAdd(pName, trinket)}
                                    onRemove={() => handleTrinketRemove(pName, trinket)}
                                    onPocket={() => handleTrinketPocket(pName, trinket)}
                                    isPocketDisabled={currentTrinkets.length !== 1}
                                />
                                ))}
                            </div>
                            {pocketed.length > 0 && (
                                <div className="pocketed-trinkets mt-4">
                                <h4 className='title is-6'>Pocketed Points: {totalPoints}</h4>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
            </div>
        </div>
    </div>
  );
};

export default GameTurn; 