'use client';

/**
 * admob-service.ts
 * Wraps @capacitor-community/admob for banner and interstitial ads.
 * Only runs on native Android (no-ops gracefully in browser/web).
 */

import { Capacitor } from '@capacitor/core';
import { MONETIZATION_DISABLED } from './monetization-config';

// Dynamically imported so Next.js doesn't try to resolve during SSR
let AdMob: typeof import('@capacitor-community/admob').AdMob | null = null;
let BannerAdSize: typeof import('@capacitor-community/admob').BannerAdSize | null = null;
let BannerAdPosition: typeof import('@capacitor-community/admob').BannerAdPosition | null = null;
let AdMobRewardItem: unknown = null;

let initialized = false;
let interstitialCooldown = false;

const BANNER_ID = process.env.NEXT_PUBLIC_ADMOB_BANNER_ID ?? 'ca-app-pub-3940256099942544/6300978111';
const INTERSTITIAL_ID = process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID ?? 'ca-app-pub-3940256099942544/1033173712';

export const isNative = () => Capacitor.isNativePlatform();

async function loadAdMob() {
    if (MONETIZATION_DISABLED || !isNative()) return false;
    if (AdMob) return true;
    try {
        const mod = await import('@capacitor-community/admob');
        AdMob = mod.AdMob;
        BannerAdSize = mod.BannerAdSize;
        BannerAdPosition = mod.BannerAdPosition;
        return true;
    } catch {
        return false;
    }
}

export async function initializeAdMob(): Promise<void> {
    if (initialized || !isNative()) return;
    const ok = await loadAdMob();
    if (!ok || !AdMob) return;

    try {
        // Race initialization against a 3-second timeout to prevent startup hangs
        await Promise.race([
            AdMob.initialize({
                requestTrackingAuthorization: false,
            } as any),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AdMob init timeout')), 3000))
        ]);
        initialized = true;
    } catch (e) {
        console.warn('[AdMob] Initialization failed or timed out:', e);
        // We still mark as initialized to prevent repeated attempts that might also hang
        initialized = true; 
    }
}

export async function showBanner(): Promise<void> {
    const ok = await loadAdMob();
    if (!ok || !AdMob || !BannerAdSize || !BannerAdPosition) return;

    await AdMob.showBanner({
        adId: BANNER_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: process.env.NODE_ENV !== 'production',
    });
}

export async function hideBanner(): Promise<void> {
    const ok = await loadAdMob();
    if (!ok || !AdMob) return;
    try {
        await AdMob.removeBanner();
    } catch {
        // banner may not be showing
    }
}

export async function showInterstitial(): Promise<void> {
    if (interstitialCooldown) return;
    const ok = await loadAdMob();
    if (!ok || !AdMob) return;

    try {
        interstitialCooldown = true;
        // Release cooldown after 3 minutes
        setTimeout(() => { interstitialCooldown = false; }, 3 * 60 * 1000);

        await AdMob.prepareInterstitial({
            adId: INTERSTITIAL_ID,
            isTesting: INTERSTITIAL_ID.includes('3940256099942544'),
        });
        await AdMob.showInterstitial();
    } catch (e) {
        console.warn('[AdMob] Interstitial failed:', e);
        interstitialCooldown = false;
    }
}
