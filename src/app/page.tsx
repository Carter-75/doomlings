'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <style jsx>{`
        .home-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        .hero-section {
          text-align: center;
          padding: 60px 20px 40px;
          position: relative;
          z-index: 2;
        }

        .title {
          font-size: 3.5em;
          font-weight: bold;
          background: linear-gradient(135deg, #00ff88, #3c82f7, #e67e22);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
          text-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
          animation: titleGlow 3s ease-in-out infinite alternate;
        }

        @keyframes titleGlow {
          0% { text-shadow: 0 0 30px rgba(0, 255, 136, 0.3); }
          100% { text-shadow: 0 0 50px rgba(60, 130, 247, 0.5); }
        }

        .subtitle {
          font-size: 1.3em;
          color: #ccc;
          margin-bottom: 50px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .feature-card {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
          border: 2px solid transparent;
          border-radius: 15px;
          padding: 30px;
          text-decoration: none;
          color: inherit;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(60, 130, 247, 0.1), rgba(0, 255, 136, 0.1));
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: -1;
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          border-color: rgba(60, 130, 247, 0.5);
          box-shadow: 0 15px 40px rgba(60, 130, 247, 0.3);
        }

        .feature-card h3 {
          font-size: 1.4em;
          margin-bottom: 15px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .feature-card p {
          color: #ccc;
          line-height: 1.6;
          margin: 0;
        }

        .info-section {
          max-width: 1000px;
          margin: 60px auto;
          padding: 40px 20px;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 20px;
          border: 1px solid rgba(60, 130, 247, 0.2);
          backdrop-filter: blur(10px);
        }

        .info-section h2 {
          text-align: center;
          font-size: 2.2em;
          color: #00ff88;
          margin-bottom: 30px;
          text-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
        }

        .features-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .features-list li {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(60, 130, 247, 0.2);
          border-radius: 10px;
          padding: 20px;
          color: #e0e0e0;
          font-size: 1.1em;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .features-list li:hover {
          transform: translateX(5px);
          border-color: rgba(0, 255, 136, 0.4);
          background: rgba(0, 255, 136, 0.05);
        }

        .version-badge {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, rgba(60, 130, 247, 0.9), rgba(0, 255, 136, 0.9));
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: bold;
          z-index: 1000;
          box-shadow: 0 4px 15px rgba(60, 130, 247, 0.3);
        }

        .compatibility-banner {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(60, 130, 247, 0.1));
          border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 15px;
          padding: 20px;
          margin: 40px auto;
          max-width: 800px;
          text-align: center;
        }

        .compatibility-banner h3 {
          color: #00ff88;
          margin-bottom: 10px;
          font-size: 1.3em;
        }

        .compatibility-banner p {
          color: #ccc;
          margin: 0;
          line-height: 1.6;
        }

        .floating-elements {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .floating-icon {
          position: absolute;
          opacity: 0.1;
          animation: float 15s linear infinite;
          font-size: 2em;
        }

        .floating-icon:nth-child(1) { left: 10%; top: 20%; animation-delay: 0s; }
        .floating-icon:nth-child(2) { left: 80%; top: 15%; animation-delay: 3s; }
        .floating-icon:nth-child(3) { left: 15%; top: 70%; animation-delay: 6s; }
        .floating-icon:nth-child(4) { left: 85%; top: 75%; animation-delay: 9s; }
        .floating-icon:nth-child(5) { left: 50%; top: 10%; animation-delay: 12s; }

        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }

        @media (max-width: 768px) {
          .title {
            font-size: 2.5em;
          }
          
          .subtitle {
            font-size: 1.1em;
          }
          
          .feature-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .features-list {
            grid-template-columns: 1fr;
          }
          
          .version-badge {
            position: static;
            display: inline-block;
            margin-bottom: 20px;
          }
        }
      `}</style>

      <div className="home-container">
        <div className="gradient-overlay"></div>
        <div className="blue-glow-container">
          <div className="blue-circles">
            <div className="blue-circle"></div>
            <div className="blue-circle"></div>
            <div className="blue-circle"></div>
            <div className="blue-circle"></div>
            <div className="blue-circle"></div>
          </div>
        </div>

        <div className="floating-elements">
          <div className="floating-icon">🎲</div>
          <div className="floating-icon">🎮</div>
          <div className="floating-icon">⚙️</div>
          <div className="floating-icon">🎯</div>
          <div className="floating-icon">💎</div>
        </div>

        <div className="version-badge">
          v1.3 • Android 15 Ready
        </div>

        <div className="container">
          <main className="main-content">
            <div className="hero-section">
              <h1 className="title">DOOMlings Companion</h1>
              <p className="subtitle">Your digital companion for the DOOMlings board game</p>
              
              <div className="feature-grid">
                <Link href="/game" className="feature-card">
                  <h3>🎮 Play Game</h3>
                  <p>Start or continue your DOOMlings game with full state management and custom spinner controls</p>
                </Link>
                
                <Link href="/settings" className="feature-card">
                  <h3>⚙️ Settings</h3>
                  <p>Manage your game preferences, customize data files, and save/load game states</p>
                </Link>
                
                <Link href="/contact" className="feature-card">
                  <h3>📞 Contact</h3>
                  <p>Get help, report issues, or request features with comprehensive support options</p>
                </Link>
                
                <Link href="/privacy-policy" className="feature-card">
                  <h3>🔒 Privacy</h3>
                  <p>Learn about our privacy-first approach and Android 15 compatibility</p>
                </Link>
              </div>
            </div>

            <div className="compatibility-banner">
              <h3>🚀 Android 15 Compatible</h3>
              <p>
                Built with the latest Android 15 (API 35) target for enhanced security, performance, 
                and Google Play compliance. Enjoy a safe and modern gaming experience.
              </p>
            </div>
            
            <div className="info-section">
              <h2>Complete Game Management</h2>
              <ul className="features-list">
                <li>🎲 Roll challenges and track game rules with smart logic</li>
                <li>📊 Manage Age decks and Catastrophe modes with Birth of Life priority</li>
                <li>🎯 Handle Meaning of Life cards with custom configurations</li>
                <li>💎 Track Dominant cards and tiers with color-coded system</li>
                <li>🎁 Manage Trinket cards and player hands efficiently</li>
                <li>💾 Save and load multiple game states with persistent storage</li>
                <li>📱 Mobile-friendly design with responsive controls</li>
                <li>🎨 Custom styled spinner buttons for precise input</li>
                <li>🔧 Advanced customization with JSON data editing</li>
                <li>🌙 Dark theme optimized for extended gameplay</li>
              </ul>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
