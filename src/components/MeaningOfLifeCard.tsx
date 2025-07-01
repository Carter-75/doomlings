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
}

const MeaningOfLifeCard: React.FC<MeaningOfLifeCardProps> = ({ card, isRevealed, isSelected, onChoose, isViewing }) => {
  const cardClasses = [
    'meaning-card',
    isRevealed ? 'revealed' : '',
    isSelected ? 'selected-card' : ''
  ].join(' ');
  
  return (
    <div className={cardClasses} onClick={onChoose}>
      <h4 className="meaning-card-name">{card.name}</h4>
      {(isRevealed || isViewing) && <p>{card.description}</p>}
    </div>
  );
};

export default MeaningOfLifeCard; 