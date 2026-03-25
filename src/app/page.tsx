'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const modeModalRef = useRef<HTMLDivElement>(null);

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

  // Scroll to mode modal when it becomes visible
  useEffect(() => {
    if (showModeModal && modeModalRef.current) {
      // Enable smooth scroll temporarily for this action
      document.documentElement.style.scrollBehavior = 'smooth';
      setTimeout(() => {
        modeModalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Disable smooth scroll after action completes
        setTimeout(() => {
          document.documentElement.style.scrollBehavior = 'auto';
        }, 500);
      }, 100);
    }
  }, [showModeModal]);

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
              <a href="/game" onClick={handlePlayGameClick} className="card">
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
              <div ref={modeModalRef} className="mt-8 mb-8 animate-in fade-in duration-300">
                <h2 className="text-center mb-1" style={{ color: 'var(--primary-orange)', fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 800 }}>Choose Game Mode</h2>
                <p className="text-center mb-6" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>How would you like to play today?</p>

                <div className="grid grid-auto gap-4 sm:grid-cols-2">
                  {/* Companion App Link */}
                  <Link href="/game" className="card group hover-scale border-primary/20 bg-black/40 p-8 block">
                    <div className="text-center">
                      <h3 className="is-size-4 mb-2">📱 Companion App</h3>
                      <p className="is-size-7 text-muted max-w-xs mx-auto">
                        The official digital companion. Track scores, ages, and rules for your physical game.
                      </p>
                    </div>
                  </Link>

                  {/* Full Game (Coming Soon) */}
                  <div className="card relative overflow-hidden cursor-not-allowed border-white/5 bg-black/40 p-8 block">
                    <div className="absolute top-3 right-3 z-20">
                      <span 
                        className="status-pill text-[10px] font-bold py-1 px-3 shadow-sm" 
                        style={{ 
                          backgroundColor: 'rgba(var(--primary-rgb), 0.15)', 
                          color: 'var(--primary)', 
                          border: '1px solid var(--primary)',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        COMING SOON!
                      </span>
                    </div>
                    <div className="text-center filter grayscale opacity-20">
                      <h3 className="is-size-4 mb-2">🎮 Full Digital Game</h3>
                      <p className="is-size-7 text-muted max-w-xs mx-auto">
                        Play entire matches digitally with laws, rules enforcement, and global matchmaking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!adsRemoved && (
              <div className="mt-8 mb-6">
                <Link 
                  href="/premium" 
                  className="card group relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] block p-8" 
                  style={{ 
                    border: '1px solid var(--primary)', 
                    background: 'rgba(var(--primary-rgb), 0.15)',
                    backgroundColor: '#15181c',
                    boxShadow: '0 0 30px rgba(var(--primary-rgb), 0.1)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  <div className="text-center relative z-10">
                    <h3 className="is-size-4 mb-1" style={{ color: 'var(--primary)', fontWeight: 800 }}>✨ Remove All Ads</h3>
                    <p className="is-size-7 opacity-80" style={{ color: 'var(--text-secondary)' }}>
                      Unlock the premium aesthetic and support the developer.
                    </p>
                  </div>
                </Link>
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
                <div className="mt-8 flex flex-wrap justify-center gap-4 fade-in">
                  <Link href="/contact" className="button is-ghost is-small opacity-70 hover:opacity-100">
                    📧 Contact
                  </Link>
                  <Link href="/privacy" className="button is-ghost is-small opacity-70 hover:opacity-100">
                    ⚖️ Privacy Policy
                  </Link>
                  <Link href="/subscription-policy" className="button is-ghost is-small opacity-70 hover:opacity-100">
                    💳 Subscription Policy
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
