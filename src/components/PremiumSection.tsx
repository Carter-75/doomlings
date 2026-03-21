'use client';

import React from 'react';
import { useAds } from '@/lib/ad-context';
import { Capacitor } from '@capacitor/core';

export const PremiumSection = () => {
    const { adsRemoved, loading: adsLoading, packages, purchaseProduct, restorePurchases } = useAds();
    const isNativeApp = typeof window !== 'undefined' && Capacitor.isNativePlatform();

    return (
        <div className="premium-section">
            <h2>✨ Remove Ads</h2>
            <p>Enjoy an ad-free experience with our Monthly, Yearly, or Lifetime plans!</p>

            <div className="premium-header">
                {adsLoading ? (
                    <div className="status-badge loading">⏳ Checking subscription…</div>
                ) : adsRemoved ? (
                    <div className="status-badge active">✅ Premium Active — Ads Removed</div>
                ) : (
                    <div className="status-badge free">
                        <span className="pulse-dot"></span>
                        Current Status: Free Tier (Ads Enabled)
                    </div>
                )}
            </div>

            {!adsRemoved && (
                <div className="features-container">
                    <ul className="premium-feature-list">
                        <li>🚫 No banner ads</li>
                        <li>🚫 No interstitial ads</li>
                        <li>⚡ Faster, cleaner gameplay</li>
                        <li>❤️ Support the developer</li>
                    </ul>
                </div>
            )}

            {!adsRemoved && (
                <div className="packages-grid">
                    {[
                        { identifier: 'remove_ads_monthly', title: 'Monthly – Remove Ads', description: 'Ad-free for 1 month.', priceString: '$3.99/mo' },
                        { identifier: 'remove_ads_yearly', title: 'Yearly – Remove Ads', description: 'Ad-free for 1 year. Includes a 1-week free trial!', priceString: '$39.99/yr' },
                        { identifier: 'remove_ads_lifetime', title: 'Lifetime – Remove Ads', description: 'Ad-free forever.', priceString: '$49.99' }
                    ].map((pkg) => (
                        <div key={pkg.identifier} className="package-card">
                            <h3>{pkg.title}</h3>
                            <p>{pkg.description}</p>
                            <div className="package-price">{pkg.priceString}</div>
                            <button
                                className="subscribe-btn"
                                onClick={() => purchaseProduct(pkg.identifier)}
                                disabled={adsLoading}
                            >
                                Subscribe
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="premium-btn-row">
                <button
                    className="restore-btn"
                    onClick={restorePurchases}
                    disabled={adsLoading}
                >
                    🔄 Restore Purchases
                </button>
            </div>

            <style jsx>{`
                .premium-section {
                    background: var(--light-bg);
                    border: 1px solid rgba(255, 193, 7, 0.2);
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow-card);
                    backdrop-filter: blur(24px);
                    padding: var(--space-6);
                    margin-bottom: var(--space-6);
                    text-align: center;
                }
                .premium-section h2 {
                    color: var(--warning);
                    margin-bottom: var(--space-2);
                    font-size: clamp(1.25rem, 3vw, 1.5rem);
                }
                .premium-section p {
                    color: var(--text-secondary);
                    margin-bottom: var(--space-4);
                    font-size: 0.95em;
                }
                .premium-header {
                    margin: var(--space-4) 0 var(--space-6) 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: var(--space-2) var(--space-6);
                    border-radius: 30px;
                    font-weight: bold;
                    font-size: 0.95em;
                    letter-spacing: 0.5px;
                    box-shadow: var(--shadow-primary);
                    transition: all 0.3s ease;
                }
                .status-badge.active {
                    background: rgba(0, 255, 136, 0.1);
                    border: 1px solid rgba(0, 255, 136, 0.3);
                    color: var(--success);
                    box-shadow: var(--shadow-secondary);
                }
                .status-badge.free {
                    background: rgba(255, 193, 7, 0.1);
                    border: 1px solid rgba(255, 193, 7, 0.3);
                    color: var(--warning);
                }
                .status-badge.loading {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-muted);
                }
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background-color: var(--warning);
                    border-radius: 50%;
                    box-shadow: 0 0 8px var(--warning);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(255, 193, 7, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
                }
                .features-container {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: var(--border-radius);
                    padding: var(--space-4) var(--space-6);
                    display: inline-block;
                    margin-bottom: var(--space-6);
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .packages-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--space-4);
                    margin: var(--space-5) 0;
                }
                .package-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 193, 7, 0.2);
                    border-radius: var(--border-radius-small);
                    padding: var(--space-4);
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-2);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .package-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-secondary);
                    border-color: rgba(255, 193, 7, 0.4);
                }
                .package-card h3 {
                    color: var(--warning);
                    margin: 0;
                    font-size: 1.1em;
                }
                .package-card p {
                    color: var(--text-secondary);
                    margin: 0;
                    font-size: 0.9em;
                }
                .package-price {
                    font-size: 1.25em;
                    font-weight: bold;
                    color: var(--text-primary);
                    margin: var(--space-1) 0;
                }
                .premium-btn-row {
                    display: flex;
                    gap: var(--space-3);
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .subscribe-btn {
                    background: linear-gradient(135deg, var(--warning), var(--accent-orange));
                    color: #000;
                    padding: var(--space-3) var(--space-6);
                    border: none;
                    border-radius: var(--border-radius-small);
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: bold;
                    transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
                }
                .subscribe-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--glow-primary);
                    filter: brightness(1.1);
                }
                .restore-btn {
                    background: transparent;
                    color: var(--text-secondary);
                    padding: var(--space-3) var(--space-5);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: var(--border-radius-small);
                    cursor: pointer;
                    font-size: 14px;
                    transition: border-color 0.2s, color 0.2s;
                }
                .restore-btn:hover {
                    border-color: rgba(255,255,255,0.5);
                    color: var(--text-primary);
                }
                .premium-feature-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .premium-feature-list li {
                    color: var(--text-secondary);
                    font-size: 0.95em;
                    display: flex;
                    align-items: center;
                }
                .web-only-note {
                    color: var(--text-muted);
                    font-size: 0.8em;
                    margin-top: var(--space-3);
                }
            `}</style>
        </div>
    );
};
