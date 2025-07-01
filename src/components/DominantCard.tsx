import React from 'react';

interface Dominant {
  name: string;
  tiers: {
    [key: string]: string;
  };
}

interface DominantCardProps {
    dominant: Dominant;
    players: string[];
    assignedTo: string;
    selectedTier: string | null;
    onChange: (change: { assignedTo?: string; selectedTier?: string | null }) => void;
}

const DominantCard: React.FC<DominantCardProps> = ({ 
    dominant, 
    players,
    assignedTo,
    selectedTier,
    onChange 
}) => {

  const rollTier = () => {
    const tierKeys = Object.keys(dominant.tiers);
    const randomTierKey = tierKeys[Math.floor(Math.random() * tierKeys.length)];
    onChange({ selectedTier: randomTierKey || null });
  };
  
  const handleAssignChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ assignedTo: event.target.value });
  };

  const handleTierChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const tier = event.target.value;
      onChange({ selectedTier: tier || null });
  };

  return (
    <div className={`dominant-card ${assignedTo !== 'Assign' ? 'is-assigned' : ''}`}>
      <div className="dominant-card-main">
        <h3 className="dominant-name">{dominant.name}</h3>
        <div className="tier-display">
          {selectedTier ? (
            <div>
              <strong>Tier {selectedTier}:</strong> {dominant.tiers[selectedTier]}
            </div>
          ) : (
            'Roll or set a tier'
          )}
        </div>
      </div>
      <div className="dominant-card-controls">
        <button className="tier-roll-button" onClick={rollTier}>Roll Tier</button>
        
        <div className="dropdown-wrapper">
          <select 
            value={selectedTier || ""} 
            onChange={handleTierChange} 
            className="styled-select"
          >
            <option value={selectedTier || ""} disabled hidden>
                {selectedTier ? `Tier ${selectedTier}` : 'Set Tier'}
            </option>
            {selectedTier && <option value="">Set Tier</option>}
            {Object.keys(dominant.tiers)
              .filter(tier => tier !== selectedTier)
              .map(tier => (
              <option key={tier} value={tier}>
                Tier {tier}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-wrapper">
          <select value={assignedTo} onChange={handleAssignChange} className="styled-select">
            <option value={assignedTo} disabled hidden>
                {assignedTo}
            </option>
            
            {['Assign', ...players]
                .filter(p => p !== assignedTo)
                .map(p => <option key={p} value={p}>{p}</option>)
            }
          </select>
        </div>
      </div>
    </div>
  );
};

export default DominantCard; 