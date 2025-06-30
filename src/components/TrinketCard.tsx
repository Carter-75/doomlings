import React from 'react';

interface Trinket {
    name: string;
    power: string;
    objective: string;
    points: number;
}

interface TrinketCardProps {
  trinket: Trinket;
  onRemove: () => void;
  onPocket: () => void;
}

const TrinketCard: React.FC<TrinketCardProps> = ({ trinket, onRemove, onPocket }) => {
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
            <a href="#" className="card-footer-item remove-btn" onClick={(e) => { e.preventDefault(); onRemove(); }}>Remove</a>
            <a href="#" className="card-footer-item pocket-btn" onClick={(e) => { e.preventDefault(); onPocket(); }}>Pocket</a>
        </footer>
    </div>
  );
};

export default TrinketCard; 