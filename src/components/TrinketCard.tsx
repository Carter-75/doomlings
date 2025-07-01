import React from 'react';

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
}

const TrinketCard: React.FC<TrinketCardProps> = ({ trinket, onAdd, onRemove, onPocket, isPocketDisabled }) => {
  return (
    <div className="trinket-card card">
        <div className="card-content">
            <h4 className="title is-5">{trinket.name}</h4>
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