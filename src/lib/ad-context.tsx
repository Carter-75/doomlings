'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { initializeAdMob, showBanner, hideBanner, isNative, showInterstitial } from './admob-service';
import { useNotification } from './notification-context';
import { MONETIZATION_DISABLED } from './monetization-config';

// ─── RevenueCat config ────────────────────────────────────────────────────────
const RC_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY ?? '';
const ENTITLEMENT_ID = 'DOOMlings Companion Pro';
const ADS_REMOVED_KEY = 'adsRemoved';
const SUBSCRIPTION_TYPE_KEY = 'subscriptionType';
const SUBSCRIPTION_EXPIRY_KEY = 'subscriptionExpiry';
const AD_TEST_UNTIL_KEY = 'adTestModeUntil';
const REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh every 5 minutes
const RC_TIMEOUT_MS = 8000;
const MONTHLY_PRODUCT_ID = 'remove_ads_monthly:monthly';
const YEARLY_PRODUCT_ID = 'remove_ads_yearly:yearly';
const LIFETIME_PRODUCT_ID = 'remove_ads_lifetime';
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
    adTestModeActive: boolean;
    adTestModeRemainingMs: number;
    enableAdTestMode: (minutes?: number) => Promise<void>;
    disableAdTestMode: () => Promise<void>;
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
    adTestModeActive: false,
    adTestModeRemainingMs: 0,
    enableAdTestMode: async () => { },
    disableAdTestMode: async () => { },
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
    entitlements?: {
        active?: Record<string, {
            expirationDate: string | null;
            productIdentifier?: string;
        }>;
    };
    activeSubscriptions?: string[];
    allPurchasedProductIdentifiers?: string[];
    latestExpirationDate?: string | null;
};

interface EntitlementInfo {
    hasEntitlement: boolean;
    subscriptionType: SubscriptionType;
    expiry: Date | null;
}

function getEntitlementInfo(info: CustomerInfo): EntitlementInfo {
    const activeEntitlements = info?.entitlements?.active ?? {};
    const entitlement = activeEntitlements[ENTITLEMENT_ID] ?? Object.values(activeEntitlements)[0];

    const entitlementTypes = Object.values(activeEntitlements)
        .map(entry => inferSubscriptionTypeFromProduct(entry.productIdentifier || ''))
        .filter((value): value is Exclude<SubscriptionType, null> => value !== null);

    const activeSubscriptionTypes = (info?.activeSubscriptions ?? [])
        .map(inferSubscriptionTypeFromProduct)
        .filter((value): value is Exclude<SubscriptionType, null> => value !== null);

    const purchasedProducts = info?.allPurchasedProductIdentifiers ?? [];
    const hasLifetimePurchase = purchasedProducts.includes(LIFETIME_PRODUCT_ID)
        || purchasedProducts.some(id => id.toLowerCase().includes('lifetime'));

    const derivedType = pickHighestTier([
        ...entitlementTypes,
        ...activeSubscriptionTypes,
        hasLifetimePurchase ? 'lifetime' : null,
    ].filter((value): value is Exclude<SubscriptionType, null> => value !== null));

    const hasAnyActiveEntitlement = Object.keys(activeEntitlements).length > 0;
    const hasAnyActiveSubscription = activeSubscriptionTypes.length > 0;
    const hasEntitlement = hasAnyActiveEntitlement || hasAnyActiveSubscription || hasLifetimePurchase;

    if (!hasEntitlement) {
        return { hasEntitlement: false, subscriptionType: null, expiry: null };
    }

    const expiryStr = entitlement?.expirationDate ?? info?.latestExpirationDate ?? null;
    const inferredType = derivedType;

    if (!expiryStr || inferredType === 'lifetime') {
        return { hasEntitlement: true, subscriptionType: inferredType || 'lifetime', expiry: null };
    }

    const expiry = new Date(expiryStr);
    return { hasEntitlement: true, subscriptionType: inferredType, expiry };
}

