'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="home-container">
      <div className="container">
        <main className="main-content">
          <div className="hero-section text-center">
            <h1 className="title mb-4">DOOMlings Companion</h1>
            <p className="subtitle mb-4">
              Your professional digital companion for the DOOMlings board game. 
              Experience seamless gameplay with advanced features and responsive design.
            </p>

            <div className="grid grid-auto mt-4">

              <Link href="/game" className="card">
                <h3 className="text-center mb-2">🎮 Play Game</h3>
                <p className="text-center">
                  Start or continue your DOOMlings game with full state management and custom controls
                </p>
              </Link>
              
              <Link href="/settings" className="card">
                <h3 className="text-center mb-2">⚙️ Settings</h3>
                <p className="text-center">
                  Manage preferences, customize data files, and save/load game states
                </p>
              </Link>
              
              <Link href="/contact" className="card">
                <h3 className="text-center mb-2">📞 Contact</h3>
                <p className="text-center">
                  Get help, report issues, or request features with comprehensive support
                </p>
              </Link>
              
              <Link href="/multiplayer" className="card">
                <h3 className="text-center mb-2">🌐 Multiplayer</h3>
                <p className="text-center">
                  Play the full Doomlings card game online with friends in real-time
                </p>
              </Link>
              
              <Link href="/privacy-policy" className="card">
                <h3 className="text-center mb-2">🔒 Privacy</h3>
                <p className="text-center">
                  Learn about our privacy-first approach and Android compatibility
                </p>
              </Link>
            </div>

          </div>
          
          <div className="card mt-4">
            <h3 className="text-center mb-2">🚀 Professional Android App</h3>
            <p className="text-center">
              Built with the latest Android 15 (API 35) target for enhanced security, performance, 
              and Google Play compliance. Enjoy a safe and modern gaming experience.
            </p>
          </div>
          
          <div className="card mt-4">
            <h2 className="text-center mb-3">Complete Game Management</h2>
            <div className="grid grid-2">
              <div className="card">
                <p>🎲 Roll challenges and track game rules with smart logic</p>
              </div>
              <div className="card">
                <p>📊 Manage Age decks and Catastrophe modes with Birth of Life priority</p>
              </div>
              <div className="card">
                <p>🎯 Handle Meaning of Life cards with custom configurations</p>
              </div>
              <div className="card">
                <p>💎 Track Dominant cards and tiers with color-coded system</p>
              </div>
              <div className="card">
                <p>🎁 Manage Trinket cards and player hands efficiently</p>
              </div>
              <div className="card">
                <p>💾 Save and load multiple game states with persistent storage</p>
              </div>
              <div className="card">
                <p>📱 Mobile-friendly design with responsive controls</p>
              </div>
              <div className="card">
                <p>🎨 Custom styled spinner buttons for precise input</p>
              </div>
              <div className="card">
                <p>🔧 Advanced customization with JSON data editing</p>
              </div>
              <div className="card">
                <p>🌙 Dark theme optimized for extended gameplay</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
