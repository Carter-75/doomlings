'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useIframe } from '@/lib/iframe-context';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isIframe, isPortfolioEmbed } = useIframe();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);

  const router = useRouter();

  const handlePlayGameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModeModal(prev => !prev);
  };

  return (
    <div className="home-container">
      <div className="container">
        <main className="main-content">
          <div className="hero-section text-center">
            <h1 className="title mb-4">DOOMlings Companion</h1>
            <p className="subtitle mb-4">
              Your professional digital companion for the Doomlings board game.
              Experience seamless gameplay with advanced features and responsive design.
            </p>

            <div className="grid grid-auto mt-4">
              <a href="#" onClick={handlePlayGameClick} className="card">
                <h3 className="text-center mb-2">🎮 Play Game</h3>
                <p className="text-center">
                  Start or continue your DOOMlings game with full state tracking
                </p>
              </a>

              <Link href="/settings" className="card">
                <h3 className="text-center mb-2">⚙️ Settings</h3>
                <p className="text-center">
                  Manage preferences, themes, and save/load game states
                </p>
              </Link>
            </div>

            {/* Inline Mode Selection */}
            {showModeModal && (
              <div className="mt-8 mb-6 animate-in fade-in duration-200">
                <h2 className="text-3xl font-bold text-center text-primary-orange mb-2">Choose Game Mode</h2>
                <p className="text-gray-400 text-center mb-6">How would you like to play today?</p>

                <div className="grid grid-auto gap-6">
                  {/* Companion App Link */}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); router.push('/game'); }}
                    className="card w-full"
                  >
                    <h3 className="text-center mb-2">📱 Companion App</h3>
                    <p className="text-center text-gray-400 text-sm mt-2">
                      Track physical card game scores, ages, and rules. Optionally sync your stats across local WiFi.
                    </p>
                  </a>

                  {/* Full Game (Coming Soon) */}
                  <div className="card w-full relative overflow-hidden group/disabled cursor-not-allowed opacity-60 pointer-events-none">
                    <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-primary-orange text-white font-bold py-2 px-6 rounded-full transform rotate-[-12deg] shadow-lg text-lg border-2 border-white/20">
                        Coming Soon!
                      </span>
                    </div>
                    <div className="opacity-40 filter grayscale">
                      <h3 className="text-center mb-2">🎮 Full Digital Game</h3>
                      <p className="text-center text-gray-400 text-sm mt-2">
                        Play the cards entirely on your device with rules enforcement and matchmaking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="btn btn-secondary mt-4 w-full"
              style={{ maxWidth: '300px', margin: '1rem auto', display: 'block' }}
            >
              {showAdvanced ? 'Hide Advanced Options ▲' : 'Show Advanced Options ▼'}
            </button>

            {showAdvanced && (
              <div className="advanced-section mt-4 fade-in">
                <div className="grid grid-auto">
                  {!isIframe && (
                    <Link href="/contact" className="card">
                      <h3 className="text-center mb-2">📞 Contact</h3>
                      <p className="text-center">
                        Get help, report issues, or request features with comprehensive support
                      </p>
                    </Link>
                  )}

                  {!isIframe && (
                    <Link href="/privacy-policy" className="card">
                      <h3 className="text-center mb-2">🔒 Privacy</h3>
                      <p className="text-center">
                        Learn about our privacy-first approach and Android compatibility
                      </p>
                    </Link>
                  )}
                </div>

                {!isPortfolioEmbed && (
                  <div className="card mt-4">
                    <h3 className="text-center mb-2">🚀 Professional Android App</h3>
                    <p className="text-center">
                      Built with the latest Android 15 (API 35) target for enhanced security, performance,
                      and Google Play compliance. Enjoy a safe and modern gaming experience.
                    </p>
                  </div>
                )}

                <div className="card mt-4">
                  <h2 className="text-center mb-3">Complete Game Management</h2>
                  <div className="grid grid-2">
                    <div className="card">
                      <p>🎲 Roll challenges and track game rules with smart logic</p>
                    </div>
                    <div className="card">
                      <p>📊 Manage Age decks and Catastrophe modes</p>
                    </div>
                    <div className="card">
                      <p>🎯 Handle Meaning of Life cards with custom configurations</p>
                    </div>
                    <div className="card">
                      <p>💎 Track Dominant cards and tiers with color-coded system</p>
                    </div>
                    <div className="card">
                      <p>🌐 Sync gameplay automatically across local WiFi devices</p>
                    </div>
                    <div className="card">
                      <p>💾 Save and load multiple game states with persistent storage</p>
                    </div>
                    <div className="card">
                      <p>📱 Mobile-friendly design with responsive controls</p>
                    </div>
                    <div className="card">
                      <p>🌙 Dark theme optimized for extended gameplay</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>


    </div>
  );
}
