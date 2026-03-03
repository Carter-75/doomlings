// Professional Game Card Component - Visual Card Layouts
'use client';

import React from 'react';
import { Card } from '@/modules/doomlings/types/Card';
import { useCardImage } from '../hooks/useCardImage';

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
  const cardArtUrl = getCardImage(card.name);

  const getCardColorStyles = (color?: string) => {
    const baseGradient = 'bg-gradient-to-br';
    const selectedRing = isSelected ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-2xl shadow-yellow-400/50' : '';

    switch (color) {
      case 'red':
        return `${baseGradient} from-red-600 via-red-500 to-red-700 border-red-400 text-white shadow-red-500/50 ${selectedRing}`;
      case 'green':
        return `${baseGradient} from-green-600 via-green-500 to-green-700 border-green-400 text-white shadow-green-500/50 ${selectedRing}`;
      case 'blue':
        return `${baseGradient} from-blue-600 via-blue-500 to-blue-700 border-blue-400 text-white shadow-blue-500/50 ${selectedRing}`;
      case 'purple':
        return `${baseGradient} from-purple-600 via-purple-500 to-purple-700 border-purple-400 text-white shadow-purple-500/50 ${selectedRing}`;
      case 'colorless':
        return `${baseGradient} from-gray-600 via-gray-500 to-gray-700 border-gray-400 text-white shadow-gray-500/50 ${selectedRing}`;
      default:
        if (card.type === 'age') {
          return `${baseGradient} from-yellow-600 via-yellow-500 to-yellow-700 border-yellow-400 text-black shadow-yellow-500/50 ${selectedRing}`;
        } else if (card.type === 'catastrophe') {
          return `${baseGradient} from-red-900 via-red-800 to-black border-red-600 text-red-100 shadow-red-600/50 ${selectedRing}`;
        } else if (card.type === 'treasure') {
          return `${baseGradient} from-amber-600 via-yellow-500 to-orange-600 border-amber-400 text-black shadow-amber-500/50 ${selectedRing}`;
        } else if (card.type === 'birth_of_life') {
          return `${baseGradient} from-emerald-600 via-green-400 to-teal-600 border-emerald-400 text-white shadow-emerald-500/50 ${selectedRing}`;
        }
        return `${baseGradient} from-gray-600 via-gray-500 to-gray-700 border-gray-400 text-white shadow-gray-500/50 ${selectedRing}`;
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
      case 'legendary': return 'border-4 border-orange-400 shadow-orange-400/75';
      case 'epic': return 'border-4 border-purple-400 shadow-purple-400/75';
      case 'rare': return 'border-3 border-blue-400 shadow-blue-400/50';
      case 'holo': return 'border-4 border-pink-400 shadow-pink-400/75 bg-gradient-to-br from-pink-200 via-blue-200 to-purple-200';
      case 'promo': return 'border-4 border-yellow-400 shadow-yellow-400/75';
      default: return 'border-2';
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
        {cardArtUrl && <img src={cardArtUrl} alt={card.name} className="absolute inset-0 w-full h-full object-cover z-0" />}

        {!cardArtUrl && (
          <div className="absolute inset-0 flex flex-col pointer-events-none z-10">
            {/* Holo Effect */}
            {card.rarity === 'holo' && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/20 opacity-50 animate-pulse" />
            )}

            {/* Card Header */}
            <div className="relative p-1.5 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {card.type}
                  </span>
                  {card.variety && (
                    <span className="text-xs bg-white/20 px-1 rounded">
                      {card.variety.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {card.faceValue !== undefined && (
                  <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-xs font-bold">
                    {card.faceValue}
                  </div>
                )}
              </div>
            </div>

            {/* Card Body */}
            <div className="relative flex-1 p-1.5">
              {/* Type Icon */}
              <div className="text-center mb-1">
                <div className="text-2xl mb-1">{getCardTypeIcon()}</div>
                <div className="text-xs font-bold truncate px-1" title={card.name}>
                  {card.name}
                </div>
              </div>

              {/* Card Effect Text */}
              {showDetails && (
                <div className="text-xs leading-tight opacity-90 px-1">
                  <div className="line-clamp-3" title={card.textPlaceholder}>
                    {card.textPlaceholder.length > 60
                      ? `${card.textPlaceholder.substring(0, 60)}...`
                      : card.textPlaceholder
                    }
                  </div>
                </div>
              )}

              {/* Species/Variety Badge */}
              {(card.species || card.variety) && (
                <div className="absolute top-1 right-1">
                  <div className="w-4 h-4 bg-black/50 rounded-full flex items-center justify-center text-xs">
                    {card.species ? '🧬' : card.variety ? '✨' : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="relative p-1.5 border-t border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {card.dominantLimitImpact > 0 && (
                    <span className="text-xs bg-red-500/50 px-1 rounded" title="Counts toward Dominant limit">
                      D
                    </span>
                  )}
                  {card.genePoolDelta && (
                    <span className="text-xs bg-blue-500/50 px-1 rounded" title="Gene Pool modifier">
                      {card.genePoolDelta > 0 ? '+' : ''}{card.genePoolDelta}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold bg-yellow-500/50 px-1.5 py-0.5 rounded">
                  {card.pointValue}pts
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
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