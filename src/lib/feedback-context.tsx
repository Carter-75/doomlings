'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Preferences } from '@capacitor/preferences';

const FEEDBACK_MODE_KEY = 'feedbackMode';

export type FeedbackMode = 'immersive' | 'audio-only' | 'haptics-only' | 'quiet';
export type FeedbackEvent = 'click' | 'age-advance' | 'catastrophe' | 'dominant-roll';

const FEEDBACK_SOUND_FILES: Record<FeedbackEvent, string[]> = {
    click: [
        '/assets/sfx/click.wav',
        '/assets/sfx/click-soft.wav',
        '/assets/sfx/click-bright.wav',
        '/assets/sfx/click-deep.wav',
    ],
    'age-advance': [
        '/assets/sfx/age-advance.wav',
        '/assets/sfx/age-advance-warm.wav',
        '/assets/sfx/age-advance-shimmer.wav',
        '/assets/sfx/age-advance-heroic.wav',
    ],
    catastrophe: [
        '/assets/sfx/catastrophe.wav',
        '/assets/sfx/catastrophe-pulse.wav',
        '/assets/sfx/catastrophe-rumble.wav',
        '/assets/sfx/catastrophe-alarm.wav',
    ],
    'dominant-roll': [
        '/assets/sfx/dominant-roll.wav',
        '/assets/sfx/dominant-roll-spark.wav',
        '/assets/sfx/dominant-roll-heavy.wav',
        '/assets/sfx/dominant-roll-arcane.wav',
    ],
};

const FEEDBACK_SOUND_VOLUME: Record<FeedbackEvent, number> = {
    click: 0.12,
    'age-advance': 0.6,
    catastrophe: 0.6,
    'dominant-roll': 0.6,
};

interface FeedbackContextValue {
    mode: FeedbackMode;
    setMode: (mode: FeedbackMode) => Promise<void>;
    playFeedback: (event: FeedbackEvent) => void;
}

const FeedbackContext = createContext<FeedbackContextValue>({
    mode: 'immersive',
    setMode: async () => { },
    playFeedback: () => { },
});

export function useFeedback() {
    return useContext(FeedbackContext);
}

function canPlaySound(mode: FeedbackMode) {
    return mode === 'immersive' || mode === 'audio-only';
}

function canPlayHaptics(mode: FeedbackMode) {
    return mode === 'immersive' || mode === 'haptics-only';
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<FeedbackMode>('immersive');
    const [mounted, setMounted] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());
    const lastVariantRef = useRef<Partial<Record<FeedbackEvent, string>>>({});
    const lastClickTsRef = useRef(0);

    const initAudio = useCallback(() => {
        if (typeof window === 'undefined' || audioReady) return;

        const map = new Map<string, HTMLAudioElement>();
        (Object.keys(FEEDBACK_SOUND_FILES) as FeedbackEvent[]).forEach((event) => {
            FEEDBACK_SOUND_FILES[event].forEach((soundFile) => {
                const audio = new Audio(soundFile);
                audio.preload = 'auto';
                map.set(soundFile, audio);
            });
        });

        audioMapRef.current = map;
        setAudioReady(true);
    }, [audioReady]);

    const playSound = useCallback((event: FeedbackEvent) => {
        if (!audioReady) {
            initAudio();
        }

        const options = FEEDBACK_SOUND_FILES[event];
        const previous = lastVariantRef.current[event];
        const candidates = options.length > 1 ? options.filter((option) => option !== previous) : options;
        const soundFile = candidates[Math.floor(Math.random() * candidates.length)];
        lastVariantRef.current[event] = soundFile;

        const source = audioMapRef.current.get(soundFile);
        if (!source) return;

        try {
            const sound = source.cloneNode(true) as HTMLAudioElement;
            sound.volume = FEEDBACK_SOUND_VOLUME[event];
            sound.play().catch(() => { });
        } catch {
            // No-op: avoid throwing from UI interactions on restrictive platforms.
        }
    }, [audioReady, initAudio]);

    const playHaptic = useCallback((pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(pattern);
        }
    }, []);

    const playFeedback = useCallback((event: FeedbackEvent) => {
        if (!mounted) return;

        if (canPlaySound(mode)) {
            playSound(event);
        }

        if (canPlayHaptics(mode)) {
            switch (event) {
                case 'click':
                    playHaptic(8);
                    break;
                case 'age-advance':
                    playHaptic([16, 22, 20]);
                    break;
                case 'catastrophe':
                    playHaptic([45, 40, 55]);
                    break;
                case 'dominant-roll':
                    playHaptic([10, 25, 10, 25, 14]);
                    break;
            }
        }
    }, [mounted, mode, playHaptic, playSound]);

    useEffect(() => {
        const loadMode = async () => {
            try {
                const { value } = await Preferences.get({ key: FEEDBACK_MODE_KEY });
                if (value === 'immersive' || value === 'audio-only' || value === 'haptics-only' || value === 'quiet') {
                    setModeState(value);
                } else {
                    await Preferences.set({ key: FEEDBACK_MODE_KEY, value: 'immersive' });
                    setModeState('immersive');
                }
            } catch {
                const stored = typeof window !== 'undefined' ? localStorage.getItem(FEEDBACK_MODE_KEY) : null;
                if (stored === 'immersive' || stored === 'audio-only' || stored === 'haptics-only' || stored === 'quiet') {
                    setModeState(stored);
                } else if (typeof window !== 'undefined') {
                    localStorage.setItem(FEEDBACK_MODE_KEY, 'immersive');
                    setModeState('immersive');
                }
            } finally {
                setMounted(true);
            }
        };

        loadMode();
    }, []);

    const setMode = useCallback(async (nextMode: FeedbackMode) => {
        setModeState(nextMode);
        try {
            await Preferences.set({ key: FEEDBACK_MODE_KEY, value: nextMode });
        } catch {
            if (typeof window !== 'undefined') {
                localStorage.setItem(FEEDBACK_MODE_KEY, nextMode);
            }
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const onGlobalClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const interactive = target.closest('button, a, [role="button"], input, select, summary, label');
            if (!interactive) return;

            const now = Date.now();
            if (now - lastClickTsRef.current < 45) return;
            lastClickTsRef.current = now;

            initAudio();

            playFeedback('click');
        };

        document.addEventListener('click', onGlobalClick, { capture: true });
        return () => {
            document.removeEventListener('click', onGlobalClick, { capture: true });
        };
    }, [mounted, playFeedback, initAudio]);

    return (
        <FeedbackContext.Provider value={{ mode, setMode, playFeedback }}>
            {children}
        </FeedbackContext.Provider>
    );
}
