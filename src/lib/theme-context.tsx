'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Preferences } from '@capacitor/preferences';

type ThemeContextType = {
    theme: string;
    setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: 'default',
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState('default');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load saved theme on initial mount
        const loadTheme = async () => {
            try {
                const { value } = await Preferences.get({ key: 'appTheme' });
                if (value) {
                    setThemeState(value);
                    document.documentElement.setAttribute('data-theme', value);
                }
            } catch (error) {
                // Fallback for web
                const saved = localStorage.getItem('appTheme');
                if (saved) {
                    setThemeState(saved);
                    document.documentElement.setAttribute('data-theme', saved);
                }
            }
            setMounted(true);
        };
        loadTheme();
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

    // Prevent hydration mismatch by not rendering until theme is loaded
    if (!mounted) {
        return <div style={{ visibility: 'hidden' }}>{children}</div>;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
