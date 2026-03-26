'use client';

import React, { useState } from 'react';
import { useAds } from '@/lib/ad-context';
import { Capacitor } from '@capacitor/core';
import { MONETIZATION_DISABLED } from '@/lib/monetization-config';

export const PremiumSection = () => {
    if (MONETIZATION_DISABLED) return null;

    const { adsRemoved, loading: adsLoading, packages, purchaseProduct, restorePurchases, subscriptionType, subscriptionExpiry } = useAds();
    const isNativeApp = typeof window !== 'undefined' && Capacitor.isNativePlatform();
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    const formatExpiry = (date: Date | null) => {
        if (!date) return 'Forever';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getSubscriptionLabel = () => {
        if (!subscriptionType) return null;
        const expiry = subscriptionExpiry ? ` (expires ${formatExpiry(subscriptionExpiry)})` : '';
        const labels = {
            'monthly': `Monthly Plan${expiry}`,
            'yearly': `Yearly Plan${expiry}`,
            'lifetime': 'Lifetime - Ads Removed Forever'
        };
        return labels[subscriptionType] || null;
    };

    const handlePurchase = async (productId: string) => {
        setPurchasingId(productId);
        try {
            await purchaseProduct(productId);
        } finally {
            setPurchasingId(null);
        }
    };

    return (
        <div className="box p-8 backdrop-blur-xl bg-opacity-80 text-center w-full max-w-2xl mx-auto premium-bg">
            <h2 className="section-title mb-2">✨ Remove Ads</h2>
            <p className="text-muted mb-6">Enjoy an ad-free experience with our Monthly, Yearly, or Lifetime plans!</p>

            <div className="flex justify-center mb-8">
                {adsLoading ? (
                    <span className="status-pill info">⏳ Checking subscription…</span>
                ) : adsRemoved ? (
                    <div className="text-center">
                        <span className="status-pill success">✅ Premium Active — Ads Removed</span>
                        {getSubscriptionLabel() && (
                            <p className="text-sm text-muted mt-3">{getSubscriptionLabel()}</p>
                        )}
                    </div>
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
                        { identifier: 'remove_ads_monthly:monthly', title: 'Monthly', description: 'Ad-free for 1 month.', priceString: '$3.99/mo' },
                        { identifier: 'remove_ads_yearly:yearly', title: 'Yearly', description: 'Ad-free for 1 year. Includes a 1-week free trial!', priceString: '$39.99/yr' },
                        { identifier: 'remove_ads_lifetime', title: 'Lifetime', description: 'Ad-free forever.', priceString: '$49.99' }
                    ].map((pkg) => (
                        <div key={pkg.identifier} className="card p-5 hover-scale border-primary/20 flex flex-col gap-2 bg-black/20">
                            <h3 className="has-text-weight-bold is-size-5 mb-0" style={{ color: 'var(--primary)' }}>{pkg.title}</h3>
                            <p className="is-size-7 text-muted mb-2">{pkg.description}</p>
                            <div className="title is-4 mb-3">{pkg.priceString}</div>
                            <button
                                className="button is-primary w-full button-premium"
                                onClick={() => handlePurchase(pkg.identifier)}
                                disabled={adsLoading || purchasingId !== null}
                            >
                                {purchasingId === pkg.identifier ? '⏳ Processing...' : 'Get Started'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Show upgrade option if user has a lower-tier subscription */}
            {adsRemoved && subscriptionType && subscriptionType !== 'lifetime' && (
                <div className="box p-6 bg-opacity-10 bg-primary/20 border-primary/20 mb-6 rounded">
                    <p className="text-muted mb-2"><strong>⚠️ No Refunds on Upgrades:</strong></p>
                    <p className="text-muted mb-4 text-sm">When you upgrade, your current plan will auto-cancel and you'll be charged the full price of the new plan. You will NOT receive a refund for any remaining unused time on your current plan.</p>
                    <div className="flex gap-3 flex-wrap justify-center">
                        {subscriptionType === 'monthly' && (
                            <>
                                <button
                                    className="button is-primary is-small"
                                    onClick={() => handlePurchase('remove_ads_yearly:yearly')}
                                    disabled={purchasingId !== null}
                                >
                                    {purchasingId === 'remove_ads_yearly:yearly' ? '⏳' : '→'} Upgrade to Yearly
                                </button>
                                <button
                                    className="button is-info is-small"
                                    onClick={() => handlePurchase('remove_ads_lifetime')}
                                    disabled={purchasingId !== null}
                                >
                                    {purchasingId === 'remove_ads_lifetime' ? '⏳' : '→'} Upgrade to Lifetime
                                </button>
                            </>
                        )}
                        {subscriptionType === 'yearly' && (
                            <button
                                className="button is-info is-small"
                                onClick={() => handlePurchase('remove_ads_lifetime')}
                                disabled={purchasingId !== null}
                            >
                                {purchasingId === 'remove_ads_lifetime' ? '⏳' : '→'} Upgrade to Lifetime
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="box p-4 bg-opacity-5 bg-white/10 border-white/10 mb-6 rounded text-left text-sm">
                <p className="text-muted mb-2"><strong>📋 Important Terms:</strong></p>
                <ul className="list-disc pl-6 space-y-1 text-muted text-xs">
                    <li><strong>NO REFUNDS:</strong> You will NOT get a refund for unused time when upgrading plans.</li>
                    <li><strong>Auto-Cancel on Upgrade:</strong> Your old plan auto-cancels when you upgrade; you pay full price for the new plan.</li>
                    <li><strong>Account-Specific:</strong> Subscriptions are tied to your Google Play account and cannot be transferred.</li>
                    <li><strong>Lifetime = Forever:</strong> Once purchased, Lifetime removes ads permanently with no additional charges ever.</li>
                    <li><strong>One Plan Per User:</strong> Only one subscription tier can be active at a time.</li>
                    <li><strong>Instant Update:</strong> No app refresh needed after purchase — status updates immediately.</li>
                    <li><strong>Double-Tap Prevention:</strong> Wait for "⏳ Processing..." to disappear before clicking other buttons.</li>
                </ul>
            </div>

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
