'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
    /** Available RevenueCat packages (monthly, yearly, lifetime, etc.) */
    packages: any[];
    /** Purchases a specific package */
    purchasePackage: (pkg: any) => Promise<void>;
    /** Purchases a specific product directly by its string identifier */
    purchaseProduct: (productIdentifier: string) => Promise<void>;
    /** Restores previous purchases (native only) */
    restorePurchases: () => Promise<void>;
    /** Temporarily suppress ads (e.g., during tutorial) */
    setAdsSuppressed: (suppressed: boolean) => void;
    /** Whether the banner ad is currently intended to be visible */
    bannerVisible: boolean;
}

const AdContext = createContext<AdContextValue>({
    adsRemoved: false,
    loading: true,
    subscriptionStatus: 'checking',
    packages: [],
    purchasePackage: async () => { },
    purchaseProduct: async () => { },
    restorePurchases: async () => { },
    setAdsSuppressed: () => { },
    bannerVisible: false,
});

export function useAds() {
    return useContext(AdContext);
}

// ── Lazy-load RC — only used on native, keeps web bundle clean ────────────────
async function getPurchases() {
    if (!isNative()) return null;
    const { Purchases, LOG_LEVEL, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
    return { Purchases, LOG_LEVEL, PURCHASES_ERROR_CODE };
}

// ── Helper: check entitlement from CustomerInfo ───────────────────────────────
type CustomerInfo = { entitlements: { active: Record<string, unknown> } };
function hasEntitlement(info: CustomerInfo): boolean {
    return ENTITLEMENT_ID in (info?.entitlements?.active ?? {});
}

// ─────────────────────────────────────────────────────────────────────────────
export function AdProvider({ children }: { children: React.ReactNode }) {
    const [adsRemoved, setAdsRemoved] = useState(false);
    const adsRemovedRef = useRef(false);
    const [loading, setLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'free' | 'checking'>('checking');
    const [adsSuppressed, setAdsSuppressed] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [packages, setPackages] = useState<any[]>([]);

    const persistState = useCallback(async (removed: boolean) => {
        try { await Preferences.set({ key: ADS_REMOVED_KEY, value: removed ? 'true' : 'false' }); }
        catch { if (typeof window !== 'undefined') localStorage.setItem(ADS_REMOVED_KEY, removed ? 'true' : 'false'); }
    }, []);

    const loadPersistedState = useCallback(async (): Promise<boolean> => {
        try {
            const { value } = await Preferences.get({ key: ADS_REMOVED_KEY });
            if (value === 'true') { setAdsRemoved(true); adsRemovedRef.current = true; setSubscriptionStatus('active'); return true; }
        } catch {
            if (typeof window !== 'undefined' && localStorage.getItem(ADS_REMOVED_KEY) === 'true') {
                setAdsRemoved(true); adsRemovedRef.current = true; setSubscriptionStatus('active'); return true;
            }
        }
        return false;
    }, []);

    const applyAdsState = useCallback(async (removed: boolean) => {
        setAdsRemoved(removed);
        adsRemovedRef.current = removed;
        setSubscriptionStatus(removed ? 'active' : 'free');
        await persistState(removed);
        if (isNative()) {
            (removed || adsSuppressed) ? await hideBanner() : await showBanner();
        }
    }, [persistState, adsSuppressed]);

    // Handle suppression changes
    useEffect(() => {
        if (!isNative() || loading) return;
        if (adsSuppressed || adsRemoved) {
            hideBanner();
            setBannerVisible(false);
        } else {
            showBanner();
            setBannerVisible(true);
        }
    }, [adsSuppressed, adsRemoved, loading]);

    // Apply class to body for CSS padding
    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (bannerVisible) {
            document.body.classList.add('ads-visible');
        } else {
            document.body.classList.remove('ads-visible');
        }
    }, [bannerVisible]);

    // ─── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function init() {
            let rcError = false;
            try {
                // Paint from cache immediately so UI doesn't flash
                const persisted = await loadPersistedState();

                // Start AdMob (no-op on web)
                await initializeAdMob().catch(e => console.warn('[AdMob] Init error:', e));

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
                            if (!cancelled) {
                                await applyAdsState(hasEntitlement(customerInfo));
                            }

                            // Fetch available packages to show in UI
                            const offerings = await Purchases.getOfferings();
                            if (offerings.current !== null && !cancelled) {
                                setPackages(offerings.current.availablePackages);
                            }
                        }
                    } catch (e) {
                        console.warn('[RC] Could not verify subscription or fetch offerings:', e);
                        rcError = true;
                    }
                } else {
                    rcError = true;
                }

                if (rcError && !cancelled && !persisted) {
                    setSubscriptionStatus('free');
                }

                if (!cancelled) {
                    if (!adsRemovedRef.current && isNative()) {
                        await showBanner().catch(e => console.warn('[AdMob] showBanner error:', e));
                        // Immediately mark banner as visible so the CSS body class and
                        // --ad-banner-height variable are applied in sync with the
                        // native overlay appearing. Without this, the overlay shows
                        // before padding is applied, causing content to be covered.
                        setBannerVisible(true);
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        init();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Direct Purchase Method (Mock Package) ────────────────────────────────
    const purchasePackage = useCallback(async (pkg: any) => {
        if (!isNative()) {
            alert('Subscriptions are only available in the Android app. Download it from Google Play!');
            return;
        }
        try {
            const rc = await getPurchases();
            if (!rc) throw new Error('RC unavailable');

            // Perform native purchase
            const purchaseResult = await rc.Purchases.purchasePackage({ aPackage: pkg });
            if (hasEntitlement(purchaseResult.customerInfo)) {
                await applyAdsState(true);
                alert('✅ Subscription successful! Ads have been removed.');
            }
        } catch (e: any) {
            console.error('[RC] Purchase error:', e);
            const rc = await getPurchases();
            if (rc && e.code === rc.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
                // User cancelled the purchase, do nothing
            } else {
                alert('Something went wrong processing your purchase. Please try again.');
            }
        }
    }, [applyAdsState]);

    // ─── Direct Purchase Method (By Product ID) ───────────────────────────────
    const purchaseProduct = useCallback(async (productIdentifier: string) => {
        if (!isNative()) {
            alert('Subscriptions are only available in the Android app. Download it from Google Play!');
            return;
        }
        try {
            const rc = await getPurchases();
            if (!rc) throw new Error('RC unavailable');

            // Try to find the package in current offerings first
            const existingPackage = packages.find(p => p.product.identifier === productIdentifier || p.identifier === productIdentifier);
            let purchaseResult;

            if (existingPackage) {
                purchaseResult = await rc.Purchases.purchasePackage({ aPackage: existingPackage });
            } else {
                // Fallback: try to fetch the product directly
                const { products } = await rc.Purchases.getProducts({ productIdentifiers: [productIdentifier] });
                if (!products || products.length === 0) {
                    throw new Error('Product not found dynamically: ' + productIdentifier);
                }
                purchaseResult = await rc.Purchases.purchaseStoreProduct({ product: products[0] });
            }

            if (hasEntitlement(purchaseResult.customerInfo)) {
                await applyAdsState(true);
                alert('✅ Subscription successful! Ads have been removed.');
            }
        } catch (e: any) {
            console.error('[RC] Purchase error:', e);
            const rc = await getPurchases();
            if (rc && e.code === rc.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
                // User cancelled the purchase, do nothing
            } else {
                alert('Something went wrong processing your purchase. Please try again.');
            }
        }
    }, [applyAdsState, packages]);

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

    return (
        <AdContext.Provider value={{
            adsRemoved, loading, subscriptionStatus, packages,
            purchasePackage, purchaseProduct, restorePurchases,
            setAdsSuppressed, bannerVisible,
        }}>
            {children}
        </AdContext.Provider>
    );
}
