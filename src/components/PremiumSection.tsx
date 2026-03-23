'use client';

import React from 'react';
import { useAds } from '@/lib/ad-context';
import { Capacitor } from '@capacitor/core';

export const PremiumSection = () => {
    const { adsRemoved, loading: adsLoading, packages, purchaseProduct, restorePurchases } = useAds();
    const isNativeApp = typeof window !== 'undefined' && Capacitor.isNativePlatform();

    return (
        <div className="box p-8 backdrop-blur-xl bg-opacity-80 text-center w-full max-w-2xl mx-auto premium-bg">
            <h2 className="section-title mb-2">✨ Remove Ads</h2>
            <p className="text-muted mb-6">Enjoy an ad-free experience with our Monthly, Yearly, or Lifetime plans!</p>

            <div className="flex justify-center mb-8">
                {adsLoading ? (
                    <span className="status-pill info">⏳ Checking subscription…</span>
                ) : adsRemoved ? (
                    <span className="status-pill success">✅ Premium Active — Ads Removed</span>
                ) : (
                    <span className="status-pill warning">
                        <span className="pulse-dot mr-2"></span>
                        Current Status: Free Tier (Ads Enabled)
                    </span>
                )}
            </div>

            {!adsRemoved && (
                <div className="box p-6 bg-opacity-10 bg-white border-white/10 mb-8 inline-block text-left">
                    <ul className="list-disc pl-6 space-y-2 text-muted">
                        <li>🚫 No banner ads</li>
                        <li>🚫 No interstitial ads</li>
                        <li>⚡ Faster, cleaner gameplay</li>
                        <li>❤️ Support the developer</li>
                    </ul>
                </div>
            )}

            {!adsRemoved && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { identifier: 'remove_ads_monthly', title: 'Monthly', description: 'Ad-free for 1 month.', priceString: '$3.99/mo' },
                        { identifier: 'remove_ads_yearly', title: 'Yearly', description: 'Ad-free for 1 year. Includes a 1-week free trial!', priceString: '$39.99/yr' },
                        { identifier: 'remove_ads_lifetime', title: 'Lifetime', description: 'Ad-free forever.', priceString: '$49.99' }
                    ].map((pkg) => (
                        <div key={pkg.identifier} className="card p-5 hover-scale border-primary/20 flex flex-col gap-2 bg-black/20">
                            <h3 className="has-text-weight-bold is-size-5 mb-0" style={{ color: 'var(--primary)' }}>{pkg.title}</h3>
                            <p className="is-size-7 text-muted mb-2">{pkg.description}</p>
                            <div className="title is-4 mb-3">{pkg.priceString}</div>
                            <button
                                className="button is-primary w-full button-premium"
                                onClick={() => purchaseProduct(pkg.identifier)}
                                disabled={adsLoading}
                            >
                                Get Started
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap pt-4 border-t border-white/10">
                {isNativeApp && (
                    <button
                        className="button is-ghost is-small text-muted"
                        onClick={restorePurchases}
                        disabled={adsLoading}
                    >
                        🔄 Restore Previous Purchases
                    </button>
                )}
            </div>
        </div>
    );
};
