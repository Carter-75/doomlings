'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Preferences } from '@capacitor/preferences';
import { useAds } from '@/lib/ad-context';
import { useTheme } from '@/lib/theme-context';
import { Capacitor } from '@capacitor/core';
import DeveloperSettings from '@/components/DeveloperSettings';
import Modal from '@/components/Modal';
import AnimatedButton from '@/components/AnimatedButton';

const SettingsPage = () => {
    const router = useRouter();
    const { adsRemoved, packages, purchasePackage, restorePurchases, loading: adsLoading } = useAds();
    const { theme, setTheme, cardArtPreference, setCardArtPreference } = useTheme();
    const isNativeApp = typeof window !== 'undefined' && Capacitor.isNativePlatform();

    // UI States
    const [scale, setScale] = useState(100);
    const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; type?: 'info' | 'warning' | 'error' | 'success'; onConfirm?: () => void } | null>(null);

    // Game Files State
    const [fileName, setFileName] = useState('');
    const [savedFiles, setSavedFiles] = useState<string[]>([]);

    // Preferences
    const [showScrollToTop, setShowScrollToTop] = useState(true);
    const [warnUnpocketedTrinkets, setWarnUnpocketedTrinkets] = useState(true);
    const [enableAnimations, setEnableAnimations] = useState(true);
    const [showTooltips, setShowTooltips] = useState(true);
    const [developerMode, setDeveloperMode] = useState(false);

    useEffect(() => {
        const loadPrefs = async () => {
            const savedScaling = localStorage.getItem('uiScaling');
            if (savedScaling) setScale(parseInt(savedScaling, 10));

            setShowScrollToTop(localStorage.getItem('showScrollToTop') !== 'false');
            setWarnUnpocketedTrinkets(localStorage.getItem('warnUnpocketedTrinkets') !== 'false');
            setEnableAnimations(localStorage.getItem('enableAnimations') !== 'false');
            setShowTooltips(localStorage.getItem('showTooltips') !== 'false');
            setDeveloperMode(localStorage.getItem('developerMode') === 'true');

            fetchSavedFiles();
        };
        loadPrefs();
    }, []);

    const fetchSavedFiles = async () => {
        try {
            const { keys } = await Preferences.keys();
            const gameFiles = keys.filter(key => key.startsWith('gameState_'));
            setSavedFiles(gameFiles.map(key => key.replace('gameState_', '')));
        } catch (e) {
            console.error('Error fetching saved files:', e);
        }
    };

    const applyScale = () => {
        const scaleValue = scale / 100;
        document.documentElement.style.setProperty('--ui-scale', scaleValue.toString());
        localStorage.setItem('uiScaling', scale.toString());
        setModal({
            isOpen: true,
            title: 'Scale Applied',
            message: `UI scale set to ${scale}%`,
            type: 'info'
        });
    };


    const handleDeleteGame = (file: string) => {
        setModal({
            isOpen: true,
            title: 'Delete Save?',
            message: `Are you sure you want to delete "${file}"?`,
            type: 'warning',
            onConfirm: async () => {
                await Preferences.remove({ key: `gameState_${file}` });
                fetchSavedFiles();
                setModal(null);
            }
        });
    };

    const handleResetAll = () => {
        setModal({
            isOpen: true,
            title: 'RESET ALL DATA?',
            message: 'This will wipe all game progress, settings, and themes. This cannot be undone.',
            type: 'error',
            onConfirm: async () => {
                const tutorialSeen = localStorage.getItem('doomlingsTutorialSeen');
                const generatedCardsCache = localStorage.getItem('developer_generated_cards');
                localStorage.clear();
                if (tutorialSeen) localStorage.setItem('doomlingsTutorialSeen', tutorialSeen);
                if (generatedCardsCache) localStorage.setItem('developer_generated_cards', generatedCardsCache);
                // Use router.push to home instead of hard reload to preserve router context
                router.push('/');
            }
        });
    };

    return (
        <div className="settings-page min-h-screen p-4 pb-20 max-w-4xl mx-auto">
            <header className="mb-8 text-center pt-8">
                <h1 className="title is-1 has-text-weight-bold">Settings</h1>
            </header>

            {/* Premium Section */}
            <section className="settings-section box bg-glass p-6 mb-6">
                <div className="is-flex is-justify-content-between is-align-items-start mb-4">
                    <h2 className="title is-4 text-warning mb-0">✨ Premium Status</h2>
                    {adsRemoved ? (
                        <div className="tag is-success is-light is-medium">Active</div>
                    ) : (
                        <div className="tag is-dark is-medium">Free Tier</div>
                    )}
                </div>

                <div className="card bg-black/20 p-5 rounded-lg border border-white/5 mb-6 text-center">
                    {adsRemoved ? (
                        <>
                            <div className="is-size-3 mb-2">💎</div>
                            <h3 className="has-text-weight-bold is-size-5 mb-1">Companion Pro Unlocked</h3>
                            <p className="text-muted is-size-7 mb-4">Thank you for supporting DOOMlings! You have full access to all features and no ads.</p>
                            {isNativeApp && (
                                <Link
                                    href="https://play.google.com/store/account/subscriptions"
                                    target="_blank"
                                    className="button is-small is-ghost"
                                >
                                    Manage Subscription
                                </Link>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="is-size-3 mb-2">🔔</div>
                            <h3 className="has-text-weight-bold is-size-5 mb-1">Standard Access</h3>
                            <p className="text-muted is-size-7 mb-4">Support the app and remove all advertisements by upgrading to Companion Pro.</p>
                            <Link href="/premium" className="button is-primary is-small">Explore Premium</Link>
                        </>
                    )}
                </div>
                
                {!adsRemoved && isNativeApp && (
                    <div className="columns is-multiline">
                        {packages.map((pkg: any) => (
                            <div key={pkg.identifier} className="column is-4">
                                <div className="card bg-black/20 p-4 rounded-lg text-center border border-white/5 h-full is-flex is-flex-direction-column">
                                    <h3 className="has-text-weight-bold mb-2">{pkg.product.title}</h3>
                                    <p className="is-size-7 mb-4 flex-grow">{pkg.product.description}</p>
                                    <div className="title is-5 mb-4">{pkg.product.priceString}</div>
                                    <AnimatedButton className="is-primary is-small" onClick={() => purchasePackage(pkg)}>Buy</AnimatedButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 flex gap-4 is-justify-content-center">
                    <AnimatedButton className="is-light is-small" onClick={restorePurchases}>🔄 Restore Purchases</AnimatedButton>
                </div>
            </section>

            {/* UI Customization */}
            <section className="settings-section box bg-glass p-6 mb-6">
                <h2 className="title is-4 text-primary">🎨 Personalization</h2>
                
                <div className="field mb-6">
                    <label className="label">UI Scale: {scale}%</label>
                    <div className="control is-flex is-align-items-center gap-4">
                        <input type="range" min="50" max="125" value={scale} onChange={e => setScale(parseInt(e.target.value))} className="slider is-fullwidth" />
                        <AnimatedButton className="is-small is-info" onClick={applyScale}>Apply</AnimatedButton>
                    </div>
                </div>

                <div className="theme-selector mb-10">
                    <label className="label mb-4" style={{ color: 'var(--primary-orange)', fontWeight: 700 }}>Color Theme</label>
                    <div 
                        className="grid gap-3" 
                        style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            width: '100%'
                        }}
                    >
                        {[
                            { id: 'default', name: 'Classic Royale', colors: ['#e63946', '#fca311'] },
                            { id: 'ocean', name: 'Ocean', colors: ['#0284c7', '#38bdf8'] },
                            { id: 'forest', name: 'Forest', colors: ['#166534', '#4ade80'] },
                            { id: 'purple', name: 'Purple', colors: ['#7209b7', '#b5179e'] },
                            { id: 'midnight', name: 'Midnight', colors: ['#1e1b4b', '#6366f1'] },
                            { id: 'sunset', name: 'Sunset', colors: ['#be123c', '#fbbf24'] },
                            { id: 'cyberpunk', name: 'Cyber', colors: ['#f0abfc', '#2dd4bf'] },
                            { id: 'gold', name: 'Gold', colors: ['#854d0e', '#fde047'] },
                            { id: 'mint', name: 'Mint', colors: ['#0f766e', '#6ee7b7'] },
                            { id: 'monochrome', name: 'Mono', colors: ['#52525b', '#d4d4d8'] },
                        ].map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setTheme(t.id)}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center relative overflow-hidden theme-hover-glow ${theme === t.id ? 'selected-ring' : 'border-white/10'}`}
                                style={{ 
                                    minHeight: '60px',
                                    background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`,
                                }}
                            >
                                <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                                <div className="text-xs font-black uppercase tracking-widest mix-blend-overlay text-white drop-shadow-md select-none z-10">{t.name}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card-art-selector mb-10">
                    <label className="label mb-4" style={{ color: 'var(--primary-orange)', fontWeight: 700 }}>Card Art Style</label>
                    <div className="flex flex-wrap gap-4 justify-center mb-6">
                        {[
                            { id: 'ai', icon: '✨', label: 'AI Art' },
                            { id: 'official', icon: '🎨', label: 'Official Art' },
                            { id: 'none', icon: '🚫', label: 'No Image' },
                        ].map(style => (
                            <button 
                                key={style.id}
                                className={`p-3 px-6 rounded-xl transition-all border flex items-center gap-3 theme-hover-glow ${cardArtPreference === style.id ? 'selected-ring' : 'muted-btn'}`}
                                onClick={() => setCardArtPreference(style.id as any)}
                            >
                                <span className="text-xl">{style.icon}</span> <span className="text-xs font-bold">{style.label}</span>
                            </button>
                        ))}
                    </div>
                    <p className="is-size-7 text-muted mt-2">
                        {cardArtPreference === 'ai' 
                            ? "Shows the premium set of custom AI-generated art for each card type." 
                            : cardArtPreference === 'official'
                            ? "Uses original Doomlings art. Shows a simple '?' if an image is missing."
                            : "Hides all card images for a clean, distraction-free experience."}
                    </p>
                </div>
            </section>

            {/* Game Saves */}
            <section className="settings-section box bg-glass p-6 mb-6">
                <h2 className="title is-4 text-primary">💾 Saved Games</h2>
                <div className="field has-addons mb-6">
                    <div className="control is-expanded">
                        <input className="input" type="text" placeholder="New save name..." value={fileName} onChange={e => setFileName(e.target.value)} />
                    </div>
                    <div className="control">
                        <AnimatedButton className="is-primary" onClick={async () => {
                            const state = localStorage.getItem('gameState');
                            if (state && fileName) {
                                await Preferences.set({ key: `gameState_${fileName}`, value: state });
                                fetchSavedFiles();
                                setFileName('');
                            }
                        }}>Save Current</AnimatedButton>
                    </div>
                </div>

                <div className="saves-list space-y-2">
                    {savedFiles.map(file => (
                        <div key={file} className="is-flex is-justify-content-between is-align-items-center p-3 bg-black/20 rounded border border-white/5">
                            <span className="has-text-weight-medium">{file}</span>
                            <div className="buttons are-small mb-0">
                                <AnimatedButton className="is-success" onClick={async () => {
                                    const { value } = await Preferences.get({ key: `gameState_${file}` });
                                    if (value) {
                                        localStorage.setItem('gameState', value);
                                        setModal({ isOpen: true, title: 'Loaded', message: `Game "${file}" loaded.`, type: 'success' });
                                    }
                                }}>Load</AnimatedButton>
                                <AnimatedButton className="is-danger is-light" onClick={() => handleDeleteGame(file)}>Delete</AnimatedButton>
                            </div>
                        </div>
                    ))}
                    {savedFiles.length === 0 && <p className="text-muted text-center py-4">No saved games found.</p>}
                </div>
            </section>

            {/* General Preferences */}
            <section className="settings-section box bg-glass p-6 mb-6">
                <h2 className="title is-4 text-primary">⚙️ Preferences</h2>
                <div className="space-y-4">
                    {[
                        { id: 'showScrollToTop', label: 'Scroll to Top Button', value: showScrollToTop, set: setShowScrollToTop, note: 'Floating button for long pages' },
                        { id: 'warnUnpocketedTrinkets', label: 'Trinket Warnings', value: warnUnpocketedTrinkets, set: setWarnUnpocketedTrinkets, note: 'Alert if trinkets are left unpocketed' },
                        { id: 'enableAnimations', label: 'Enable Animations', value: enableAnimations, set: setEnableAnimations, note: 'Smooth transitions and effects' },
                        { id: 'developerMode', label: 'Developer Mode', value: developerMode, set: setDeveloperMode, note: 'Advanced debugging information' },
                    ].map(pref => (
                        <div key={pref.id} className="is-flex is-align-items-center is-justify-content-between p-4 rounded bg-black/10 border border-white/5">
                            <div>
                                <div className="has-text-weight-bold">{pref.label}</div>
                                <div className="is-size-7 text-muted">{pref.note}</div>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={pref.value} 
                                    onChange={e => {
                                        pref.set(e.target.checked);
                                        localStorage.setItem(pref.id, String(e.target.checked));
                                    }} 
                                />
                                <span className="slider-round"></span>
                            </label>
                        </div>
                    ))}
                </div>
            </section>

            {/* Developer Tools */}
            {developerMode && (
                <section className="settings-section box bg-glass p-6 mb-6 border-primary/30">
                    <h2 className="title is-4 text-primary">🛠 Developer Tools</h2>
                    <p className="is-size-7 text-muted mb-4">
                        Scan or upload card images, convert them to JSON with OpenAI, store pending cards locally, and export batches to GitHub.
                    </p>
                    <DeveloperSettings onCancel={() => {
                        setDeveloperMode(false);
                        localStorage.setItem('developerMode', 'false');
                    }} />
                </section>
            )}

            {/* Danger Zone */}
            <section className="settings-section box bg-glass p-6 mb-6 border-error/30 bg-error/5">
                <h2 className="title is-4 text-error">⚠️ Danger Zone</h2>
                <p className="is-size-7 mb-4 text-error/70">Careful! These actions are permanent.</p>
                <AnimatedButton className="is-danger is-fullwidth" onClick={handleResetAll}>🔥 Reset All App Data</AnimatedButton>
            </section>

            <footer className="footer-simple mt-12 py-8 text-center border-t border-white/10">
                <Link href="/" className="text-muted hover:text-white transition-colors">🏠 Back to Home</Link>
                <div className="mt-4 is-size-7 text-muted">Version 2.2.0 • Build 2024.10</div>
            </footer>

            {/* Modal system */}
            {modal && (
                <Modal
                    isOpen={modal.isOpen}
                    onClose={() => setModal(null)}
                    title={modal.title}
                    type={modal.type}
                    actions={
                        modal.onConfirm ? (
                          <>
                            <AnimatedButton onClick={() => setModal(null)} className="is-light">Cancel</AnimatedButton>
                            <AnimatedButton onClick={modal.onConfirm} className={`is-${modal.type || 'primary'}`}>Confirm</AnimatedButton>
                          </>
                        ) : null
                    }
                >
                    <p>{modal.message}</p>
                </Modal>
            )}

            <style jsx>{`
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 48px;
                    height: 24px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider-round {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: rgba(255,255,255,0.1);
                    transition: .4s;
                    border-radius: 24px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .slider-round:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 2px;
                    bottom: 2px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider-round {
                    background-color: var(--primary-orange);
                    box-shadow: 0 0 15px rgba(252, 163, 17, 0.4);
                }
                input:checked + .slider-round:before {
                    transform: translateX(24px);
                }
                .theme-swatch-btn:hover {
                    transform: translateY(-2px);
                    background: rgba(255,255,255,0.05) !important;
                }
                .theme-swatch-btn.active {
                    background: rgba(252, 163, 17, 0.1) !important;
                    box-shadow: 0 0 15px rgba(252, 163, 17, 0.15);
                }
            `}</style>
        </div>
    );
};

export default SettingsPage;