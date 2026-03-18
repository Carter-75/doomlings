import React from 'react';
import { useCardImage } from '../hooks/useCardImage';

interface Trinket {
  name: string;
  power: string;
  objective: string;
  points: number;
}

interface TrinketCardProps {
  trinket: Trinket;
  onAdd: () => void;
  onRemove: () => void;
  onPocket: () => void;
  isPocketDisabled: boolean;
  isFogged?: boolean;
}

const TrinketCard: React.FC<TrinketCardProps> = ({ trinket, onAdd, onRemove, onPocket, isPocketDisabled, isFogged }) => {
  const { getCardImage } = useCardImage();
  const cardArtUrl = getCardImage(trinket.name);
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`trinket-card card ${isFogged ? 'trinket-fogged' : ''}`}>
      <div className="card-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {cardArtUrl && !imgError ? (
            <img
              src={cardArtUrl}
              alt={trinket.name}
              title={trinket.name}
              onError={() => setImgError(true)}
              style={{
                width: '45px',
                height: '63px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{
              width: '45px',
              height: '63px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #2c3e50, #3498db)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              padding: '2px'
            }}>
              ?
            </div>
          )}
          <h4 className="title is-5" style={{ margin: 0 }}>{trinket.name}</h4>
        </div>
        <p className="subtitle is-6"><strong>Power:</strong> {trinket.power}</p>
        <div className="content">
          <p><strong>Objective:</strong> {trinket.objective}</p>
          <p><strong>Points:</strong> {trinket.points}</p>
        </div>
      </div>
      <footer className="card-footer">
        <button className="card-footer-item button add-btn" onClick={onAdd}>Add</button>
        <button className="card-footer-item button remove-btn" onClick={onRemove}>Remove</button>
        <button className="card-footer-item button pocket-btn" onClick={onPocket} disabled={isPocketDisabled}>Pocket</button>
      </footer>
    </div>
  );
};

export default TrinketCard; 