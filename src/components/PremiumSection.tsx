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

            {adsLoading ? (
                <div className="status-badge free">⏳ Checking subscription…</div>
            ) : adsRemoved ? (
                <div className="status-badge active">✅ Premium Active — Ads Removed</div>
            ) : (
                <div className="status-badge free">🔔 Free Tier — Ads Enabled</div>
            )}

            {!adsRemoved && (
                <ul className="premium-feature-list">
                    <li>🚫 No banner ads</li>
                    <li>🚫 No interstitial ads</li>
                    <li>⚡ Faster, cleaner gameplay</li>
                    <li>❤️ Support the developer</li>
                </ul>
            )}

            {!adsRemoved && (
                <div className="packages-grid">
                    {[
                        { identifier: 'remove_ads_monthly', title: 'Monthly – Remove Ads', description: 'Ad-free for 1 month.', priceString: '$1.99/mo' },
                        { identifier: 'remove_ads_yearly', title: 'Yearly – Remove Ads', description: 'Ad-free for 1 year.', priceString: '$14.99/yr' },
                        { identifier: 'remove_ads_lifetime', title: 'Lifetime – Remove Ads', description: 'Ad-free forever.', priceString: '$29.99' }
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
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 0.85em;
                    margin-bottom: 20px;
                }
                .status-badge.active {
                    background: rgba(0, 255, 136, 0.15);
                    border: 1px solid rgba(0, 255, 136, 0.4);
                    color: #00ff88;
                }
                .status-badge.free {
                    background: rgba(255, 193, 7, 0.15);
                    border: 1px solid rgba(255, 193, 7, 0.4);
                    color: #ffc107;
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
                    margin: 0 0 18px 0;
                    text-align: left;
                    display: inline-block;
                }
                .premium-feature-list li {
                    color: #e0e0e0;
                    padding: 4px 0;
                    font-size: 0.9em;
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
