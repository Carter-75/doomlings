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
    <div className="dominants-section">
      <h2 className="section-title">Dominant Cards</h2>
      
      <div className="box mb-4">
        <div className="field">
          <div className="control has-icons-left">
            <input
              className="input"
              type="text"
              placeholder="Search Dominants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="icon is-left">🔍</span>
          </div>
        </div>
      </div>

      <div className="dominants-grid">
        {filteredDominants.map((dominant, index) => {
          const state = dominantState[dominant.name] || { assignedTo: 'Assign', selectedTier: null };
          
          return (
            <div key={index} className="box mb-4 p-4">
              <DominantCard
                dominant={dominant}
                players={players}
                assignedTo={state.assignedTo}
                selectedTier={state.selectedTier}
                onChange={(updates) => onDominantChange(dominant.name, updates)}
                searchTerm={searchTerm}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 mb-8">
        <AnimatedButton className="is-danger is-fullwidth" onClick={onResetDominants}>
          Reset All Dominant Assignments
        </AnimatedButton>
      </div>
    </div>
  );
}
