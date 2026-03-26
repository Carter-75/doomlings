'use client';

import React, { useState, useEffect } from 'react';
import { useCardImage } from '../hooks/useCardImage';
import { useTheme } from '@/lib/theme-context';
import { useNotification } from '../lib/notification-context';
import ThemedSelect from './ThemedSelect';

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
  resetTrigger?: number; // Trigger to force refresh of duplicate cards
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
  searchTerm = '',
  resetTrigger = 0
}) => {
  const { theme, cardArtPreference } = useTheme();
  const { showNotification } = useNotification();
  const { getCardImage } = useCardImage();
  const cardArtUrl = getCardImage(dominant.name);
  const [imgError, setImgError] = useState(false);

  const [cardCopies, setCardCopies] = useState<CardCopy[]>([]);
  const [showCopies, setShowCopies] = useState(false);
  const [showAllTiers, setShowAllTiers] = useState(false);

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

  // Handle reset trigger - clear copies when parent triggers reset
  useEffect(() => {
    if (resetTrigger > 0) {
      setCardCopies([]);
      setShowCopies(false);
    }
  }, [resetTrigger]);

  const rollTier = () => {
    const tierKeys = Object.keys(dominant.tiers);
    const randomTierKey = tierKeys[Math.floor(Math.random() * tierKeys.length)];
    onChange({ selectedTier: randomTierKey || null });
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
    if (cardCopies.length > 0) {
      showNotification({
        title: 'Clear All Copies?',
        message: 'Are you sure you want to remove all duplicate cards for this Dominant?',
        type: 'warning',
        onConfirm: () => {
          setCardCopies([]);
          setShowCopies(false);
        }
      });
    }
  };

  const toggleShowCopies = () => {
    setShowCopies(!showCopies);
  };

  const toggleShowAllTiers = () => {
    setShowAllTiers((prev) => !prev);
  };

  const hasAssignedCards = assignedTo !== 'Assign' || cardCopies.some(copy => copy.assignedTo !== 'Assign');

  return (
    <div className={`dominant-card ${hasAssignedCards ? 'is-assigned' : ''} ${hasMatchingDuplicates ? 'has-matching-duplicates' : ''}`}>
      {/* Main Card */}
      <div className="dominant-card-main">
        <h3 className="dominant-name" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {cardArtPreference === 'official' && cardArtUrl && !imgError && (
              <img
                src={cardArtUrl}
                alt={dominant.name}
                title={dominant.name}
                onError={() => setImgError(true)}
                style={{
                  width: '45px',
                  height: '63px',
                  borderRadius: 'var(--border-radius-small)',
                  boxShadow: 'var(--shadow-secondary)',
                  objectFit: 'contain'
                }}
              />
            )}
            {cardArtPreference === 'ai' && (
              <div style={{
                width: '45px',
                height: '63px',
                borderRadius: 'var(--border-radius-small)',
                boxShadow: 'var(--shadow-secondary)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <img
                  src="/assets/placeholders/dominant.png"
                  alt="AI Art"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.8,
                    filter: 'contrast(110%)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.2)'
                }}>
                  <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>👑</span>
                </div>
              </div>
            )}
            {cardArtPreference === 'official' && (!cardArtUrl || imgError) && (
              <div style={{
                width: '45px',
                height: '63px',
                borderRadius: 'var(--border-radius-small)',
                background: 'linear-gradient(135deg, var(--light-bg), var(--warning))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: 'var(--shadow-secondary)'
              }}>
                ?
              </div>
            )}
          <span>
            {dominant.name}
            {hasMatchingDuplicates && <span className="match-indicator"> 🔍</span>}
          </span>
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

        <button
          className="button button-small tier-list-toggle"
          onClick={toggleShowAllTiers}
          type="button"
        >
          {showAllTiers ? 'Hide All Tiers' : 'Show All Tiers'}
        </button>

        {showAllTiers && (
          <div className="all-tiers-list">
            {Object.entries(dominant.tiers).map(([tier, text]) => (
              <div key={tier} className="all-tier-item">
                <span className="all-tier-label">Tier {tier}</span>
                <span className="all-tier-text">{text}</span>
              </div>
            ))}
          </div>
        )}
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

          <ThemedSelect
            value={selectedTier || ''}
            onChange={(tierValue) => onChange({ selectedTier: tierValue || null })}
            placeholder="Set Tier"
            options={[
              { value: '', label: 'Assign Tier' },
              ...Object.keys(dominant.tiers).map((tier) => ({
                value: tier,
                label: `Tier ${tier}`,
              })),
            ]}
          />
        </div>

        {/* Assignment Control */}
        <ThemedSelect
          value={assignedTo === 'Assign' ? '' : assignedTo}
          onChange={(playerValue) => onChange({ assignedTo: playerValue || 'Assign' })}
          placeholder="Assign Player"
          options={[
            { value: 'Assign', label: 'Unassigned' },
            ...players.map((player) => ({ value: player, label: player })),
          ]}
        />

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

                    <ThemedSelect
                      value={copy.selectedTier || ''}
                      onChange={(tierValue) => updateCopy(copy.id, { selectedTier: tierValue || null })}
                      placeholder="Set Tier"
                      options={[
                        { value: '', label: 'Assign Tier' },
                        ...Object.keys(dominant.tiers).map((tier) => ({
                          value: tier,
                          label: `Tier ${tier}`,
                        })),
                      ]}
                    />

                    <ThemedSelect
                      value={copy.assignedTo === 'Assign' ? '' : copy.assignedTo}
                      onChange={(playerValue) => updateCopy(copy.id, { assignedTo: playerValue || 'Assign' })}
                      placeholder="Assign Player"
                      options={[
                        { value: 'Assign', label: 'Unassigned' },
                        ...players.map((player) => ({ value: player, label: player })),
                      ]}
                    />
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

        .tier-list-toggle {
          margin-top: 0.75rem;
          width: 100%;
          border: 1px dashed rgba(var(--secondary-rgb), 0.5);
          color: var(--text-secondary);
          background: rgba(var(--secondary-rgb), 0.08);
        }

        .tier-list-toggle:hover {
          border-color: rgba(var(--secondary-rgb), 0.8);
          color: var(--text-primary);
          background: rgba(var(--secondary-rgb), 0.15);
        }

        .all-tiers-list {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border-radius: var(--border-radius-small);
          border: 1px solid rgba(var(--secondary-rgb), 0.28);
          background: rgba(0, 0, 0, 0.18);
          padding: 0.75rem;
        }

        .all-tier-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          border-left: 3px solid rgba(var(--secondary-rgb), 0.5);
          padding-left: 0.55rem;
        }

        .all-tier-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--secondary-orange);
          font-weight: 700;
        }

        .all-tier-text {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.35;
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