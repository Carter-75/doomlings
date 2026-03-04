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
                    background: linear-gradient(135deg, rgba(255, 193, 7, 0.08), rgba(255, 87, 34, 0.08));
                    border: 1px solid rgba(255, 193, 7, 0.4);
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .premium-section h2 {
                    color: #ffc107;
                    margin-bottom: 6px;
                }
                .premium-section p {
                    color: #ccc;
                    margin-bottom: 18px;
                    font-size: 0.95em;
                }
                .premium-header {
                    margin: 15px 0 25px 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 24px;
                    border-radius: 30px;
                    font-weight: bold;
                    font-size: 0.95em;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                }
                .status-badge.active {
                    background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 200, 100, 0.2));
                    border: 1px solid rgba(0, 255, 136, 0.5);
                    color: #00ff88;
                    box-shadow: 0 0 20px rgba(0, 255, 136, 0.15);
                }
                .status-badge.free {
                    background: linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.15));
                    border: 1px solid rgba(255, 193, 7, 0.5);
                    color: #ffc107;
                }
                .status-badge.loading {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #aaa;
                }
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background-color: #ffc107;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #ffc107;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(255, 193, 7, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
                }
                .features-container {
                    background: rgba(0,0,0,0.2);
                    border-radius: 12px;
                    padding: 15px 25px;
                    display: inline-block;
                    margin-bottom: 25px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .packages-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                .package-card {
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 193, 7, 0.3);
                    border-radius: 8px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .package-card h3 {
                    color: #ffc107;
                    margin: 0;
                    font-size: 1.1em;
                }
                .package-card p {
                    color: #ccc;
                    margin: 0;
                    font-size: 0.9em;
                }
                .package-price {
                    font-size: 1.25em;
                    font-weight: bold;
                    color: #fff;
                    margin: 5px 0;
                }
                .premium-btn-row {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .subscribe-btn {
                    background: linear-gradient(135deg, #ffc107, #ff5722);
                    color: #000;
                    padding: 12px 28px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: bold;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .subscribe-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
                }
                .restore-btn {
                    background: transparent;
                    color: #ccc;
                    padding: 12px 20px;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: border-color 0.2s, color 0.2s;
                }
                .restore-btn:hover {
                    border-color: rgba(255,255,255,0.5);
                    color: #fff;
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
                    color: #e0e0e0;
                    font-size: 0.95em;
                    display: flex;
                    align-items: center;
                }
                .web-only-note {
                    color: #888;
                    font-size: 0.8em;
                    margin-top: 12px;
                }
            `}</style>
        </div>
    );
};
