'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';

interface AgeSetupSectionProps {
  onGenerateDeck: (options: { includeBirth: boolean; merchantAges: number; includeFinalCatastrophe: boolean }) => void;
  ageDeckLength: number;
}

export default function AgeSetupSection({ onGenerateDeck, ageDeckLength }: AgeSetupSectionProps) {
  const [includeBirth, setIncludeBirth] = React.useState(true);
  const [normalAges, setNormalAges] = React.useState(9);
  const [catastropheAges, setCatastropheAges] = React.useState(3);
  const [merchantAges, setMerchantAges] = React.useState(0);
  const [includeFinalCatastrophe, setIncludeFinalCatastrophe] = React.useState(true);
  const [molScaling, setMolScaling] = React.useState('Auto');

  return (
    <div className="age-setup-section animate-fade-in">
      <h2 className="section-title">Age Deck Setup</h2>
      
      <div className="box glass p-6 mt-6">
        <div className="columns is-multiline">
          {/* Normal Ages */}
          <div id="normal-ages-count" className="column is-half-tablet">
            <div className="field box glass-light p-4 h-full">
              <label className="label text-secondary mb-3">🌱 Normal Ages</label>
              <div className="is-flex is-align-items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="3"
                  value={normalAges}
                  onChange={(e) => setNormalAges(parseInt(e.target.value))}
                  className="slider is-fullwidth custom-slider"
                />
                <span className="tag is-primary is-medium font-bold" style={{ minWidth: '40px' }}>{normalAges}</span>
              </div>
              <label className="checkbox label mt-4 is-size-7 text-muted">
                <input 
                  type="checkbox" 
                  checked={includeBirth} 
                  onChange={e => setIncludeBirth(e.target.checked)} 
                  className="mr-2 custom-checkbox"
                />
                Include "The Birth of Life"
              </label>
            </div>
          </div>

          {/* Catastrophes */}
          <div id="catastrophe-ages-count" className="column is-half-tablet">
            <div className="field box glass-light p-4 h-full">
              <label className="label text-error mb-3">🐱 Catastrophes</label>
              <div className="is-flex is-align-items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={catastropheAges}
                  onChange={(e) => setCatastropheAges(parseInt(e.target.value))}
                  className="slider is-fullwidth custom-slider-red"
                />
                <span className="tag is-danger is-medium font-bold" style={{ minWidth: '40px' }}>{catastropheAges}</span>
              </div>
              <label className="checkbox label mt-4 is-size-7 text-muted">
                <input 
                  type="checkbox" 
                  checked={includeFinalCatastrophe} 
                  onChange={e => setIncludeFinalCatastrophe(e.target.checked)} 
                  className="mr-2 custom-checkbox"
                />
                Final Catastrophe at end
              </label>
            </div>
          </div>

          {/* Merchant Ages */}
          <div id="merchant-ages-count" className="column is-half-tablet">
            <div className="field box glass-light p-4">
              <label className="label text-info mb-3">🏪 Merchant Ages</label>
              <div className="is-flex is-align-items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={merchantAges}
                  onChange={(e) => setMerchantAges(parseInt(e.target.value))}
                  className="slider is-fullwidth custom-slider-blue"
                />
                <span className="tag is-info is-medium font-bold" style={{ minWidth: '40px' }}>{merchantAges}</span>
              </div>
            </div>
          </div>

          {/* MoL Scaling */}
          <div id="mol-scaling" className="column is-half-tablet">
            <div className="field box glass-light p-4">
              <label className="label text-accent mb-3">📊 MoL Scaling (sM)</label>
              <div className="select is-fullwidth premium-select-container">
                <select 
                  value={molScaling} 
                  onChange={e => setMolScaling(e.target.value)}
                  className="premium-select"
                >
                  <option>Auto</option>
                  <option>Manual (1.0x)</option>
                  <option>Full (1.5x)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 px-4">
          <AnimatedButton 
            id="generate-deck-btn"
            className="is-primary is-large is-fullwidth button-premium py-6" 
            onClick={() => onGenerateDeck({ includeBirth, merchantAges, includeFinalCatastrophe })}
          >
            🎴 {ageDeckLength > 0 ? 'Regenerate Age Deck' : 'Generate Age Deck'}
          </AnimatedButton>
          {ageDeckLength > 0 && (
            <p className="has-text-centered mt-4 is-size-6 text-muted font-bold">
              Current Deck: <span className="text-white">{ageDeckLength}</span> cards
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-slider {
          -webkit-appearance: none;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
        }

        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: var(--primary-orange);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
        }

        .custom-slider-red::-webkit-slider-thumb {
          background: var(--error);
        }

        .custom-slider-blue::-webkit-slider-thumb {
          background: var(--info);
        }

        .premium-select-container::after {
          border-color: var(--primary-orange) !important;
        }

        .premium-select {
          background: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 8px;
        }

        .custom-checkbox {
          accent-color: var(--primary-orange);
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
}
