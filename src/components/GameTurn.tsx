import React from 'react';
import AnimatedButton from './AnimatedButton';
import TrinketCard from './TrinketCard';
import { Rule, Age, Trinket, TrinketState } from '../lib/types';
import { useCardImage } from '../hooks/useCardImage';

interface GameTurnProps {
  playerCount: number;
  playerNames: string[];
  currentRule: any | null;
  challengePlayer: string | null;
  currentAge: any | null;
  isCatastrophe: boolean;
  isLastAge: boolean;
  trinketState: { deck: any[], playerTrinkets: { [key: string]: any[] } };
  pocketedTrinkets: { [key: string]: any[] };
  trinketsPocketedThisTurn: { [key: string]: boolean };
  onNextTurn: () => void;
  onTrinketAdd: (playerName: string, trinket: any) => void;
  onTrinketRemove: (playerName: string, trinket: any) => void;
  onTrinketPocket: (playerName: string, trinket: any) => void;
  onResetAll: () => void;
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
  trinketsPocketedThisTurn,
  onNextTurn,
  onTrinketAdd,
  onTrinketRemove,
  onTrinketPocket,
  onResetAll
}) => {
  const { getCardImage } = useCardImage();
  const cardArtUrl = currentAge ? getCardImage(currentAge.name) : null;
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [cardArtUrl]);

  return (
    <div id="gameTurn" className="section-content animate-fade-in">
      <h1 className="title is-2 has-text-centered page-title mb-6">Game Turn</h1>
      
      <div className="player-control box glass p-6 mb-8 shadow-lg has-text-centered">
        <AnimatedButton className="is-primary is-large is-fullwidth button-premium py-6" onClick={onNextTurn}>
          🚀 Start Next Turn (New Age & Challenge)
        </AnimatedButton>
      </div>

      <div className="columns is-variable is-4-desktop is-stretch">
        <div className="column">
          <div className="age-config box glass h-full p-6 border-1 border-white/5 shadow-xl">
            <h2 className="title is-4 has-text-centered text-secondary mb-6 pl-2 border-b border-white/10 pb-3">⚡ Current Challenge</h2>
            <div className={`challenge-display mt-4 p-6 has-text-centered rounded-xl glass-light transition-all ${isCatastrophe ? 'catastrophe-mode' : ''}`}
                 style={{ 
                   minHeight: '200px', 
                   display: 'flex', 
                   flexDirection: 'column', 
                   justifyContent: 'center',
                   border: isCatastrophe ? '2px solid var(--error)' : '2px dashed rgba(255, 255, 255, 0.1)',
                   background: isCatastrophe ? 'rgba(230, 57, 70, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                 }}>
              {currentRule ? (
                <div className="animate-fade-in">
                  {challengePlayer && (
                    <div className="tag is-warning is-medium mb-4 px-4 font-bold shadow-sm">FOR: {challengePlayer}</div>
                  )}
                  <h4 className="title is-4 mb-3" style={{ color: isCatastrophe ? 'var(--error)' : 'var(--primary-orange)', fontWeight: 800 }}>{currentRule.title}</h4>
                  <p className="is-size-6 text-muted font-italic">{currentRule.description}</p>
                </div>
              ) : (
                <div className="py-8 opacity-50">
                   <p className="mb-4 is-size-2">🎲</p>
                   <p>Roll for a new challenge in the <br/><strong>Challenges</strong> tab.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="column">
          <div className={`age-display-container box glass h-full p-6 border-1 border-white/5 shadow-xl ${isCatastrophe ? 'catastrophe-age' : ''}`}>
            <h2 className="title is-4 has-text-centered text-secondary mb-6 pl-2 border-b border-white/10 pb-3">📅 Current Age</h2>
            {currentAge ? (
              <div className="animate-fade-in has-text-centered">
                {isLastAge && (
                  <div className="tag is-danger is-medium mb-4 px-6 font-black uppercase ring-2 ring-danger animate-pulse">
                    {isCatastrophe ? 'Final Catastrophe!' : 'The Last Age!'}
                  </div>
                )}
                
                <div className="card-art-container mb-6 is-flex is-justify-content-center">
                  {cardArtUrl && !imgError ? (
                    <div className="card-premium shadow-2xl hover-scale transition-all">
                      <img
                        src={cardArtUrl}
                        alt={currentAge.name}
                        onError={() => setImgError(true)}
                        className="rounded-lg"
                        style={{
                          width: '100%',
                          maxWidth: '220px',
                          display: 'block'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="placeholder-card glass-light shadow-2xl hover-scale transition-all" 
                         style={{ 
                           width: '200px', 
                           height: '280px', 
                           borderRadius: '12px',
                           border: '2px solid' + (isCatastrophe ? ' var(--error)' : ' var(--primary-orange)'),
                           background: isCatastrophe ? 'rgba(230, 57, 70, 0.2)' : 'rgba(252, 163, 17, 0.1)',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           fontSize: '64px'
                         }}>
                      {isCatastrophe ? '🔥' : '🌱'}
                    </div>
                  )}
                </div>

                <h4 className="title is-4 mb-2" style={{ color: isCatastrophe ? 'var(--error)' : 'var(--primary-orange)', fontWeight: 800 }}>{currentAge.name}</h4>
                <p className="is-size-6 text-muted italic px-4">{currentAge.description}</p>
              </div>
            ) : (
              <div className="py-12 opacity-50 has-text-centered">
                 <p className="mb-4 is-size-2">🃏</p>
                 <p>No age drawn. <br/>Go to <strong>Age Deck</strong> to start.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="trinkets-section" className="player-trinkets-main-container mt-12 animate-fade-in">
        <h2 className="section-title">Player Trinkets</h2>
        <div className="columns is-multiline mt-4">
          {playerNames.slice(0, playerCount).filter(name => name.trim() !== '').map((playerName, index) => {
            const pName = playerName.trim();
            const currentTrinkets = trinketState.playerTrinkets[pName] || [];
            const pocketed = pocketedTrinkets[pName] || [];
            const totalPoints = pocketed.reduce((sum, t) => sum + t.points, 0);

            return (
              <div key={`${pName}-${index}`} className="column is-full-touch is-half-desktop">
                <div className="player-trinket-section box glass-light p-5 border-1 border-white/5 hover:border-white/20 transition-all">
                  <div className="is-flex is-justify-content-between is-align-items-center mb-4 border-b border-white/10 pb-3">
                    <h3 className="title is-5 mb-0">{pName}</h3>
                    {pocketed.length > 0 && (
                      <span className="tag is-success is-rounded font-bold shadow-sm">
                        Total: {totalPoints}
                      </span>
                    )}
                  </div>
                  
                  <div className="trinkets-grid-compact is-flex is-flex-wrap-wrap gap-4">
                    {currentTrinkets.map((trinket, tIndex) => (
                      <TrinketCard
                        key={`${trinket.name}-${tIndex}`}
                        trinket={trinket}
                        onAdd={() => onTrinketAdd(pName, trinket)}
                        onRemove={() => onTrinketRemove(pName, trinket)}
                        onPocket={() => onTrinketPocket(pName, trinket)}
                        isPocketDisabled={currentTrinkets.length !== 1 || trinketsPocketedThisTurn[pName]}
                        isFogged={trinketsPocketedThisTurn[pName]}
                      />
                    ))}
                    {currentTrinkets.length === 0 && (
                      <div className="py-4 w-full has-text-centered">
                        <p className="text-muted is-size-7 italic">No current trinkets</p>
                      </div>
                    )}
                  </div>

                  {pocketed.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="is-flex is-flex-wrap-wrap gap-1">
                        {pocketed.map((t, idx) => (
                          <div key={idx} className="tag is-dark is-rounded is-small" style={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <span className="mr-1">💎</span> {t.name} ({t.points})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="reset-control-container box glass mt-12 p-8 has-text-centered border-dashed border-2 border-error/20">
        <p className="text-muted mb-4 is-size-7 uppercase letter-spacing-2">Danger Zone</p>
        <AnimatedButton id="reset-all-btn" className="is-danger is-outlined py-4 px-12" onClick={onResetAll}>
          ⚠️ Reset All App Data
        </AnimatedButton>
        <p className="mt-4 text-error is-size-7 italic opacity-70">This will clear all game state and local names.</p>
      </div>

      <style jsx>{`
        .card-premium {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(252, 163, 17, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .catastrophe-age .card-premium {
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(230, 57, 70, 0.3);
        }
      `}</style>
    </div>
  );
};

export default GameTurn;