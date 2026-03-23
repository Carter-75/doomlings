'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';

interface AgeSetupSectionProps {
  onGenerateDeck: (options: { includeBirth: boolean; merchantAges: number; includeFinalCatastrophe: boolean }) => void;
  ageDeckLength: number;
}

export default function AgeSetupSection({ onGenerateDeck, ageDeckLength }: AgeSetupSectionProps) {
  const [includeBirth, setIncludeBirth] = React.useState(true);
  const [merchantAges, setMerchantAges] = React.useState(0);
  const [includeFinalCatastrophe, setIncludeFinalCatastrophe] = React.useState(true);

  return (
    <div className="age-setup-section">
      <h2 className="section-title">Age Deck Setup</h2>
      
      <div className="box">
        <div className="field">
          <label className="checkbox label">
            <input 
              type="checkbox" 
              checked={includeBirth} 
              onChange={e => setIncludeBirth(e.target.checked)} 
              className="mr-2"
            />
            Include "The Birth of Life" (First Age)
          </label>
        </div>

        <div className="field mt-4">
          <label className="label">Number of Merchant Ages: {merchantAges}</label>
          <input
            type="range"
            min="0"
            max="3"
            value={merchantAges}
            onChange={(e) => setMerchantAges(parseInt(e.target.value))}
            className="slider is-fullwidth"
          />
        </div>

        <div className="field mt-4">
          <label className="checkbox label">
            <input 
              type="checkbox" 
              checked={includeFinalCatastrophe} 
              onChange={e => setIncludeFinalCatastrophe(e.target.checked)} 
              className="mr-2"
            />
            Include "Final Catastrophe" at the end
          </label>
        </div>

        <div className="mt-6">
          <AnimatedButton 
            className="is-primary is-fullwidth" 
            onClick={() => onGenerateDeck({ includeBirth, merchantAges, includeFinalCatastrophe })}
          >
            🎴 {ageDeckLength > 0 ? 'Regenerate Deck' : 'Generate Age Deck'}
          </AnimatedButton>
          {ageDeckLength > 0 && (
            <p className="has-text-centered mt-2 is-size-7 text-muted">
              Current Deck: {ageDeckLength} cards
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