function inferSubscriptionTypeFromProduct(productIdentifier: string): SubscriptionType {
    const id = productIdentifier.toLowerCase();
    if (id.includes('lifetime')) return 'lifetime';
    if (id.includes('yearly') || id.includes('annual')) return 'yearly';
    if (id.includes('monthly') || id.includes('month')) return 'monthly';
    return null;
}

function pickHighestTier(types: SubscriptionType[]): SubscriptionType {
    if (types.includes('lifetime')) return 'lifetime';
    if (types.includes('yearly')) return 'yearly';
    if (types.includes('monthly')) return 'monthly';
    return null;
}

type RevenueCatModule = NonNullable<Awaited<ReturnType<typeof getPurchases>>>;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
        })
    ]);
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
    const [adTestModeUntil, setAdTestModeUntil] = useState<number | null>(null);
    const [adTestModeRemainingMs, setAdTestModeRemainingMs] = useState(0);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const adTestTimerRef = useRef<NodeJS.Timeout | null>(null);
    const rcConfiguredRef = useRef(false);
    const syncInFlightRef = useRef<Promise<void> | null>(null);
    const actualSubscriptionRef = useRef<{ removed: boolean; type: SubscriptionType; expiry: Date | null }>({
        removed: false,
        type: null,
        expiry: null,
    });
    const AD_CLICK_THRESHOLD = 15;

    const isAdTestModeActive = useCallback((until: number | null) => {
        return typeof until === 'number' && until > Date.now();
    }, []);

    const adTestModeActive = isAdTestModeActive(adTestModeUntil);

    const updateAdTestRemaining = useCallback((until: number | null) => {
        if (!until) {
            setAdTestModeRemainingMs(0);
            return;
        }
        setAdTestModeRemainingMs(Math.max(0, until - Date.now()));
    }, []);

    // ─── Persist subscription state
    const persistSubscriptionState = useCallback(async (
        removed: boolean,
        type: SubscriptionType,
        expiry: Date | null
    ) => {
        try {
            await Preferences.set({ key: ADS_REMOVED_KEY, value: removed ? 'true' : 'false' });
            if (type) {
                await Preferences.set({ key: SUBSCRIPTION_TYPE_KEY, value: type });
            } else {
                await Preferences.remove({ key: SUBSCRIPTION_TYPE_KEY });
            }

            if (expiry) {
                await Preferences.set({ key: SUBSCRIPTION_EXPIRY_KEY, value: expiry.toISOString() });
            } else {
                await Preferences.remove({ key: SUBSCRIPTION_EXPIRY_KEY });
            }
        } catch (e) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(ADS_REMOVED_KEY, removed ? 'true' : 'false');
                if (type) {
                    localStorage.setItem(SUBSCRIPTION_TYPE_KEY, type);
                } else {
                    localStorage.removeItem(SUBSCRIPTION_TYPE_KEY);
                }

                if (expiry) {
                    localStorage.setItem(SUBSCRIPTION_EXPIRY_KEY, expiry.toISOString());
                } else {
                    localStorage.removeItem(SUBSCRIPTION_EXPIRY_KEY);
                }
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
        actualSubscriptionRef.current = { removed, type, expiry };

        const effectiveRemoved = removed && !isAdTestModeActive(adTestModeUntil);

        setAdsRemoved(effectiveRemoved);
        adsRemovedRef.current = effectiveRemoved;
        setSubscriptionStatus(effectiveRemoved ? 'active' : 'free');
        setSubscriptionType(effectiveRemoved ? type : null);
        setSubscriptionExpiry(effectiveRemoved ? expiry : null);

        await persistSubscriptionState(removed, type, expiry);

        if (isNative()) {
            (removed || adsSuppressed) ? await hideBanner() : await showBanner();
        }
    }, [persistSubscriptionState, adsSuppressed, adTestModeUntil, isAdTestModeActive]);

    const applyEffectiveStateFromActual = useCallback(async () => {
        const current = actualSubscriptionRef.current;
        const effectiveRemoved = current.removed && !isAdTestModeActive(adTestModeUntil);

        setAdsRemoved(effectiveRemoved);
        adsRemovedRef.current = effectiveRemoved;
        setSubscriptionStatus(effectiveRemoved ? 'active' : 'free');
        setSubscriptionType(effectiveRemoved ? current.type : null);
        setSubscriptionExpiry(effectiveRemoved ? current.expiry : null);

        if (isNative()) {
            (effectiveRemoved || adsSuppressed) ? await hideBanner() : await showBanner();
        }
    }, [adsSuppressed, adTestModeUntil, isAdTestModeActive]);

    const disableAdTestMode = useCallback(async () => {
        setAdTestModeUntil(null);
        updateAdTestRemaining(null);

        try {
            await Preferences.remove({ key: AD_TEST_UNTIL_KEY });
        } catch {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(AD_TEST_UNTIL_KEY);
            }
        }

        await applyEffectiveStateFromActual();
    }, [applyEffectiveStateFromActual, updateAdTestRemaining]);

    const enableAdTestMode = useCallback(async (minutes = 10) => {
        const durationMs = Math.max(1, minutes) * 60 * 1000;
        const until = Date.now() + durationMs;

        setAdTestModeUntil(until);
        updateAdTestRemaining(until);

        try {
            await Preferences.set({ key: AD_TEST_UNTIL_KEY, value: String(until) });
        } catch {
            if (typeof window !== 'undefined') {
                localStorage.setItem(AD_TEST_UNTIL_KEY, String(until));
            }
        }

        await applyEffectiveStateFromActual();
    }, [applyEffectiveStateFromActual, updateAdTestRemaining]);

    const ensureRevenueCatConfigured = useCallback(async (): Promise<RevenueCatModule | null> => {
        if (MONETIZATION_DISABLED) return null;
        if (!isNative() || !RC_API_KEY) return null;

        const rc = await withTimeout(getPurchases(), RC_TIMEOUT_MS, 'RevenueCat module load');
        if (!rc) return null;

        if (!rcConfiguredRef.current) {
            await rc.Purchases.setLogLevel({ level: rc.LOG_LEVEL.DEBUG });
            await withTimeout(rc.Purchases.configure({ apiKey: RC_API_KEY }), RC_TIMEOUT_MS, 'RevenueCat configure');
            rcConfiguredRef.current = true;
        }

        return rc;
    }, []);

    const syncFromRevenueCat = useCallback(async ({ loadOfferings = false }: { loadOfferings?: boolean } = {}) => {
        if (MONETIZATION_DISABLED) return;
        if (!isNative() || !RC_API_KEY) return;
        if (syncInFlightRef.current) {
            await syncInFlightRef.current;
            return;
        }

        const syncPromise = (async () => {
            const rc = await ensureRevenueCatConfigured();
            if (!rc) return;

            const { customerInfo } = await withTimeout(
                rc.Purchases.getCustomerInfo(),
                RC_TIMEOUT_MS,
                'RevenueCat getCustomerInfo'
            );

            console.info('[RC] customerInfo snapshot', {
                activeEntitlementKeys: Object.keys(customerInfo?.entitlements?.active ?? {}),
                activeSubscriptions: customerInfo?.activeSubscriptions ?? [],
                allPurchasedProductIdentifiers: customerInfo?.allPurchasedProductIdentifiers ?? [],
                latestExpirationDate: customerInfo?.latestExpirationDate ?? null,
            });

            const { hasEntitlement, subscriptionType: type, expiry } = getEntitlementInfo(customerInfo);
            await applySubscriptionState(hasEntitlement, type, expiry);

            if (loadOfferings) {
                const offerings = await withTimeout(
                    rc.Purchases.getOfferings(),
                    RC_TIMEOUT_MS,
                    'RevenueCat getOfferings'
                );

                if (offerings.current) {
                    setPackages(offerings.current.availablePackages);
                }
            }
        })();

        syncInFlightRef.current = syncPromise.finally(() => {
            syncInFlightRef.current = null;
        });

        await syncInFlightRef.current;
    }, [ensureRevenueCatConfigured, applySubscriptionState]);

    // ─── Refresh subscription status from RevenueCat
    const refreshSubscriptionStatus = useCallback(async () => {
        try {
            await syncFromRevenueCat().catch(e => console.warn('[RC] Sync error:', e));
        } catch (e) {
            console.warn('[RC] Failed to refresh subscription status:', e);
        }
    }, [syncFromRevenueCat]);

    // ─── Handle banner visibility changes
    useEffect(() => {
        if (!isNative() || loading) return;

        if (MONETIZATION_DISABLED) {
            hideBanner();
            setBannerVisible(false);
            return;
        }

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
                    actualSubscriptionRef.current = {
                        removed: persisted.removed,
                        type: persisted.type,
                        expiry: persisted.expiry,
                    };
                }

                // Load persisted ad test mode timer
                try {
                    const { value } = await Preferences.get({ key: AD_TEST_UNTIL_KEY });
                    if (value) {
                        const parsed = Number(value);
                        if (Number.isFinite(parsed) && parsed > Date.now()) {
                            setAdTestModeUntil(parsed);
                            updateAdTestRemaining(parsed);
                        } else {
                            await Preferences.remove({ key: AD_TEST_UNTIL_KEY });
                        }
                    }
                } catch {
                    if (typeof window !== 'undefined') {
                        const saved = localStorage.getItem(AD_TEST_UNTIL_KEY);
                        const parsed = saved ? Number(saved) : NaN;
                        if (Number.isFinite(parsed) && parsed > Date.now()) {
                            setAdTestModeUntil(parsed);
                            updateAdTestRemaining(parsed);
                        } else {
                            localStorage.removeItem(AD_TEST_UNTIL_KEY);
                        }
                    }
                }

                if (MONETIZATION_DISABLED) {
                    setPackages([]);
                    setSubscriptionStatus('free');
                    await applySubscriptionState(false, null, null);
                } else {
                    // Initialize AdMob
                    await initializeAdMob().catch(e => console.warn('[AdMob] Init error:', e));

                    if (isNative() && RC_API_KEY && !cancelled) {
                        try {
                            await syncFromRevenueCat({ loadOfferings: true });

                            // Set up periodic refresh
                            if (!cancelled) {
                                refreshIntervalRef.current = setInterval(() => {
                                    refreshSubscriptionStatus();
                                }, REFRESH_INTERVAL);
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
    }, [updateAdTestRemaining, syncFromRevenueCat]);

    // Re-check subscription whenever app returns to foreground.
    useEffect(() => {
        if (MONETIZATION_DISABLED) return;
        if (!isNative() || !RC_API_KEY) return;

        let listener: { remove: () => Promise<void> } | null = null;

        async function wireAppStateListener() {
            try {
                // Check if App plugin is actually available before adding listener
                const { App } = await import('@capacitor/app');
                if (App && typeof App.addListener === 'function') {
                    listener = await App.addListener('appStateChange', ({ isActive }) => {
                        if (isActive) {
                            updateAdTestRemaining(adTestModeUntil);
                            if (adTestModeUntil && adTestModeUntil <= Date.now()) {
                                disableAdTestMode();
                            }
                            refreshSubscriptionStatus();
                        }
                    });
                }
            } catch (e) {
                console.warn('[RC] Failed to register app state listener:', e);
            }
        }

        wireAppStateListener();

        return () => {
            if (listener) {
                listener.remove();
                listener = null;
            }
        };
    }, [refreshSubscriptionStatus, adTestModeUntil, disableAdTestMode, updateAdTestRemaining]);

    useEffect(() => {
        if (adTestTimerRef.current) {
            clearInterval(adTestTimerRef.current);
            adTestTimerRef.current = null;
        }

        if (!adTestModeUntil) {
            setAdTestModeRemainingMs(0);
            return;
        }

        updateAdTestRemaining(adTestModeUntil);

        adTestTimerRef.current = setInterval(() => {
            if (adTestModeUntil <= Date.now()) {
                disableAdTestMode();
                return;
            }
            updateAdTestRemaining(adTestModeUntil);
        }, 1000);

        return () => {
            if (adTestTimerRef.current) {
                clearInterval(adTestTimerRef.current);
                adTestTimerRef.current = null;
            }
        };
    }, [adTestModeUntil, disableAdTestMode, updateAdTestRemaining]);

    // ─── Purchase Package
    const purchasePackage = useCallback(async (pkg: any) => {
        if (MONETIZATION_DISABLED) {
            showNotification({
                title: 'Purchases Disabled',
                message: 'Purchases are temporarily disabled in this build.',
                type: 'info'
            });
            return;
        }

        if (!isNative()) {
            showNotification({
                title: 'Native App Required',
                message: 'Subscriptions are only available in the Android app. Download it from Google Play!',
                type: 'info'
            });
            return;
        }

        try {
            const rc = await ensureRevenueCatConfigured();
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

                refreshSubscriptionStatus();
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
    }, [applySubscriptionState, ensureRevenueCatConfigured, refreshSubscriptionStatus, showNotification]);

    // ─── Purchase Product by ID
    const purchaseProduct = useCallback(async (productIdentifier: string) => {
        if (MONETIZATION_DISABLED) {
            showNotification({
                title: 'Purchases Disabled',
                message: 'Purchases are temporarily disabled in this build.',
                type: 'info'
            });
            return;
        }

        if (!isNative()) {
            showNotification({
                title: 'Native App Required',
                message: 'Subscriptions are only available in the Android app. Download it from Google Play!',
                type: 'info'
            });
            return;
        }

        try {
            const rc = await ensureRevenueCatConfigured();
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

                refreshSubscriptionStatus();
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
    }, [packages, applySubscriptionState, ensureRevenueCatConfigured, refreshSubscriptionStatus, showNotification]);

    // ─── Restore Purchases
    const restorePurchases = useCallback(async () => {
        if (MONETIZATION_DISABLED) {
            showNotification({
                title: 'Restore Disabled',
                message: 'Restore purchases is temporarily disabled in this build.',
                type: 'info'
            });
            return;
        }

        if (!isNative()) {
            showNotification({
                title: 'Native App Required',
                message: 'Restore Purchases is only available in the Android app.',
                type: 'info'
            });
            return;
        }

        try {
            const rc = await ensureRevenueCatConfigured();
            if (!rc) throw new Error('RC unavailable');

            await withTimeout(
                rc.Purchases.restorePurchases(),
                RC_TIMEOUT_MS,
                'RevenueCat restorePurchases'
            );

            const { customerInfo } = await withTimeout(
                rc.Purchases.getCustomerInfo(),
                RC_TIMEOUT_MS,
                'RevenueCat getCustomerInfo after restore'
            );

            console.info('[RC] restore snapshot', {
                activeEntitlementKeys: Object.keys(customerInfo?.entitlements?.active ?? {}),
                activeSubscriptions: customerInfo?.activeSubscriptions ?? [],
                allPurchasedProductIdentifiers: customerInfo?.allPurchasedProductIdentifiers ?? [],
                latestExpirationDate: customerInfo?.latestExpirationDate ?? null,
            });

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
    }, [applySubscriptionState, ensureRevenueCatConfigured, showNotification]);

    // ─── Record Click
    const recordClick = useCallback(() => {
        if (MONETIZATION_DISABLED) return;
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
        if (MONETIZATION_DISABLED) return;

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
            recordClick,
            adTestModeActive,
            adTestModeRemainingMs,
            enableAdTestMode,
            disableAdTestMode,
        }}>
            {children}
        </AdContext.Provider>
    );
}
