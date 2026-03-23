'use client';

import React from 'react';
import AnimatedButton from '@/components/AnimatedButton';
import DominantCard from '@/components/DominantCard';

interface DominantsSectionProps {
  playerNames: string[];
  playerCount: number;
  dominants: any[];
  dominantState: { [key: string]: { assignedTo: string; selectedTier: string | null } };
  onDominantChange: (name: string, updates: { assignedTo?: string; selectedTier?: string | null }) => void;
  onResetDominants: () => void;
}

export default function DominantsSection({
  playerNames,
  playerCount,
  dominants,
  dominantState,
  onDominantChange,
  onResetDominants
}: DominantsSectionProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const players = playerNames.slice(0, playerCount).filter(n => n.trim());

  const filteredDominants = dominants.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dominants-section animate-fade-in">
      <h2 className="section-title">Dominant Cards</h2>
      
      <div className="box glass p-6 mt-6 mb-8 border-1 border-white/10 shadow-lg">
        <label className="label text-secondary mb-3 uppercase letter-spacing-1 is-size-7">Search & Filter</label>
        <div className="field">
          <div className="control has-icons-left">
            <input
              className="input premium-input"
              type="text"
              placeholder="Start typing a card name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="icon is-left opacity-30">🔍</span>
          </div>
        </div>
      </div>

      <div className="dominants-grid columns is-multiline">
        {filteredDominants.map((dominant, index) => {
          const state = dominantState[dominant.name] || { assignedTo: 'Assign', selectedTier: null };
          
          return (
            <div key={index} className="column is-full-mobile is-half-tablet is-one-third-desktop">
              <div className="box glass-light p-4 h-full border-white/5 hover-scale transition-all">
                <DominantCard
                  dominant={dominant}
                  players={players}
                  assignedTo={state.assignedTo}
                  selectedTier={state.selectedTier}
                  onChange={(updates) => onDominantChange(dominant.name, updates)}
                  searchTerm={searchTerm}
                />
              </div>
            </div>
          );
        })}
      </div>

      {filteredDominants.length === 0 && (
        <div className="has-text-centered py-12 box glass mt-4">
          <p className="text-muted is-size-5">No dominants found matching "{searchTerm}"</p>
        </div>
      )}

      <div className="mt-12 mb-12 px-4">
        <AnimatedButton className="is-danger is-outlined is-fullwidth py-4 font-bold border-dashed" onClick={onResetDominants}>
          🔄 Reset All Dominant Assignments
        </AnimatedButton>
      </div>

      <style jsx>{`
        .premium-input {
          background: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          height: 54px;
          border-radius: 12px;
          font-size: 1.1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-input:focus {
          border-color: var(--primary-orange) !important;
          box-shadow: 0 0 20px rgba(252, 163, 17, 0.15) !important;
          background: rgba(0, 0, 0, 0.6) !important;
        }

        .premium-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
