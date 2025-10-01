import React from 'react';

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
          <h4 className="meaning-card-name">
            {card.name}
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
          background: linear-gradient(135deg, var(--light-bg), var(--lighter-bg));
          border: 2px solid rgba(155, 89, 182, 0.3);
          border-radius: var(--border-radius);
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          min-height: 180px;
          display: flex;
          flex-direction: column;
        }

        .meaning-card.selectable:hover {
          border-color: #9b59b6;
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(155, 89, 182, 0.3);
          background: rgba(155, 89, 182, 0.05);
        }

        .meaning-card.selected-card {
          border-color: var(--success);
          border-width: 3px;
          background: linear-gradient(135deg, 
            rgba(76, 175, 80, 0.15), 
            rgba(139, 195, 74, 0.15));
          box-shadow: 0 0 25px rgba(76, 175, 80, 0.4),
                      inset 0 0 0 2px rgba(76, 175, 80, 0.2);
          transform: translateY(-2px);
        }

        .meaning-card.selection-locked {
          opacity: 0.7;
          cursor: default;
        }

        .meaning-card.revealed {
          border-color: var(--info);
          background: linear-gradient(135deg, 
            rgba(33, 150, 243, 0.1), 
            rgba(63, 81, 181, 0.1));
        }

        .meaning-card-header {
          margin-bottom: 1rem;
        }

        .meaning-card-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: #9b59b6;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .selected-card .meaning-card-name {
          color: var(--success);
        }

        .revealed .meaning-card-name {
          color: var(--info);
        }

        .selection-badge {
          background: var(--success);
          color: white;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          animation: pulse-success 2s infinite;
        }

        @keyframes pulse-success {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          70% { 
            box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);
          }
        }

        .selection-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(76, 175, 80, 0.1);
          padding: 0.5rem;
          border-radius: 8px;
          margin-top: 0.5rem;
        }

        .selection-icon {
          font-size: 1.2rem;
        }

        .selection-text {
          color: var(--success);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .card-back {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin-top: auto;
        }

        .card-back-content {
          text-align: center;
        }

        .selected-indicator {
          color: var(--success);
        }

        .selected-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
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
          color: var(--success);
          margin-bottom: 0.3rem;
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
          margin-bottom: 0.5rem;
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
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }

        .not-selected-text {
          font-size: 0.9rem;
          opacity: 0.7;
        }

        .meaning-description {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 1rem;
          margin-top: auto;
          border-left: 4px solid #9b59b6;
        }

        .selected-card .meaning-description {
          border-left-color: var(--success);
        }

        .revealed .meaning-description {
          border-left-color: var(--info);
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
            padding: 1rem;
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