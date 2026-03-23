'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useIframe } from '@/lib/iframe-context';
import { useRouter } from 'next/navigation';
import { Preferences } from '@capacitor/preferences';
import { useAds } from '@/lib/ad-context';
import { PremiumSection } from '@/components/PremiumSection';

export default function HomePage() {
  const { isIframe, isPortfolioEmbed } = useIframe();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);

  const { adsRemoved, loading: adsLoading } = useAds();
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function checkLaunches() {
      if (adsLoading || adsRemoved) return;
      if (sessionStorage.getItem('launch_counted')) return; // Check if already counted this session

      const { value } = await Preferences.get({ key: 'app_launch_count' });
      const currentCount = value ? parseInt(value, 10) : 0;
      const newCount = currentCount + 1;

      await Preferences.set({ key: 'app_launch_count', value: newCount.toString() });
      sessionStorage.setItem('launch_counted', 'true');

      if (newCount === 2) {
        setShowPremiumPopup(true);
      }
    }

    const timer = setTimeout(() => {
      checkLaunches();
    }, 1500);

    return () => clearTimeout(timer);
  }, [adsLoading, adsRemoved]);

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

            {!adsRemoved && (
              <div className="mt-4">
                <Link href="/premium" className="card" style={{ border: '1px solid var(--warning)' }}>
                  <h3 className="text-center mb-2" style={{ color: 'var(--warning)' }}>✨ Remove Ads</h3>
                  <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                    Upgrade to Premium for an uninterrupted, ad-free experience.
                  </p>
                </Link>
              </div>
            )}

            {/* Inline Mode Selection */}
            {showModeModal && (
              <div className="mt-8 mb-6 animate-in fade-in duration-200">
                <h2 className="text-center mb-2" style={{ color: 'var(--primary-orange)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700 }}>Choose Game Mode</h2>
                <p className="text-center mb-6" style={{ color: 'var(--text-secondary)' }}>How would you like to play today?</p>

                <div className="grid grid-auto">
                  {/* Companion App Link */}
                  <Link href="/game" className="card">
                    <h3 className="text-center mb-2">📱 Companion App</h3>
                    <p className="text-center mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Track physical card game scores, ages, and rules. Optionally sync your stats across local WiFi.
                    </p>
                  </Link>

                  {/* Full Game (Coming Soon) */}
                  <div className="card relative overflow-hidden group/disabled cursor-not-allowed opacity-60 pointer-events-none">
                    <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px]" style={{ background: 'var(--dark-bg)', opacity: 0.8 }}>
                      <span className="font-bold py-2 px-6 rounded-full transform rotate-[-12deg] shadow-lg text-lg" style={{ background: 'var(--primary-orange)', color: 'var(--darker-bg)', border: '2px solid rgba(255,255,255,0.2)' }}>
                        Coming Soon!
                      </span>
                    </div>
                    <div className="filter grayscale" style={{ opacity: 0.4 }}>
                      <h3 className="text-center mb-2">🎮 Full Digital Game</h3>
                      <p className="text-center mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Play the cards entirely on your device with rules enforcement and matchmaking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Game Management Section */}
            <div className="features-grid mt-8">
              <div className="feature-card">
                <h3>📜 Complete Game Management</h3>
                <p>Manage all aspects of your game from a single app. From setup to final scoring, we've got you covered.</p>
              </div>
              <div className="feature-card">
                <h3>🔄 Real-time Synchronization</h3>
                <p>Connect with other devices on your WiFi network to automatically sync Age progressions and Challenges.</p>
              </div>
            </div>

            {/* Expandable Advanced Section */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                className="secondary-action-link"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide Options' : 'Show Advanced Options'}
              </button>

              {showAdvanced && (
                <div className="mt-6 flex flex-wrap justify-center gap-6 fade-in">
                  <Link href="https://doomlings.com/pages/contact" target="_blank" className="text-muted hover:text-white transition-colors">
                    📧 Contact
                  </Link>
                  <Link href="/privacy" className="text-muted hover:text-white transition-colors">
                    ⚖️ Privacy Policy
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Premium Popup */}
      {showPremiumPopup && (
        <div className="premium-popup-overlay">
          <div className="premium-popup-content pop-in">
            <button
              className="premium-popup-close"
              onClick={() => setShowPremiumPopup(false)}
            >
              &times;
            </button>
            <h2 className="premium-title">✨ Unlock Premium</h2>
            <p className="premium-description">
              Remove all ads and unlock advanced game management features!
            </p>
            <button
              className="premium-btn"
              onClick={() => {
                // Logic to navigate to premium or trigger purchase
                setShowPremiumPopup(false);
                router.push('/premium');
              }}
            >
              UPGRADE NOW
            </button>
            <button
              className="secondary-action-link"
              onClick={() => setShowPremiumPopup(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
