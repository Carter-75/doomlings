'use client';

import React, { useState } from 'react';
import { useCardImage } from '../hooks/useCardImage';
import { useTheme } from '@/lib/theme-context';

interface MeaningOfLife {
  name: string;
  description: string;
}

interface MeaningOfLifeCardProps {
  meaning: MeaningOfLife;
  isRevealed: boolean;
  isSelected: boolean;
  onChoose: () => void;
  isViewing?: boolean;
  canSelect?: boolean;
}

const MeaningOfLifeCard: React.FC<MeaningOfLifeCardProps> = ({
  meaning,
  isRevealed,
  isSelected,
  onChoose,
  isViewing,
  canSelect = true
}) => {
  const { cardArtPreference } = useTheme();
  const { getCardImage } = useCardImage();
  const cardArtUrl = getCardImage(meaning.name);
  const [imgError, setImgError] = useState(false);

  const cardClasses = [
    'meaning-card',
    isRevealed ? 'revealed' : '',
    isSelected ? 'selected-card' : '',
    !canSelect ? 'selection-locked' : '',
    canSelect && !isSelected ? 'selectable' : ''
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (canSelect && !isRevealed) {
      onChoose();
    }
  };

  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Always show header for selected cards, or when viewing/revealed */}
      {(isSelected || isRevealed || isViewing) && (
        <div className="meaning-card-header">
          <h4 className="meaning-card-name" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {cardArtPreference === 'official' && cardArtUrl && !imgError && (
              <img
                src={cardArtUrl}
                alt={meaning.name}
                title={meaning.name}
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
                  src="/assets/placeholders/meaning.png"
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
                  <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>✨</span>
                </div>
              </div>
            )}
            {cardArtPreference === 'official' && (!cardArtUrl || imgError) && (
              <div style={{
                width: '45px',
                height: '63px',
                borderRadius: 'var(--border-radius-small)',
                background: 'linear-gradient(135deg, var(--light-bg), var(--success))',
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
            {meaning.name}
            {isSelected && <span className="selection-badge">✓ SELECTED</span>}
          </h4>
          {isSelected && !isRevealed && (
            <div className="selection-indicator">
              <span className="selection-icon">🎯</span>
              <span className="selection-text">Your Choice</span>
            </div>
          )}
        </div>
      )}

      {(isRevealed || isViewing) && (
        <div className="meaning-description">
          <p>{meaning.description}</p>
        </div>
      )}

      {!isRevealed && !isViewing && (
        <div className="card-back">
          <div className="card-back-content">
            {isSelected ? (
              <div className="selected-indicator">
                <div className="selected-icon">🏆</div>
                <div className="selected-text">YOUR SELECTED CARD</div>
                <div className="selected-hint">This will be revealed at game end</div>
              </div>
            ) : canSelect ? (
              <div className="selection-prompt">
                <div className="prompt-icon">👆</div>
                <div className="prompt-text">Click to Select</div>
              </div>
            ) : (
              <div className="not-selected">
                <div className="not-selected-icon">💤</div>
                <div className="not-selected-text">Not Selected</div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .meaning-card {
          background: var(--light-bg);
          border: 1px solid rgba(155, 89, 182, 0.3);
          border-radius: var(--border-radius);
          padding: var(--space-4);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-card);
        }

        .meaning-card.selectable:hover {
          border-color: #9b59b6;
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(155, 89, 182, 0.3);
          background: rgba(155, 89, 182, 0.05);
        }

        .meaning-card.selected-card {
          border-color: var(--warning);
          border-width: 2px;
          background: rgba(255, 193, 7, 0.05);
          box-shadow: 0 0 25px rgba(255, 193, 7, 0.2), inset 0 0 0 1px rgba(255, 193, 7, 0.2);
          transform: translateY(-2px);
        }

        .meaning-card.selection-locked {
          opacity: 0.7;
          cursor: default;
        }

        .meaning-card.revealed {
          border-color: var(--primary-orange);
          background: rgba(var(--primary-rgb, 252,163,17), 0.05);
          box-shadow: 0 0 20px rgba(var(--primary-rgb, 252,163,17), 0.1);
        }
        .meaning-card-header {
          margin-bottom: var(--space-3);
        }

        .meaning-card-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: var(--space-2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .selected-card .meaning-card-name {
          color: var(--primary-orange);
        }

        .revealed .meaning-card-name {
          color: var(--primary-orange);
        }

        .selection-badge {
          background: var(--primary-orange);
          color: #000;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          animation: pulse-warn 2s infinite;
        }

        @keyframes pulse-warn {
          0%, 100% { box-shadow: 0 0 0 0 rgba(252, 163, 17, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(252, 163, 17, 0); }
        }

        .selection-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: rgba(252, 163, 17, 0.1);
          padding: var(--space-2);
          border-radius: var(--border-radius-small);
          margin-top: var(--space-2);
        }

        .selection-icon {
          font-size: 1.2rem;
        }

        .selection-text {
          color: var(--primary-orange);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .card-back {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--border-radius-small);
          padding: var(--space-3);
          margin-top: auto;
        }

        .card-back-content {
          text-align: center;
        }

        .selected-indicator {
          color: var(--primary-orange);
        }

        .selected-icon {
          font-size: 2.5rem;
          margin-bottom: var(--space-2);
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        .selected-text {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--primary-orange);
          margin-bottom: var(--space-1);
          letter-spacing: 1px;
        }

        .selected-hint {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
        }

        .selection-prompt {
          color: rgba(252, 163, 17, 0.7);
        }

        .prompt-icon {
          font-size: 2rem;
          margin-bottom: var(--space-2);
          animation: point 1.5s infinite;
        }

        @keyframes point {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .prompt-text {
          font-weight: 600;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .not-selected {
          color: rgba(255, 255, 255, 0.3);
        }

        .not-selected-icon {
          font-size: 2rem;
          margin-bottom: var(--space-2);
          opacity: 0.4;
        }

        .not-selected-text {
          font-size: 0.9rem;
          opacity: 0.6;
        }

        .meaning-description {
          background: rgba(0, 0, 0, 0.25);
          border-radius: var(--border-radius-small);
          padding: var(--space-3);
          margin-top: auto;
          border-left: 2px solid rgba(252, 163, 17, 0.4);
        }

        .selected-card .meaning-description {
          border-left-color: var(--primary-orange);
        }

        .revealed .meaning-description {
          border-left-color: var(--primary-orange);
        }

        .meaning-description p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          word-wrap: break-word;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .meaning-card {
            min-height: 160px;
            padding: var(--space-3);
          }

          .meaning-card-name {
            font-size: 1.1rem;
            flex-direction: column;
            align-items: flex-start;
          }

          .selection-badge {
            align-self: flex-start;
            margin-top: 0.3rem;
          }

          .selected-icon, .prompt-icon, .not-selected-icon {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MeaningOfLifeCard;