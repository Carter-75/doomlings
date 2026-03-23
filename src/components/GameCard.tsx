// Professional Game Card Component - Visual Card Layouts
'use client';

import React, { useState } from 'react';
import { Card } from '@/modules/doomlings/types/Card';
import { useCardImage } from '../hooks/useCardImage';
import { useTheme } from '@/lib/theme-context';

interface GameCardProps {
  card: Card;
  isSelected?: boolean;
  isPlayable?: boolean;
  isInHand?: boolean;
  isInTraitPile?: boolean;
  size?: 'small' | 'medium' | 'large';
  perspective?: 'flat' | 'angled';
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  showDetails?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({
  card,
  isSelected = false,
  isPlayable = true,
  isInHand = false,
  isInTraitPile = false,
  size = 'medium',
  perspective = 'flat',
  onClick,
  onHover,
  showDetails = true
}) => {
  const { getCardImage } = useCardImage();
  const { cardArtPreference } = useTheme();
  const cardArtUrl = getCardImage(card.name);
  const [imgError, setImgError] = useState(false);

  const getCardColorStyles = (color?: string) => {
    const baseGradient = 'bg-[var(--light-bg)] border backdrop-blur-md transition-all duration-300';
    const selectedRing = isSelected ? 'ring-2 ring-[var(--primary-orange)] shadow-[var(--glow-primary)]' : '';

    switch (color) {
      case 'red':
        return `${baseGradient} border-[var(--primary-red)] text-white shadow-[var(--shadow-primary)] ${selectedRing}`;
      case 'green':
        return `${baseGradient} border-[var(--success)] text-white shadow-[var(--shadow-primary)] ${selectedRing}`;
      case 'blue':
        return `${baseGradient} border-[var(--info)] text-white shadow-[var(--shadow-primary)] ${selectedRing}`;
      case 'purple':
        return `${baseGradient} border-[var(--primary-red)] text-white shadow-[var(--shadow-primary)] ${selectedRing}`; // Map purple to theme primary
      case 'colorless':
        return `${baseGradient} border-gray-500 text-white shadow-md ${selectedRing}`;
      default:
        if (card.type === 'age') {
          return `${baseGradient} border-[var(--warning)] text-white shadow-[var(--glow-primary)] ${selectedRing}`;
        } else if (card.type === 'catastrophe') {
          return `${baseGradient} border-[var(--error)] text-white shadow-[var(--shadow-primary)] ${selectedRing}`;
        } else if (card.type === 'treasure') {
          return `${baseGradient} border-[var(--accent-orange)] text-white shadow-[var(--glow-primary)] ${selectedRing}`;
        } else if (card.type === 'birth_of_life') {
          return `${baseGradient} border-[var(--success)] text-white shadow-md ${selectedRing}`;
        }
        return `${baseGradient} border-gray-500 text-[var(--text-primary)] shadow-md ${selectedRing}`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-16 h-24';
      case 'large':
        return 'w-32 h-48';
      case 'medium':
      default:
        return 'w-24 h-36';
    }
  };

  const getPerspectiveClasses = () => {
    if (perspective === 'angled') {
      return 'transform rotate-[-2deg] hover:rotate-0';
    }
    return '';
  };

  const getCardTypeIcon = () => {
    switch (card.type) {
      case 'trait': return card.color === 'red' ? '🔥' : card.color === 'green' ? '🌿' : card.color === 'blue' ? '💧' : card.color === 'purple' ? '⚡' : '⚪';
      case 'dominant': return '👑';
      case 'age': return '⏳';
      case 'catastrophe': return '💀';
      case 'treasure': return '💎';
      case 'birth_of_life': return '🌱';
      default: return '🎴';
    }
  };

  const getRarityBorder = () => {
    switch (card.rarity) {
      case 'legendary': return 'border-2 border-[var(--warning)] shadow-[var(--glow-primary)]';
      case 'epic': return 'border-2 border-[var(--primary-red)] shadow-[var(--shadow-primary)]';
      case 'rare': return 'border-2 border-[var(--info)] shadow-md';
      case 'holo': return 'border-2 border-[var(--accent-red)] shadow-[var(--shadow-primary)] bg-[var(--lighter-bg)]';
      case 'promo': return 'border-2 border-[var(--primary-orange)] shadow-[var(--glow-primary)]';
      default: return 'border border-opacity-50';
    }
  };

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-300 transform
        ${getSizeClasses()}
        ${getPerspectiveClasses()}
        ${isSelected ? 'scale-110 z-20' : 'hover:scale-105 hover:z-10'}
        ${isPlayable ? '' : 'opacity-60 cursor-not-allowed'}
        ${isInHand ? 'hover:-translate-y-2' : ''}
      `}
      onClick={isPlayable ? onClick : undefined}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Card Shadow */}
      <div className="absolute inset-0 bg-black/50 rounded-lg transform translate-x-1 translate-y-1 -z-10" />

      {/* Main Card */}
      <div className={`
        relative w-full h-full rounded-lg overflow-hidden
        ${cardArtUrl ? 'bg-[#1a1a1a]' : getCardColorStyles(card.color)}
        ${getRarityBorder()}
        backdrop-blur-sm
      `}>
        {cardArtPreference === 'official' && cardArtUrl && !imgError && (
          <img 
            src={cardArtUrl} 
            alt={card.name} 
            className="absolute inset-0 w-full h-full object-cover z-0" 
            onError={() => setImgError(true)} 
          />
        )}

        {cardArtPreference === 'ai' && (
          <div className="absolute inset-0 z-0">
            <img 
              src={`/assets/placeholders/${
                card.type === 'age' ? 'age' : 
                card.type === 'catastrophe' ? 'catastrophe' : 
                card.type === 'treasure' ? 'trinket' : 
                card.type === 'dominant' ? 'dominant' : 
                'trait'
              }.png`}
              alt="AI Card Art"
              className="w-full h-full object-cover opacity-80 contrast-110"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" style={{
              background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.3) 100%)',
              borderRadius: 'inherit'
            }}>
               <span className="text-white font-bold opacity-30" style={{
                  fontSize: size === 'small' ? '24px' : size === 'large' ? '56px' : '36px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>{getCardTypeIcon()}</span>
            </div>
          </div>
        )}

        {cardArtPreference === 'official' && (!cardArtUrl || imgError) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/40" style={{
            borderRadius: 'inherit'
          }}>
             <span className="text-white/40 text-4xl font-bold">?</span>
          </div>
        )}

        {cardArtPreference === 'none' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/10" style={{
            borderRadius: 'inherit'
          }}>
             {/* No image at all - just background color showing through */}
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-[var(--glow-primary)] animate-pulse" style={{ background: 'var(--primary-orange)' }}>
            <span className="text-black text-sm font-bold">✓</span>
          </div>
        )}

        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Detailed Tooltip on Hover */}
      {showDetails && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black/90 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
          <div className="font-bold text-yellow-400 mb-1">{card.name}</div>
          <div className="text-gray-300 mb-1">
            {card.type.toUpperCase()} • {card.color?.toUpperCase() || 'NO COLOR'} • {card.pointValue} points
          </div>
          <div className="text-white text-xs leading-relaxed">
            {card.textPlaceholder}
          </div>
          {card.restrictions.length > 0 && (
            <div className="text-red-400 text-xs mt-2">
              Restrictions: {card.restrictions.map((r, i) => <span key={`restriction-${i}`}>{r.type}{i < card.restrictions.length - 1 ? ', ' : ''}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameCard;