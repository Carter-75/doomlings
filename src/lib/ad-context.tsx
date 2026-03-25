'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { initializeAdMob, showBanner, hideBanner, isNative, showInterstitial } from './admob-service';
import { useNotification } from './notification-context';

// ─── RevenueCat config ────────────────────────────────────────────────────────
const RC_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY ?? '';
const ENTITLEMENT_ID = 'DOOMlings Companion Pro';
const ADS_REMOVED_KEY = 'adsRemoved';
const SUBSCRIPTION_TYPE_KEY = 'subscriptionType';
const SUBSCRIPTION_EXPIRY_KEY = 'subscriptionExpiry';
const REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh every 5 minutes
// ─────────────────────────────────────────────────────────────────────────────

// Subscription type hierarchy: lifetime > yearly > monthly
export type SubscriptionType = 'monthly' | 'yearly' | 'lifetime' | null;

interface AdContextValue {
    adsRemoved: boolean;
    loading: boolean;
    subscriptionStatus: 'active' | 'free' | 'checking';
    subscriptionType: SubscriptionType;
    subscriptionExpiry: Date | null;
    packages: any[];
    purchasePackage: (pkg: any) => Promise<void>;
    purchaseProduct: (productIdentifier: string) => Promise<void>;
    restorePurchases: () => Promise<void>;
    setAdsSuppressed: (suppressed: boolean) => void;
    bannerVisible: boolean;
    recordClick: () => void;
}

const AdContext = createContext<AdContextValue>({
    adsRemoved: false,
    loading: true,
    subscriptionStatus: 'checking',
    subscriptionType: null,
    subscriptionExpiry: null,
    packages: [],
    purchasePackage: async () => { },
    purchaseProduct: async () => { },
    restorePurchases: async () => { },
    setAdsSuppressed: () => { },
    bannerVisible: false,
    recordClick: () => { },
});

export function useAds() {
    return useContext(AdContext);
}

// ── Lazy-load RC
async function getPurchases() {
    if (!isNative()) return null;
    const { Purchases, LOG_LEVEL, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
    return { Purchases, LOG_LEVEL, PURCHASES_ERROR_CODE };
}

// ── Helper: check entitlement and extract type from customerInfo
type CustomerInfo = {
    entitlements: { active: Record<string, { expirationDate: string | null }> }
};

interface EntitlementInfo {
    hasEntitlement: boolean;
    subscriptionType: SubscriptionType;
    expiry: Date | null;
}

function getEntitlementInfo(info: CustomerInfo): EntitlementInfo {
    const entitlement = info?.entitlements?.active?.[ENTITLEMENT_ID];
    if (!entitlement) {
        return { hasEntitlement: false, subscriptionType: null, expiry: null };
    }

    // Determine type based on expirationDate
    // - null/missing = lifetime
    // - far future date = lifetime was purchased
    // - near future date = monthly/yearly (inferred from product)
    const expiryStr = entitlement.expirationDate;
    if (!expiryStr) {
        return { hasEntitlement: true, subscriptionType: 'lifetime', expiry: null };
    }

    const expiry = new Date(expiryStr);
    return { hasEntitlement: true, subscriptionType: null, expiry }; // Type set in purchase logic
}

function inferSubscriptionTypeFromProduct(productIdentifier: string): SubscriptionType {
    if (productIdentifier.includes('monthly')) return 'monthly';
    if (productIdentifier.includes('yearly')) return 'yearly';
    if (productIdentifier.includes('lifetime')) return 'lifetime';
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
export function AdProvider({ children }: { children: React.ReactNode }) {
    const { showNotification } = useNotification();
    const [adsRemoved, setAdsRemoved] = useState(false);
    const adsRemovedRef = useRef(false);
    const [loading, setLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'free' | 'checking'>('checking');
    const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>(null);
    const [subscriptionExpiry, setSubscriptionExpiry] = useState<Date | null>(null);
    const [adsSuppressed, setAdsSuppressed] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [packages, setPackages] = useState<any[]>([]);
    const [clickCount, setClickCount] = useState(0);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const AD_CLICK_THRESHOLD = 15;

    // ─── Persist subscription state
    const persistSubscriptionState = useCallback(async (
        removed: boolean,
        type: SubscriptionType,
        expiry: Date | null
    ) => {
        try {
            await Preferences.set({ key: ADS_REMOVED_KEY, value: removed ? 'true' : 'false' });
            if (type) await Preferences.set({ key: SUBSCRIPTION_TYPE_KEY, value: type });
            if (expiry) await Preferences.set({ key: SUBSCRIPTION_EXPIRY_KEY, value: expiry.toISOString() });
        } catch (e) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(ADS_REMOVED_KEY, removed ? 'true' : 'false');
                if (type) localStorage.setItem(SUBSCRIPTION_TYPE_KEY, type);
                if (expiry) localStorage.setItem(SUBSCRIPTION_EXPIRY_KEY, expiry.toISOString());
            }
        }
    }, []);

    // ─── Load persisted subscription state
    const loadPersistedState = useCallback(async (): Promise<{
        removed: boolean;
        type: SubscriptionType;
        expiry: Date | null;
    }> => {
        try {
            const [adsVal, typeVal, expiryVal] = await Promise.all([
                Preferences.get({ key: ADS_REMOVED_KEY }),
                Preferences.get({ key: SUBSCRIPTION_TYPE_KEY }),
                Preferences.get({ key: SUBSCRIPTION_EXPIRY_KEY }),
            ]);

            const removed = adsVal.value === 'true';
            const type = (typeVal.value as SubscriptionType) || null;
            const expiry = expiryVal.value ? new Date(expiryVal.value) : null;

            return { removed, type, expiry };
        } catch {
            if (typeof window !== 'undefined') {
                const removed = localStorage.getItem(ADS_REMOVED_KEY) === 'true';
                const type = (localStorage.getItem(SUBSCRIPTION_TYPE_KEY) as SubscriptionType) || null;
                const expiryStr = localStorage.getItem(SUBSCRIPTION_EXPIRY_KEY);
                const expiry = expiryStr ? new Date(expiryStr) : null;
                return { removed, type, expiry };
            }
            return { removed: false, type: null, expiry: null };
        }
    }, []);

    // ─── Apply subscription state (updates UI and banner)
    const applySubscriptionState = useCallback(async (
        removed: boolean,
        type: SubscriptionType,
        expiry: Date | null
    ) => {
        setAdsRemoved(removed);
        adsRemovedRef.current = removed;
        setSubscriptionStatus(removed ? 'active' : 'free');
        setSubscriptionType(type);
        setSubscriptionExpiry(expiry);

        await persistSubscriptionState(removed, type, expiry);

        if (isNative()) {
            (removed || adsSuppressed) ? await hideBanner() : await showBanner();
        }
    }, [persistSubscriptionState, adsSuppressed]);

    // ─── Refresh subscription status from RevenueCat
    const refreshSubscriptionStatus = useCallback(async () => {
        if (!isNative() || !RC_API_KEY) return;

        try {
            const rc = await getPurchases();
            if (!rc) return;

            const { customerInfo } = await rc.Purchases.getCustomerInfo();
            const { hasEntitlement, subscriptionType: type, expiry } = getEntitlementInfo(customerInfo);

            if (hasEntitlement) {
                await applySubscriptionState(true, type, expiry);
            }
        } catch (e) {
            console.warn('[RC] Failed to refresh subscription status:', e);
        }
    }, [applySubscriptionState]);

    // ─── Handle banner visibility changes
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

    // ─── Initialize
    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                // Load cached state
                const persisted = await loadPersistedState();
                if (persisted.removed) {
                    setAdsRemoved(true);
                    adsRemovedRef.current = true;
                    setSubscriptionType(persisted.type);
                    setSubscriptionExpiry(persisted.expiry);
                    setSubscriptionStatus('active');
                }

                // Initialize AdMob
                await initializeAdMob().catch(e => console.warn('[AdMob] Init error:', e));

                if (isNative() && RC_API_KEY && !cancelled) {
                    try {
                        const rc = await getPurchases();
                        if (rc) {
                            const { Purchases, LOG_LEVEL } = rc;
                            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
                            await Purchases.configure({ apiKey: RC_API_KEY });

                            // Get subscription status from RevenueCat
                            const { customerInfo } = await Purchases.getCustomerInfo();
                            const { hasEntitlement, subscriptionType: type, expiry } = getEntitlementInfo(customerInfo);

                            if (!cancelled) {
                                await applySubscriptionState(hasEntitlement, type, expiry);
                            }

                            // Fetch packages
                            const offerings = await Purchases.getOfferings();
                            if (offerings.current !== null && !cancelled) {
                                setPackages(offerings.current.availablePackages);
                            }

                            // Set up periodic refresh
                            if (!cancelled) {
                                refreshIntervalRef.current = setInterval(() => {
                                    refreshSubscriptionStatus();
                                }, REFRESH_INTERVAL);
                            }
                        }
                    } catch (e) {
                        console.warn('[RC] Init failed:', e);
                        if (!cancelled && !persisted.removed) {
                            setSubscriptionStatus('free');
                        }
                    }
                } else if (!cancelled && !persisted.removed) {
                    setSubscriptionStatus('free');
                }

                if (!cancelled && !adsRemovedRef.current && isNative()) {
                    await showBanner().catch(e => console.warn('[AdMob] showBanner error:', e));
                    setBannerVisible(true);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        init();
        return () => {
            cancelled = true;
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Purchase Package
    const purchasePackage = useCallback(async (pkg: any) => {
        if (!isNative()) {
            showNotification({
                title: 'Native App Required',
                message: 'Subscriptions are only available in the Android app. Download it from Google Play!',
                type: 'info'
            });
            return;
        }

        try {
            const rc = await getPurchases();
            if (!rc) throw new Error('RC unavailable');

            const purchaseResult = await rc.Purchases.purchasePackage({ aPackage: pkg });
            const { hasEntitlement, subscriptionType: type, expiry } = getEntitlementInfo(purchaseResult.customerInfo);

            if (hasEntitlement) {
                // Determine type from package
                const inferredType = inferSubscriptionTypeFromProduct(pkg.identifier);
                await applySubscriptionState(true, inferredType || type, expiry);

                showNotification({
                    title: 'Subscription Successful',
                    message: '✅ Ads have been removed! Thank you for your support.',
                    type: 'success'
                });
            }
        } catch (e: any) {
            console.error('[RC] Purchase error:', e);
            const rc = await getPurchases();
            if (rc && e.code === rc.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
                // User cancelled
            } else {
                showNotification({
                    title: 'Purchase Error',
                    message: 'Something went wrong. Please try again.',
                    type: 'error'
                });
            }
        }
    }, [applySubscriptionState, showNotification]);

    // ─── Purchase Product by ID
    const purchaseProduct = useCallback(async (productIdentifier: string) => {
        if (!isNative()) {
            showNotification({
                title: 'Native App Required',
                message: 'Subscriptions are only available in the Android app. Download it from Google Play!',
                type: 'info'
            });
            return;
        }

        try {
            const rc = await getPurchases();
            if (!rc) throw new Error('RC unavailable');

            const existingPackage = packages.find(
                p => p.product.identifier === productIdentifier || p.identifier === productIdentifier
            );
            let purchaseResult;

            if (existingPackage) {
                purchaseResult = await rc.Purchases.purchasePackage({ aPackage: existingPackage });
            } else {
                const { products } = await rc.Purchases.getProducts({ productIdentifiers: [productIdentifier] });
                if (!products || products.length === 0) {
                    throw new Error('Product not found: ' + productIdentifier);
                }
                purchaseResult = await rc.Purchases.purchaseStoreProduct({ product: products[0] });
            }

            const { hasEntitlement, subscriptionType: type, expiry } = getEntitlementInfo(purchaseResult.customerInfo);

            if (hasEntitlement) {
                const inferredType = inferSubscriptionTypeFromProduct(productIdentifier);
                await applySubscriptionState(true, inferredType || type, expiry);

                showNotification({
                    title: 'Subscription Successful',
                    message: '✅ Ads have been removed! Thank you for your support.',
                    type: 'success'
                });
            }
        } catch (e: any) {
            console.error('[RC] Purchase error:', e);
            const rc = await getPurchases();
            if (rc && e.code === rc.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
                // User cancelled
            } else {
                showNotification({
                    title: 'Purchase Error',
                    message: 'Something went wrong. Please try again.',
                    type: 'error'
                });
            }
        }
    }, [packages, applySubscriptionState, showNotification]);

    // ─── Restore Purchases
    const restorePurchases = useCallback(async () => {
        if (!isNative()) {
            showNotification({
                title: 'Native App Required',
                message: 'Restore Purchases is only available in the Android app.',
                type: 'info'
            });
            return;
        }

        try {
            const rc = await getPurchases();
            if (!rc) throw new Error('RC unavailable');

            const { customerInfo } = await rc.Purchases.restorePurchases();
            const { hasEntitlement, subscriptionType: type, expiry } = getEntitlementInfo(customerInfo);

            await applySubscriptionState(hasEntitlement, type, expiry);

            showNotification({
                title: 'Restore Result',
                message: hasEntitlement
                    ? '✅ Purchase restored! Ads have been removed.'
                    : 'No active subscription found for this account.',
                type: hasEntitlement ? 'success' : 'info'
            });
        } catch (e) {
            console.error('[RC] Restore failed:', e);
            showNotification({
                title: 'Error',
                message: 'Could not restore purchases. Check your connection and try again.',
                type: 'error'
            });
        }
    }, [applySubscriptionState, showNotification]);

    // ─── Record Click
    const recordClick = useCallback(() => {
        if (adsRemoved || adsSuppressed) return;

        setClickCount(prev => {
            const next = prev + 1;
            if (next >= AD_CLICK_THRESHOLD) {
                if (isNative()) {
                    showInterstitial().catch(e => console.warn('[AdMob] Interstitial error:', e));
                }
                return 0;
            }
            return next;
        });
    }, [adsRemoved, adsSuppressed]);

    // ─── Global Click Listener
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable = target.closest('button, a, .clickable, [role="button"]') ||
                window.getComputedStyle(target).cursor === 'pointer';

            if (isClickable) {
                recordClick();
            }
        };

        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, [recordClick]);

    return (
        <AdContext.Provider value={{
            adsRemoved,
            loading,
            subscriptionStatus,
            subscriptionType,
            subscriptionExpiry,
            packages,
            purchasePackage,
            purchaseProduct,
            restorePurchases,
            setAdsSuppressed,
            bannerVisible,
            recordClick
        }}>
            {children}
        </AdContext.Provider>
    );
}
