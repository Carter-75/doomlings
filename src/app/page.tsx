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
                <Link href="/premium" className="card" style={{ borderColor: 'rgba(255, 193, 7, 0.4)', background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.08), rgba(255, 87, 34, 0.08))' }}>
                  <h3 className="text-center mb-2" style={{ color: '#ffc107' }}>✨ Remove Ads</h3>
                  <p className="text-center" style={{ color: '#ccc' }}>
                    Upgrade to Premium for an uninterrupted, ad-free experience.
                  </p>
                </Link>
              </div>
            )}

            {/* Inline Mode Selection */}
            {showModeModal && (
              <div className="mt-8 mb-6 animate-in fade-in duration-200">
                <h2 className="text-3xl font-bold text-center text-primary-orange mb-2">Choose Game Mode</h2>
                <p className="text-gray-400 text-center mb-6">How would you like to play today?</p>

                <div className="grid grid-auto gap-6">
                  {/* Companion App Link */}
                  <Link href="/game" className="card w-full">
                    <h3 className="text-center mb-2">📱 Companion App</h3>
                    <p className="text-center text-gray-400 text-sm mt-2">
                      Track physical card game scores, ages, and rules. Optionally sync your stats across local WiFi.
                    </p>
                  </Link>

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

      {showPremiumPopup && (
        <>
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 9999
            }}
            onClick={() => setShowPremiumPopup(false)}
          />
          <div
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '90%', maxWidth: '400px', zIndex: 10000,
              backgroundColor: '#111', borderRadius: '12px', padding: '10px 0',
              border: '1px solid rgba(255, 193, 7, 0.4)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}
          >
            <button
              onClick={() => setShowPremiumPopup(false)}
              style={{
                position: 'absolute', top: '10px', right: '15px',
                background: 'transparent', border: 'none', color: '#888',
                fontSize: '24px', cursor: 'pointer', zIndex: 10
              }}
            >
              ×
            </button>
            <div style={{ width: '100%', padding: '30px 20px 10px', textAlign: 'center' }}>
              <h2 style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Upgrade to Premium</h2>
              <p style={{ color: '#eee', fontSize: '16px', marginBottom: '25px' }}>Unlock all cards & remove ads for as low as <strong>.99/mo</strong>!</p>
              
              <button
                onClick={() => {
                  setShowPremiumPopup(false);
                  router.push('/premium');
                }}
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  border: 'none',
                  color: '#000',
                  padding: '12px 30px',
                  borderRadius: '30px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                  marginBottom: '15px',
                  width: '100%'
                }}
              >
                View Subscription Plans
              </button>

              <button
                onClick={() => setShowPremiumPopup(false)}
                style={{
                  background: 'transparent', 
                  border: 'none', 
                  color: '#aaa',
                  padding: '10px', 
                  cursor: 'pointer',
                  fontSize: '14px', 
                  textDecoration: 'underline'
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
