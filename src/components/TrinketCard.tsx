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
    <div className={`card ${isFogged ? 'opacity-50' : ''}`} style={{ padding: 'var(--space-4)', margin: 'var(--space-2)' }}>
      <div className="card-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          {cardArtUrl && !imgError ? (
            <img
              src={cardArtUrl}
              alt={trinket.name}
              title={trinket.name}
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
              background: 'linear-gradient(135deg, var(--light-bg), var(--info))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: 'var(--shadow-secondary)',
              padding: '2px'
            }}>
              ?
            </div>
          )}
          <h4 style={{ margin: 0, color: 'var(--primary-orange)', fontWeight: 'bold' }}>{trinket.name}</h4>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}><strong style={{color: 'var(--text-primary)'}}>Power:</strong> {trinket.power}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <p><strong style={{color: 'var(--text-primary)'}}>Objective:</strong> {trinket.objective}</p>
          <p><strong style={{color: 'var(--text-primary)'}}>Points:</strong> {trinket.points}</p>
        </div>
      </div>
      <footer style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
        <button className="button button-outline" onClick={onAdd}>Add</button>
        <button className="button button-outline" onClick={onRemove} style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>Remove</button>
        <button className="button button-primary" onClick={onPocket} disabled={isPocketDisabled}>Pocket</button>
      </footer>
    </div>
  );
};

export default TrinketCard; 