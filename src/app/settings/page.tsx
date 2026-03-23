'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Preferences } from '@capacitor/preferences';
import { useAds } from '@/lib/ad-context';
import { useTheme } from '@/lib/theme-context';
import { Capacitor } from '@capacitor/core';
import DeveloperSettings from '@/components/DeveloperSettings';
import Modal from '@/components/Modal';
import AnimatedButton from '@/components/AnimatedButton';

const SettingsPage = () => {
    const { adsRemoved, packages, purchasePackage, restorePurchases, loading: adsLoading } = useAds();
    const { theme, setTheme } = useTheme();
    const isNativeApp = typeof window !== 'undefined' && Capacitor.isNativePlatform();

    // UI States
    const [scale, setScale] = useState(100);
    const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; type?: 'info' | 'warning' | 'error' | 'success'; onConfirm?: () => void } | null>(null);

    // JSON Editor State
    const [jsonFiles, setJsonFiles] = useState<string[]>([]);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState('');

    // Game Files State
    const [fileName, setFileName] = useState('');
    const [savedFiles, setSavedFiles] = useState<string[]>([]);
    const [message, setMessage] = useState('');

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

            fetchJsonFiles();
            fetchSavedFiles();
        };
        loadPrefs();
    }, []);

    const fetchJsonFiles = async () => {
        try {
            const response = await fetch('/api/list-files');
            if (response.ok) {
                const data = await response.json();
                setJsonFiles(data);
            }
        } catch (e) {
            console.warn('API routes not available in this environment');
        }
    };

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
            type: 'success'
        });
    };

    const handleSave = async (f: string) => {
        try {
            const response = await fetch('/api/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: f, content: fileContent }),
            });
            if (response.ok) {
                setModal({ isOpen: true, title: 'Saved', message: 'File saved successfully!', type: 'success' });
                setEditingFile(null);
            } else {
                throw new Error('Failed to save');
            }
        } catch (e: any) {
            setModal({ isOpen: true, title: 'Error', message: e.message, type: 'error' });
        }
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
            onConfirm: () => {
                const tutorialSeen = localStorage.getItem('doomlingsTutorialSeen');
                localStorage.clear();
                if (tutorialSeen) localStorage.setItem('doomlingsTutorialSeen', tutorialSeen);
                window.location.reload();
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
                <h2 className="title is-4 text-warning">✨ Premium Status</h2>
                <div className="mb-4">
                    {adsRemoved ? (
                        <div className="tag is-success is-medium">✅ Ads Removed</div>
                    ) : (
                        <div className="tag is-warning is-medium">🔔 Free Tier (Ads Enabled)</div>
                    )}
                </div>
                
                {!adsRemoved && isNativeApp && (
                    <div className="columns is-multiline mt-4">
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

                <div className="mt-6 flex gap-4 is-justify-content-center">
                    <AnimatedButton className="is-light" onClick={restorePurchases}>🔄 Restore Purchases</AnimatedButton>
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

                <div className="theme-selector">
                    <label className="label mb-3">Color Theme</label>
                    <div className="grid grid-cols-5 gap-3">
                        {[
                            { id: 'default', color: 'linear-gradient(135deg, #d63447, #ff7b4d)' },
                            { id: 'ocean', color: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
                            { id: 'forest', color: 'linear-gradient(135deg, #166534, #4ade80)' },
                            { id: 'purple', color: 'linear-gradient(135deg, #7e22ce, #c084fc)' },
                            { id: 'midnight', color: 'linear-gradient(135deg, #1e1b4b, #6366f1)' },
                            { id: 'sunset', color: 'linear-gradient(135deg, #be123c, #fbbf24)' },
                            { id: 'cyber', color: 'linear-gradient(135deg, #f0abfc, #2dd4bf)' },
                            { id: 'gold', color: 'linear-gradient(135deg, #854d0e, #fde047)' },
                            { id: 'mint', color: 'linear-gradient(135deg, #0f766e, #6ee7b7)' },
                            { id: 'mono', color: 'linear-gradient(135deg, #52525b, #d4d4d8)' },
                        ].map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => setTheme(t.id)}
                                className={`theme-swatch p-1 rounded-md cursor-pointer transition-all ${theme === t.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div className="h-8 rounded w-full" style={{ background: t.color }}></div>
                            </div>
                        ))}
                    </div>
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
                        <div key={pref.id} className="is-flex is-align-items-center gap-4 p-4 rounded bg-black/10 border border-white/5">
                            <input type="checkbox" checked={pref.value} onChange={e => {
                                pref.set(e.target.checked);
                                localStorage.setItem(pref.id, String(e.target.checked));
                            }} className="checkbox-large" />
                            <div>
                                <div className="has-text-weight-bold">{pref.label}</div>
                                <div className="is-size-7 text-muted">{pref.note}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

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
        </div>
    );
};

export default SettingsPage;