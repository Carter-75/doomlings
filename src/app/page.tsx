'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
      <div className="container">
      <main className="main-content">
        <div className="hero-section">
          <h1 className="title">DOOMlings Companion</h1>
          <p className="subtitle">Your digital companion for the DOOMlings board game</p>
          
          <div className="feature-grid">
            <Link href="/game" className="feature-card">
              <h3>🎮 Play Game</h3>
              <p>Start or continue your DOOMlings game with full state management</p>
            </Link>
            
            <Link href="/settings" className="feature-card">
              <h3>⚙️ Settings</h3>
              <p>Manage your game preferences and save/load game states</p>
            </Link>
            
            <Link href="/contact" className="feature-card">
              <h3>📞 Contact</h3>
              <p>Get help or report issues with the companion app</p>
            </Link>
            
            <Link href="/privacy-policy" className="feature-card">
              <h3>🔒 Privacy</h3>
              <p>Learn about how your data is handled</p>
            </Link>
          </div>
        </div>
        
        <div className="info-section">
          <h2>Features</h2>
          <ul className="features-list">
            <li>🎲 Roll challenges and track game rules</li>
            <li>📊 Manage Age decks and Catastrophe modes</li>
            <li>🎯 Handle Meaning of Life cards</li>
            <li>💎 Track Dominant cards and tiers</li>
            <li>🎁 Manage Trinket cards and player hands</li>
            <li>💾 Save and load game states</li>
            <li>📱 Mobile-friendly design</li>
          </ul>
        </div>
      </main>
      </div>
  );
}
