'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Preferences } from '@capacitor/preferences';

type ThemeContextType = {
    theme: string;
    setTheme: (theme: string) => void;
    cardArtPreference: 'ai' | 'official' | 'none';
    setCardArtPreference: (pref: 'ai' | 'official' | 'none') => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: 'default',
    setTheme: () => { },
    cardArtPreference: 'ai',
    setCardArtPreference: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState('default');
    const [cardArtPreference, setCardArtPreferenceState] = useState<'ai' | 'official' | 'none'>('ai');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load saved theme and card art preference
        const loadSettings = async () => {
            const timeoutPromise = new Promise(resolve => setTimeout(resolve, 1500));
            
            try {
                // Race the native settings loading against a 1.5s timeout
                await Promise.race([
                    (async () => {
                        const { value: appTheme } = await Preferences.get({ key: 'appTheme' }).catch(() => ({ value: null }));
                        if (appTheme) {
                            setThemeState(appTheme);
                            document.documentElement.setAttribute('data-theme', appTheme);
                        }

                        const { value: artPref } = await Preferences.get({ key: 'cardArtPreference' }).catch(() => ({ value: null }));
                        if (artPref === 'ai' || artPref === 'official' || artPref === 'none') {
                            setCardArtPreferenceState(artPref);
                        } else if (artPref === 'custom') {
                            setCardArtPreferenceState('ai');
                            await Preferences.set({ key: 'cardArtPreference', value: 'ai' }).catch(() => {});
                        }
                    })(),
                    timeoutPromise
                ]);
            } catch (error) {
                console.warn('[Theme] Native settings error, falling back to local storage:', error);
                // Fallback for web
                const savedTheme = localStorage.getItem('appTheme');
                if (savedTheme) {
                    setThemeState(savedTheme);
                    document.documentElement.setAttribute('data-theme', savedTheme);
                }

                const savedArtPref = localStorage.getItem('cardArtPreference');
                if (savedArtPref === 'ai' || savedArtPref === 'official' || savedArtPref === 'none') {
                    setCardArtPreferenceState(savedArtPref as 'ai' | 'official' | 'none');
                } else if (savedArtPref === 'custom') {
                    setCardArtPreferenceState('ai');
                    localStorage.setItem('cardArtPreference', 'ai');
                }
            } finally {
                setMounted(true);
            }
        };
        loadSettings();
    }, []);

    const setTheme = async (newTheme: string) => {
        setThemeState(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
            await Preferences.set({ key: 'appTheme', value: newTheme });
        } catch {
            localStorage.setItem('appTheme', newTheme);
        }
    };

    const setCardArtPreference = async (pref: 'ai' | 'official' | 'none') => {
        setCardArtPreferenceState(pref);
        try {
            await Preferences.set({ key: 'cardArtPreference', value: pref });
        } catch {
            localStorage.setItem('cardArtPreference', pref);
        }
    };

    // We no longer block rendering with visibility: hidden. 
    // Next.js will hydrate the UI naturally. 
    // 'mounted' can still be used for client-only UI if needed.

    return (
        <ThemeContext.Provider value={{ theme, setTheme, cardArtPreference, setCardArtPreference }}>
            {children}
        </ThemeContext.Provider>
    );
}
