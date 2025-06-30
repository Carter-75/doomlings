import React, { useState, useEffect, useRef } from 'react';

interface Dominant {
  name: string;
  tiers: {
    [key: string]: string;
  };
}

interface DominantCardProps {
    cardId: number;
    dominant: Dominant;
    players: string[];
    assignedPlayer: string | null;
    onAssign: (cardId: number, playerName: string | null) => void;
}

const DominantCard: React.FC<DominantCardProps> = ({ cardId, dominant, players, assignedPlayer, onAssign }) => {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [manualTier, setManualTier] = useState<string>('1');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rollTier = () => {
    const tierKeys = Object.keys(dominant.tiers);
    const randomTierKey = tierKeys[Math.floor(Math.random() * tierKeys.length)];
    setSelectedTier(randomTierKey || null);
  };

  const handleSetTier = () => {
    if (dominant.tiers[manualTier]) {
        setSelectedTier(manualTier);
    } else {
        alert(`Tier ${manualTier} does not exist for this dominant.`);
    }
  };
  
  const resetTier = () => {
    setSelectedTier(null);
  };

  const handleOptionClick = (playerName: string | null) => {
    onAssign(cardId, playerName);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const availableOptions = assignedPlayer
    ? ['Assign', ...players.filter(p => p !== assignedPlayer)]
    : players;

  return (
    <div className="dominant-card">
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
        <div className="manual-tier-controls">
          <input 
            type="number" 
            min="1" 
            max="5" 
            value={manualTier}
            onChange={(e) => setManualTier(e.target.value)}
            className="tier-input"
          />
          <button onClick={handleSetTier}>Set</button>
        </div>
        <button onClick={resetTier}>Reset</button>
        <div className="assign-dropdown" ref={dropdownRef}>
            <button
                className="assign-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                {assignedPlayer || 'Assign'}
            </button>
            {isMenuOpen && (
                <div className="assign-dropdown-menu">
                    {availableOptions.map(option => (
                        <div
                            key={option}
                            className="assign-dropdown-item"
                            onClick={() => handleOptionClick(option === 'Assign' ? null : option)}
                        >
                            {option}
                        </div>
                    ))}
                    {players.length === 0 && !assignedPlayer && (
                        <div className="assign-dropdown-item is-disabled">No players</div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DominantCard; 