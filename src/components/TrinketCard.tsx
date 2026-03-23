import React from 'react';
import { useCardImage } from '../hooks/useCardImage';
import { useTheme } from '@/lib/theme-context';

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
  const { cardArtPreference } = useTheme();
  const { getCardImage } = useCardImage();
  const cardArtUrl = getCardImage(trinket.name);
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`card ${isFogged ? 'opacity-50' : ''}`} style={{ padding: 'var(--space-4)', margin: 'var(--space-2)' }}>
      <div className="card-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          {cardArtPreference === 'official' && cardArtUrl && !imgError && (
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
                src="/assets/placeholders/trinket.png"
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
                <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>💍</span>
              </div>
            </div>
          )}

          {cardArtPreference === 'official' && (!cardArtUrl || imgError) && (
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

          {cardArtPreference === 'none' && (
            <div style={{
              width: '45px',
              height: '63px',
              borderRadius: 'var(--border-radius-small)',
              backgroundColor: 'rgba(0,0,0,0.1)',
              boxShadow: 'var(--shadow-secondary)'
            }}>
              {/* No Image */}
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
        <button className="button button-outline" onClick={onRemove}>Remove</button>
        <button className="button button-primary" onClick={onPocket} disabled={isPocketDisabled}>Pocket</button>
      </footer>
    </div>
  );
};

export default TrinketCard;
 