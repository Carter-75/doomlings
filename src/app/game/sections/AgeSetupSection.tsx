'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';

interface AgeSetupSectionProps {
  normalAgeCount: number;
  merchantAgeCount: number;
  catastropheAgeCount: number;
  finalCatastropheMode: boolean;
  ageMultiplierMode: 'auto' | 'manual';
  manualAgeMultiplier: number;
  normalAgesMax: number;
  merchantAgesMax: number;
  catastropheAgesMax: number;
  ageDeck: any[];
  currentAgeIndex: number;
  catastrophesInDeck: any[];
  showCatastropheList: boolean;
  isCatastrophe: boolean;
  onNormalAgeCountChange: (n: number) => void;
  onMerchantAgeCountChange: (n: number) => void;
  onCatastropheAgeCountChange: (n: number) => void;
  onFinalCatastropheModeChange: (v: boolean) => void;
  onAgeMultiplierModeChange: (m: 'auto' | 'manual') => void;
  onManualAgeMultiplierChange: (v: number) => void;
  onGenerateDeck: () => void;
  onPrevAge: () => void;
  onNextAge: () => void;
  onToggleCatastropheList: () => void;
  calculateScalingMultiplier: () => number;
}

export default function AgeSetupSection({
  normalAgeCount, merchantAgeCount, catastropheAgeCount,
  finalCatastropheMode, ageMultiplierMode, manualAgeMultiplier,
  normalAgesMax, merchantAgesMax, catastropheAgesMax,
  ageDeck, currentAgeIndex, catastrophesInDeck, showCatastropheList, isCatastrophe,
  onNormalAgeCountChange, onMerchantAgeCountChange, onCatastropheAgeCountChange,
  onFinalCatastropheModeChange, onAgeMultiplierModeChange, onManualAgeMultiplierChange,
  onGenerateDeck, onPrevAge, onNextAge, onToggleCatastropheList, calculateScalingMultiplier,
}: AgeSetupSectionProps) {
  const currentAge = ageDeck.length > 0 ? ageDeck[currentAgeIndex] : null;
  const totalAges = normalAgeCount + merchantAgeCount + catastropheAgeCount;
  const sM = calculateScalingMultiplier();

  return (
    <div className="age-setup-section animate-fade-in">
      <h2 className="section-title">Age Deck Setup</h2>

      <div className="box glass p-6 mt-6">
        <div className="columns is-multiline">
          {/* Normal Ages */}
          <div id="normal-ages-count" className="column is-half-tablet">
            <div className="field box glass-light p-4 h-full">
              <label className="label text-secondary mb-3">🌱 Normal Ages: <span className="text-white font-bold">{normalAgeCount}</span></label>
              <input
                type="range" min="0" max={normalAgesMax} value={normalAgeCount}
                onChange={(e) => onNormalAgeCountChange(parseInt(e.target.value))}
                className="slider is-fullwidth custom-slider"
              />
              {normalAgeCount > 0 && (
                <p className="is-size-7 text-muted mt-2">"The Birth of Life" will be first</p>
              )}
            </div>
          </div>

          {/* Catastrophe Ages */}
          <div id="catastrophe-ages-count" className="column is-half-tablet">
            <div className="field box glass-light p-4 h-full">
              <label className="label text-error mb-3">🐱 Catastrophes: <span className="text-white font-bold">{catastropheAgeCount}</span></label>
              <input
                type="range" min="0" max={catastropheAgesMax} value={catastropheAgeCount}
                onChange={(e) => onCatastropheAgeCountChange(parseInt(e.target.value))}
                className="slider is-fullwidth custom-slider-red"
              />
              <label className="checkbox label mt-4 is-size-7 text-muted">
                <input type="checkbox" checked={finalCatastropheMode} onChange={e => onFinalCatastropheModeChange(e.target.checked)} className="mr-2 custom-checkbox" />
                Final Catastrophe at end
              </label>
            </div>
          </div>

          {/* Merchant Ages */}
          <div id="merchant-ages-count" className="column is-half-tablet">
            <div className="field box glass-light p-4">
              <label className="label text-info mb-3">🏪 Merchant Ages: <span className="text-white font-bold">{merchantAgeCount}</span></label>
              <input
                type="range" min="0" max={merchantAgesMax} value={merchantAgeCount}
                onChange={(e) => onMerchantAgeCountChange(parseInt(e.target.value))}
                className="slider is-fullwidth custom-slider-blue"
              />
            </div>
          </div>

          {/* MoL Scaling */}
          <div id="mol-scaling" className="column is-half-tablet">
            <div className="field box glass-light p-4">
              <label className="label text-accent mb-3">📊 MoL Scaling (sM): <span className="text-white font-bold">{sM.toFixed(1)}x</span></label>
              <div className="is-flex gap-3 mb-3">
                <label className="radio-option is-flex is-align-items-center gap-2 cursor-pointer">
                  <input type="radio" name="ageMultMode" value="auto" checked={ageMultiplierMode === 'auto'} onChange={() => onAgeMultiplierModeChange('auto')} />
                  <span className="is-size-7">Auto ({totalAges}/20 ages)</span>
                </label>
                <label className="radio-option is-flex is-align-items-center gap-2 cursor-pointer">
                  <input type="radio" name="ageMultMode" value="manual" checked={ageMultiplierMode === 'manual'} onChange={() => onAgeMultiplierModeChange('manual')} />
                  <span className="is-size-7">Manual</span>
                </label>
              </div>
              {ageMultiplierMode === 'manual' && (
                <input
                  type="range" min="1" max="10" step="0.1" value={manualAgeMultiplier}
                  onChange={(e) => onManualAgeMultiplierChange(parseFloat(e.target.value))}
                  className="slider is-fullwidth custom-slider"
                />
              )}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-8 px-4">
          <AnimatedButton
            id="generate-deck-btn"
            className="is-primary is-large is-fullwidth button-premium py-6"
            onClick={onGenerateDeck}
          >
            🎴 {ageDeck.length > 0 ? 'Regenerate Age Deck' : 'Generate Age Deck'}
          </AnimatedButton>
        </div>

        {/* Deck List Toggle */}
        {ageDeck.length > 0 && (
          <div className="mt-4 px-4">
            <AnimatedButton className="is-info is-outlined is-fullwidth" onClick={onToggleCatastropheList}>
              {showCatastropheList ? 'Hide' : 'Show'} All Ages in Deck ({ageDeck.length})
            </AnimatedButton>
          </div>
        )}

        {showCatastropheList && ageDeck.length > 0 && (
          <div className="box glass-light mt-4 p-4">
            <h3 className="title is-5 mb-3">Ages in Deck</h3>
            <ul className="deck-age-list">
              {ageDeck.map((age: any, index: number) => {
                const isCatastropheAge = Boolean((age as any).isCatastrophe || (age as any).worldsEnd);

                return (
                  <li key={index} className={`deck-age-row ${isCatastropheAge ? 'is-catastrophe' : ''}`}>
                    <div className="deck-age-head">
                      <span className="deck-age-index">Age {index + 1}</span>
                      <strong className="deck-age-name">{age.name}</strong>
                      {isCatastropheAge && <span className="deck-cata-badge">CATASTROPHE</span>}
                    </div>
                    {isCatastropheAge && (
                      <div className="deck-worlds-end">
                        <span className="deck-worlds-end-label">World&apos;s End</span>
                        <span className="deck-worlds-end-text">{(age as any).worldsEnd || 'No World\'s End text found'}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {catastrophesInDeck.length > 0 && (
              <p className="is-size-7 text-muted mt-3">
                Total Catastrophes: <strong>{catastrophesInDeck.length}</strong>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Age Navigation */}
      {ageDeck.length > 0 && (
        <div className="age-navigation-card box glass mt-6 p-6">
          <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
            <AnimatedButton onClick={onPrevAge} disabled={currentAgeIndex === 0} className="is-light">← Prev</AnimatedButton>
            <div className="has-text-centered">
              <p className="is-size-7 text-muted uppercase tracking-wide mb-1">Age</p>
              <p className="is-size-4 font-black"><span style={{ color: 'var(--primary-orange)' }}>{currentAgeIndex + 1}</span><span className="text-muted"> / {ageDeck.length}</span></p>
            </div>
            <AnimatedButton onClick={onNextAge} disabled={currentAgeIndex >= ageDeck.length - 1} className="is-light">Next →</AnimatedButton>
          </div>

          {currentAge && (
            <div className={`current-age-display p-5 rounded-xl has-text-centered ${isCatastrophe ? 'glass-light border-2 border-red-500/30' : 'glass-light'}`}>
              {currentAge.name === 'The Birth of Life' && currentAgeIndex === 0 && (
                <span className="tag is-warning is-rounded mb-3" style={{ display: 'inline-block' }}>FIRST AGE</span>
              )}
              {isCatastrophe && (
                <span className="tag is-danger is-rounded mb-3" style={{ display: 'inline-block' }}>🐱 CATASTROPHE AGE</span>
              )}
              <h4 className="title is-4 mb-3">{currentAge.name}</h4>
              <p className="is-size-6 text-muted">{currentAge.description}</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .custom-slider { -webkit-appearance: none; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; outline: none; }
        .custom-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--primary-orange); border-radius: 50%; cursor: pointer; border: 2px solid white; }
        .custom-slider-red { -webkit-appearance: none; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; outline: none; }
        .custom-slider-red::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--error); border-radius: 50%; cursor: pointer; border: 2px solid white; }
        .custom-slider-blue { -webkit-appearance: none; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; outline: none; }
        .custom-slider-blue::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--info, #3273dc); border-radius: 50%; cursor: pointer; border: 2px solid white; }
        .custom-checkbox { accent-color: var(--primary-orange); width: 16px; height: 16px; }

        .deck-age-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .deck-age-row {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
          padding: 12px;
        }
        .deck-age-row.is-catastrophe {
          border-color: rgba(230, 57, 70, 0.45);
          background: linear-gradient(135deg, rgba(230, 57, 70, 0.16), rgba(255, 255, 255, 0.02));
          box-shadow: inset 0 0 0 1px rgba(230, 57, 70, 0.12);
        }
        .deck-age-head {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .deck-age-index {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: rgba(var(--secondary-rgb), 0.95);
          border: 1px solid rgba(var(--secondary-rgb), 0.35);
          border-radius: 999px;
          padding: 2px 8px;
        }
        .deck-age-name {
          font-size: 0.95rem;
          color: var(--text-primary);
          font-weight: 700;
        }
        .deck-cata-badge {
          margin-left: auto;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--error);
          border: 1px solid rgba(230, 57, 70, 0.45);
          border-radius: 999px;
          padding: 2px 8px;
          background: rgba(230, 57, 70, 0.14);
        }
        .deck-worlds-end {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px dashed rgba(230, 57, 70, 0.35);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .deck-worlds-end-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 800;
          color: rgba(255, 220, 220, 0.9);
        }
        .deck-worlds-end-text {
          font-size: 0.86rem;
          color: rgba(255, 235, 235, 0.95);
          line-height: 1.35;
        }
      `}</style>
    </div>
  );
}
