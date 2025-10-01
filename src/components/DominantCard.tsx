import React, { useState, useEffect } from 'react';

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
  searchTerm?: string; // Optional search term for highlighting matches
}

interface CardCopy {
  id: string;
  assignedTo: string;
  selectedTier: string | null;
}

const DominantCard: React.FC<DominantCardProps> = ({ 
  dominant, 
  players,
  assignedTo,
  selectedTier,
  onChange,
  searchTerm = ''
}) => {
  const [cardCopies, setCardCopies] = useState<CardCopy[]>([]);
  const [showCopies, setShowCopies] = useState(false);

  // Check if any duplicates match the current search term
  const hasMatchingDuplicates = cardCopies.some(copy => 
    searchTerm && 
    copy.assignedTo && 
    copy.assignedTo !== 'Assign' && 
    copy.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load card copies from localStorage on component mount
  useEffect(() => {
    const savedCopies = localStorage.getItem(`dominant-copies-${dominant.name}`);
    if (savedCopies) {
      try {
        setCardCopies(JSON.parse(savedCopies));
      } catch (error) {
        console.error('Error loading card copies:', error);
      }
    }
  }, [dominant.name]);

  // Auto-expand copies if they match the search term
  useEffect(() => {
    if (hasMatchingDuplicates && !showCopies) {
      setShowCopies(true);
    }
  }, [hasMatchingDuplicates, showCopies]);

  // Save card copies to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`dominant-copies-${dominant.name}`, JSON.stringify(cardCopies));
  }, [cardCopies, dominant.name]);

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

  const duplicateCard = () => {
    const newCopy: CardCopy = {
      id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assignedTo: 'Assign',
      selectedTier: null
    };
    setCardCopies(prev => [...prev, newCopy]);
    setShowCopies(true);
  };

  const removeCopy = (copyId: string) => {
    setCardCopies(prev => prev.filter(copy => copy.id !== copyId));
  };

  const updateCopy = (copyId: string, updates: Partial<CardCopy>) => {
    setCardCopies(prev => prev.map(copy => 
      copy.id === copyId ? { ...copy, ...updates } : copy
    ));
  };

  const rollTierForCopy = (copyId: string) => {
    const tierKeys = Object.keys(dominant.tiers);
    const randomTierKey = tierKeys[Math.floor(Math.random() * tierKeys.length)];
    updateCopy(copyId, { selectedTier: randomTierKey });
  };

  const clearAllCopies = () => {
    if (cardCopies.length > 0 && window.confirm('Remove all duplicate cards?')) {
      setCardCopies([]);
      setShowCopies(false);
    }
  };

  const toggleShowCopies = () => {
    setShowCopies(!showCopies);
  };

  const hasAssignedCards = assignedTo !== 'Assign' || cardCopies.some(copy => copy.assignedTo !== 'Assign');

  return (
    <div className={`dominant-card ${hasAssignedCards ? 'is-assigned' : ''} ${hasMatchingDuplicates ? 'has-matching-duplicates' : ''}`}>
      {/* Main Card */}
      <div className="dominant-card-main">
        <h3 className="dominant-name">
          {dominant.name}
          {hasMatchingDuplicates && <span className="match-indicator"> 🔍</span>}
        </h3>
        <div className="tier-display">
          {selectedTier ? (
            <div>
              <strong>Tier {selectedTier}:</strong> 
              <span className="tier-description">
                {dominant.tiers[selectedTier]}
              </span>
            </div>
          ) : (
            <em>Roll or set a tier</em>
          )}
        </div>
      </div>

      <div className="dominant-card-controls">
        {/* Tier Controls */}
        <div className="tier-controls">
          <button 
            className="button button-small tier-roll-button" 
            onClick={rollTier}
            type="button"
          >
            🎲 Roll Tier
          </button>
          
          <div className="dropdown-wrapper">
            <select 
              value={selectedTier || ""} 
              onChange={handleTierChange} 
              className="styled-select"
            >
              <option value="" disabled>
                {selectedTier ? `Tier ${selectedTier}` : 'Set Tier'}
              </option>
              {Object.keys(dominant.tiers).map(tier => (
                <option key={tier} value={tier}>
                  Tier {tier}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignment Control */}
        <div className="dropdown-wrapper">
          <select 
            value={assignedTo} 
            onChange={handleAssignChange} 
            className="styled-select"
          >
            <option value="Assign" disabled>
              {assignedTo === 'Assign' ? 'Assign Player' : assignedTo}
            </option>
            <option value="Assign">Unassigned</option>
            {players.map(player => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
        </div>

        {/* Duplication Controls */}
        <div className="duplication-controls">
          <button 
            className="button button-small" 
            onClick={duplicateCard}
            type="button"
            title="Create a duplicate copy for multiple players"
          >
            📄 Duplicate
          </button>
          
          {cardCopies.length > 0 && (
            <>
              <button 
                className="button button-small" 
                onClick={toggleShowCopies}
                type="button"
              >
                {showCopies ? 'Hide' : 'Show'} Copies ({cardCopies.length})
              </button>
              
              <button 
                className="button button-small error" 
                onClick={clearAllCopies}
                type="button"
                title="Remove all duplicate copies"
              >
                🗑️ Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card Copies */}
      {showCopies && cardCopies.length > 0 && (
        <div className="card-copies-container">
          <h4 className="copies-title">Duplicate Cards ({cardCopies.length})</h4>
          <div className="copies-grid">
            {cardCopies.map((copy, index) => {
              const isMatching = searchTerm && 
                                copy.assignedTo && 
                                copy.assignedTo !== 'Assign' && 
                                copy.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
              
              return (
                <div key={copy.id} className={`copy-card ${isMatching ? 'search-match' : ''}`}>
                  <div className="copy-header">
                    <span className="copy-label">
                      Copy {index + 1}
                      {isMatching && <span className="match-indicator"> 🔍</span>}
                    </span>
                  <button 
                    className="button button-small error" 
                    onClick={() => removeCopy(copy.id)}
                    type="button"
                    title="Remove this copy"
                  >
                    ❌
                  </button>
                </div>

                <div className="copy-tier-display">
                  {copy.selectedTier ? (
                    <div>
                      <strong>Tier {copy.selectedTier}:</strong>
                      <span className="tier-description">
                        {dominant.tiers[copy.selectedTier]}
                      </span>
                    </div>
                  ) : (
                    <em>No tier selected</em>
                  )}
                </div>

                <div className="copy-controls">
                  <button 
                    className="button button-small" 
                    onClick={() => rollTierForCopy(copy.id)}
                    type="button"
                  >
                    🎲 Roll
                  </button>

                  <div className="dropdown-wrapper">
                    <select 
                      value={copy.selectedTier || ""} 
                      onChange={(e) => updateCopy(copy.id, { selectedTier: e.target.value || null })} 
                      className="styled-select"
                    >
                      <option value="" disabled>
                        {copy.selectedTier ? `Tier ${copy.selectedTier}` : 'Set Tier'}
                      </option>
                      {Object.keys(dominant.tiers).map(tier => (
                        <option key={tier} value={tier}>
                          Tier {tier}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dropdown-wrapper">
                    <select 
                      value={copy.assignedTo} 
                      onChange={(e) => updateCopy(copy.id, { assignedTo: e.target.value })} 
                      className="styled-select"
                    >
                      <option value="Assign" disabled>
                        {copy.assignedTo === 'Assign' ? 'Assign Player' : copy.assignedTo}
                      </option>
                      <option value="Assign">Unassigned</option>
                      {players.map(player => (
                        <option key={player} value={player}>
                          {player}
                        </option>
                      ))}
                    </select>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .dominant-card {
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .dominant-card.is-assigned {
          border-color: var(--success);
          box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
        }

        .dominant-card.has-matching-duplicates {
          background: rgba(255, 107, 53, 0.05);
          border-color: var(--primary-orange);
          box-shadow: 0 0 20px rgba(255, 107, 53, 0.2);
        }

        .dominant-card-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 200px;
        }

        .tier-controls {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .duplication-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .duplication-controls .button {
          flex: 1;
          min-width: 80px;
        }

        .card-copies-container {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--border-radius);
          border: 1px solid rgba(214, 52, 71, 0.2);
        }

        .copies-title {
          margin-bottom: 1rem;
          font-size: 1.1rem;
          color: var(--primary-orange);
          text-align: center;
        }

        .copies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .copy-card {
          background: var(--light-bg);
          border: 1px solid rgba(214, 52, 71, 0.1);
          border-radius: var(--border-radius-small);
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .copy-card.search-match {
          background: rgba(255, 107, 53, 0.1);
          border-color: var(--primary-orange);
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
        }

        .copy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .copy-label {
          font-weight: 600;
          color: var(--secondary-orange);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .match-indicator {
          color: var(--primary-orange);
          font-size: 0.9rem;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .copy-tier-display {
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--border-radius-small);
          border-left: 3px solid var(--primary-orange);
          font-size: 0.85rem;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .copy-controls {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .tier-description {
          display: block;
          margin-top: 0.5rem;
          font-style: italic;
          color: var(--text-secondary);
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        @media (max-width: 768px) {
          .dominant-card {
            flex-direction: column;
          }

          .dominant-card-controls {
            min-width: auto;
          }

          .copies-grid {
            grid-template-columns: 1fr;
          }

          .copy-controls {
            flex-direction: column;
          }

          .duplication-controls {
            flex-direction: column;
          }

          .duplication-controls .button {
            width: 100%;
            min-width: auto;
          }
        }

        @media (min-width: 769px) {
          .dominant-card {
            flex-direction: row;
            align-items: flex-start;
          }

          .dominant-card-main {
            flex: 2;
          }

          .dominant-card-controls {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default DominantCard;