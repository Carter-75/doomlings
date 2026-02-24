'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { initializeAdMob, showBanner, hideBanner, isNative } from './admob-service';

// ─── RevenueCat config ────────────────────────────────────────────────────────
// docs: https://www.revenuecat.com/docs/getting-started/installation/capacitor
// Same key works for Android & iOS — set in .env.local
const RC_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY ?? '';
// Must exactly match the entitlement id in your RC dashboard
const ENTITLEMENT_ID = 'DOOMlings Companion Pro';
const ADS_REMOVED_KEY = 'adsRemoved';
// ─────────────────────────────────────────────────────────────────────────────

interface AdContextValue {
    adsRemoved: boolean;
    loading: boolean;
    subscriptionStatus: 'active' | 'free' | 'checking';
    /** Opens the RevenueCat paywall (native only) */
    purchaseSubscription: () => Promise<void>;
    /** Restores previous purchases (native only) */
    restorePurchases: () => Promise<void>;
    /** Opens the RevenueCat Customer Center — lets users manage/cancel subs (native only) */
    openCustomerCenter: () => Promise<void>;
}

const AdContext = createContext<AdContextValue>({
    adsRemoved: false,
    loading: true,
    subscriptionStatus: 'checking',
    purchaseSubscription: async () => { },
    restorePurchases: async () => { },
    openCustomerCenter: async () => { },
});

export function useAds() {
    return useContext(AdContext);
}

// ── Lazy-load RC — only used on native, keeps web bundle clean ────────────────
async function getPurchases() {
    if (!isNative()) return null;
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    return { Purchases, LOG_LEVEL };
}

async function getPaywallUI() {
    if (!isNative()) return null;
    return import('@revenuecat/purchases-capacitor-ui');
}

// ── Helper: check entitlement from CustomerInfo ───────────────────────────────
type CustomerInfo = { entitlements: { active: Record<string, unknown> } };
function hasEntitlement(info: CustomerInfo): boolean {
    return ENTITLEMENT_ID in (info?.entitlements?.active ?? {});
}

// ─────────────────────────────────────────────────────────────────────────────
export function AdProvider({ children }: { children: React.ReactNode }) {
    const [adsRemoved, setAdsRemoved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'free' | 'checking'>('checking');

    const persistState = useCallback(async (removed: boolean) => {
        try { await Preferences.set({ key: ADS_REMOVED_KEY, value: removed ? 'true' : 'false' }); }
        catch { if (typeof window !== 'undefined') localStorage.setItem(ADS_REMOVED_KEY, removed ? 'true' : 'false'); }
    }, []);

    const loadPersistedState = useCallback(async (): Promise<boolean> => {
        try {
            const { value } = await Preferences.get({ key: ADS_REMOVED_KEY });
            if (value === 'true') { setAdsRemoved(true); setSubscriptionStatus('active'); return true; }
        } catch {
            if (typeof window !== 'undefined' && localStorage.getItem(ADS_REMOVED_KEY) === 'true') {
                setAdsRemoved(true); setSubscriptionStatus('active'); return true;
            }
        }
        return false;
    }, []);

    const applyAdsState = useCallback(async (removed: boolean) => {
        setAdsRemoved(removed);
        setSubscriptionStatus(removed ? 'active' : 'free');
        await persistState(removed);
        if (isNative()) { removed ? await hideBanner() : await showBanner(); }
    }, [persistState]);

    // ─── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function init() {
            // Paint from cache immediately so UI doesn't flash
            const persisted = await loadPersistedState();

            // Start AdMob (no-op on web)
            await initializeAdMob();

            if (isNative() && RC_API_KEY) {
                try {
                    const rc = await getPurchases();
                    if (rc) {
                        const { Purchases, LOG_LEVEL } = rc;

                        // Debug logging (matches RC quickstart)
                        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

                        // Configure — same key for Android & iOS
                        await Purchases.configure({ apiKey: RC_API_KEY });

                        // Verify entitlement with RC backend
                        const { customerInfo } = await Purchases.getCustomerInfo();
                        if (!cancelled) await applyAdsState(hasEntitlement(customerInfo));
                    }
                } catch (e) {
                    console.warn('[RC] Could not verify subscription:', e);
                    if (!cancelled && !persisted) setSubscriptionStatus('free');
                }
            } else {
                if (!cancelled && !persisted) setSubscriptionStatus('free');
            }

            if (!cancelled) {
                if (!adsRemoved && isNative()) await showBanner();
                setLoading(false);
            }
        }

        init();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Subscribe — presents RC Paywall (Monthly / Yearly / Lifetime) ──────────
    // Products are configured in the RC dashboard → Offerings
    // Create 3 products in Play Console, link them in RC, assign them to offerings:
    //   monthly, yearly, lifetime
    const purchaseSubscription = useCallback(async () => {
        if (!isNative()) {
            alert('Subscriptions are only available in the Android app. Download it from Google Play!');
            return;
        }
        try {
            const ui = await getPaywallUI();
            if (!ui) throw new Error('Paywall UI unavailable');

            const { RevenueCatUI, PAYWALL_RESULT } = ui;
            const { result } = await RevenueCatUI.presentPaywall();

            switch (result) {
                case PAYWALL_RESULT.PURCHASED:
                case PAYWALL_RESULT.RESTORED:
                    await applyAdsState(true);
                    break;
                case PAYWALL_RESULT.NOT_PRESENTED:
                case PAYWALL_RESULT.ERROR:
                    alert('Could not load subscription options. Try again later.');
                    break;
                case PAYWALL_RESULT.CANCELLED:
                default:
                    break; // user dismissed — do nothing
            }
        } catch (e) {
            console.error('[RC] Paywall error:', e);
            alert('Something went wrong. Please try again.');
        }
    }, [applyAdsState]);

    // ─── Restore purchases ──────────────────────────────────────────────────────
    const restorePurchases = useCallback(async () => {
        if (!isNative()) { alert('Restore Purchases is only available in the Android app.'); return; }
        try {
            const rc = await getPurchases();
            if (!rc) throw new Error('RC unavailable');
            const { customerInfo } = await rc.Purchases.restorePurchases();
            const active = hasEntitlement(customerInfo);
            await applyAdsState(active);
            alert(active
                ? '✅ Purchase restored! Ads have been removed.'
                : 'No active subscription found for this Google Play account.');
        } catch (e) {
            console.error('[RC] Restore failed:', e);
            alert('Could not restore purchases. Check your connection and try again.');
        }
    }, [applyAdsState]);

    // ─── Customer Center — lets users manage/cancel subscription ───────────────
    // docs: https://www.revenuecat.com/docs/tools/customer-center
    const openCustomerCenter = useCallback(async () => {
        if (!isNative()) { alert('Customer Center is only available in the Android app.'); return; }
        try {
            const ui = await getPaywallUI();
            if (!ui) throw new Error('UI unavailable');
            await ui.RevenueCatUI.presentCustomerCenter();
        } catch (e) {
            console.error('[RC] Customer Center error:', e);
            alert('Could not open subscription management. Try again later.');
        }
    }, []);

    return (
        <AdContext.Provider value={{
            adsRemoved, loading, subscriptionStatus,
            purchaseSubscription, restorePurchases, openCustomerCenter,
        }}>
            {children}
        </AdContext.Provider>
    );
}
