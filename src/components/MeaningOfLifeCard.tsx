import React from 'react';
import { useCardImage } from '../hooks/useCardImage';

interface Meaning {
  name: string;
  description: string;
}

interface MeaningOfLifeCardProps {
  card: Meaning;
  isRevealed: boolean;
  isSelected: boolean;
  onChoose: () => void;
  isViewing?: boolean;
  canSelect?: boolean; // New prop to indicate if selection is still allowed
}

const MeaningOfLifeCard: React.FC<MeaningOfLifeCardProps> = ({
  card,
  isRevealed,
  isSelected,
  onChoose,
  isViewing,
  canSelect = true
}) => {
  const { getCardImage } = useCardImage();
  const cardArtUrl = getCardImage(card.name);
  const [imgError, setImgError] = React.useState(false);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {cardArtUrl && !imgError ? (
              <img
                src={cardArtUrl}
                alt={card.name}
                title={card.name}
                onError={() => setImgError(true)}
                style={{
                  width: '45px',
                  height: '63px',
                  borderRadius: 'var(--border-radius-small)',
                  boxShadow: 'var(--shadow-secondary)',
                  objectFit: 'contain'
                }}
              />
            ) : (
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
            <h4 className="meaning-card-name" style={{ margin: 0 }}>
              {card.name}
              {isSelected && <span className="selection-badge">✓ SELECTED</span>}
            </h4>
          </div>
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
          <p>{card.description}</p>
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
          border-color: var(--success);
          background: rgba(0, 255, 136, 0.05);
        }

        .meaning-card-header {
          margin-bottom: var(--space-3);
        }

        .meaning-card-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: #e0e0e0;
          margin-bottom: var(--space-2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .selected-card .meaning-card-name {
          color: var(--warning);
        }

        .revealed .meaning-card-name {
          color: var(--success);
        }

        .selection-badge {
          background: var(--warning);
          color: #000;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          animation: pulse-warn 2s infinite;
        }

        @keyframes pulse-warn {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(255, 193, 7, 0); }
        }

        .selection-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: rgba(255, 193, 7, 0.1);
          padding: var(--space-2);
          border-radius: var(--border-radius-small);
          margin-top: var(--space-2);
        }

        .selection-icon {
          font-size: 1.2rem;
        }

        .selection-text {
          color: var(--warning);
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
          color: var(--warning);
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
          color: var(--warning);
          margin-bottom: var(--space-1);
          letter-spacing: 1px;
        }

        .selected-hint {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .selection-prompt {
          color: #9b59b6;
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
        }

        .not-selected {
          color: var(--text-muted);
        }

        .not-selected-icon {
          font-size: 2rem;
          margin-bottom: var(--space-2);
          opacity: 0.5;
        }

        .not-selected-text {
          font-size: 0.9rem;
          opacity: 0.7;
        }

        .meaning-description {
          background: rgba(0, 0, 0, 0.3);
          border-radius: var(--border-radius-small);
          padding: var(--space-3);
          margin-top: auto;
          border-left: 2px solid #9b59b6;
        }

        .selected-card .meaning-description {
          border-left-color: var(--warning);
        }

        .revealed .meaning-description {
          border-left-color: var(--success);
        }

        .meaning-description p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.5;
          word-wrap: break-word;
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