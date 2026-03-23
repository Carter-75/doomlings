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
            try {
                const { value: appTheme } = await Preferences.get({ key: 'appTheme' });
                if (appTheme) {
                    setThemeState(appTheme);
                    document.documentElement.setAttribute('data-theme', appTheme);
                }

                const { value: artPref } = await Preferences.get({ key: 'cardArtPreference' });
                if (artPref === 'ai' || artPref === 'official' || artPref === 'none') {
                    setCardArtPreferenceState(artPref);
                } else if (artPref === 'custom') {
                    // Migrate old 'custom' to 'ai'
                    setCardArtPreferenceState('ai');
                    await Preferences.set({ key: 'cardArtPreference', value: 'ai' });
                }
            } catch (error) {
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
            }
            setMounted(true);
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

    // Prevent hydration mismatch by not rendering until theme is loaded
    if (!mounted) {
        return <div style={{ visibility: 'hidden' }}>{children}</div>;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, cardArtPreference, setCardArtPreference }}>
            {children}
        </ThemeContext.Provider>
    );
}
