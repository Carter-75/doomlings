'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import { OpenAIDeveloperService } from '../lib/openaiDeveloperService';
import CardDataService from '@/lib/cardDataService';

interface DeveloperSettingsProps {
    onCancel?: () => void;
}

export default function DeveloperSettings({ onCancel }: DeveloperSettingsProps) {
    const [openAiKey, setOpenAiKey] = useState('');
    const [githubToken, setGithubToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null);
    const [savedCardsCount, setSavedCardsCount] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadPreferences();
        updateSavedCardsCount();
    }, []);

    const loadPreferences = async () => {
        try {
            const { value: aiKey } = await Preferences.get({ key: 'OPENAI_API_KEY' });
            if (aiKey) setOpenAiKey(aiKey);

            const { value: ghToken } = await Preferences.get({ key: 'GITHUB_PAT' });
            if (ghToken) setGithubToken(ghToken);
        } catch (e) {
            console.error('Failed to load preferences', e);
        }
    };

    const updateSavedCardsCount = async () => {
        try {
            const { value } = await Preferences.get({ key: 'developer_generated_cards' });
            if (value) {
                const cards = JSON.parse(value);
                setSavedCardsCount(Array.isArray(cards) ? cards.length : 0);
            } else {
                setSavedCardsCount(0);
            }
        } catch (e) {
            setSavedCardsCount(0);
        }
    };

    const saveKeys = async () => {
        try {
            await Preferences.set({ key: 'OPENAI_API_KEY', value: openAiKey.trim() });
            await Preferences.set({ key: 'GITHUB_PAT', value: githubToken.trim() });
            setStatus({ message: 'Keys saved successfully!', type: 'success' });
        } catch (e) {
            setStatus({ message: 'Failed to save keys.', type: 'error' });
        }
    };

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!openAiKey.trim()) {
            setStatus({ message: 'OpenAI API Key is missing. Please save it first.', type: 'error' });
            return;
        }

        setLoading(true);
        setStatus({ message: 'Analyzing card...', type: 'info' });

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64Image = reader.result as string;
                    
                    setStatus({ message: 'Calling OpenAI to parse card...', type: 'info' });

                    const aiService = new OpenAIDeveloperService(openAiKey);
                    const generatedJson = await aiService.generateCardFromImage(base64Image);

                    // Check duplicate logic locally
                    const cardService = CardDataService.getInstance();
                    const gameData = await cardService.loadAllData();
                    const allExistingCards = [
                        ...gameData.traits, ...gameData.dominants, ...gameData.ages,
                        ...gameData.catastrophes, ...gameData.trinkets, ...gameData.treasures
                    ].map(c => c.name.toLowerCase().trim());
                    
                    const newCardName = generatedJson.name?.toLowerCase().trim();
                    if (newCardName && allExistingCards.includes(newCardName)) {
                         setStatus({ message: `Card "${generatedJson.name}" already exists! Skipped.`, type: 'warning' });
                         setLoading(false);
                         return;
                    }

                    // Save to Preferences
                    const { value } = await Preferences.get({ key: 'developer_generated_cards' });
                    let savedCards = [];
                    if (value) {
                        savedCards = JSON.parse(value);
                    }
                    savedCards.push(generatedJson);
                    
                    await Preferences.set({ key: 'developer_generated_cards', value: JSON.stringify(savedCards) });
                    setSavedCardsCount(savedCards.length);
                    
                    setStatus({ message: `Card "${generatedJson.name || 'Unknown'}" generated successfully!`, type: 'success' });
                } catch (err: any) {
                     console.error(err);
                     setStatus({ message: err.message || 'Error parsing card.', type: 'error' });
                } finally {
                    setLoading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.onerror = () => {
                setStatus({ message: 'Failed to read image file.', type: 'error' });
                setLoading(false);
            }
        } catch (e: any) {
            setStatus({ message: e.message || 'Scan failed.', type: 'error' });
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!githubToken.trim()) {
            setStatus({ message: 'GitHub PAT is missing. Needed for export.', type: 'error' });
            return;
        }

        setStatus({ message: 'Exporting to GitHub...', type: 'info' });
        setLoading(true);

        try {
            const { value } = await Preferences.get({ key: 'developer_generated_cards' });
            if (!value || JSON.parse(value).length === 0) {
                 setStatus({ message: 'No cards to export.', type: 'warning' });
                 setLoading(false);
                 return;
            }

            const cards = JSON.parse(value);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const exportFileName = `new_cards_${timestamp}.json`;
            const filePath = `public/data/generated_cards/${exportFileName}`;

            const githubPayload = {
                message: `Add generated cards ${exportFileName}`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(cards, null, 2)))),
                branch: 'main'
            };

            // Calling GitHub API directly here because /api routes don't work natively in Capacitor (mobile app bounds).
            const response = await fetch(`https://api.github.com/repos/Carter-75/doomlings/contents/${filePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${githubToken.trim()}`,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json',
                    'X-GitHub-Api-Version': '2022-11-28'
                },
                body: JSON.stringify(githubPayload)
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch(e) {
                    const text = await response.text();
                    console.error('Raw response:', text);
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
                throw new Error(errorData.message || errorData.error || 'GitHub export failed.');
            }

            await Preferences.remove({ key: 'developer_generated_cards' });
            setSavedCardsCount(0);
            setStatus({ message: `Exported successfully to GitHub! Local storage cleared.`, type: 'success' });

        } catch (e: any) {
            console.error('Export Error:', e);
            setStatus({ message: e.message || 'Export failed.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="developer-settings-container">
            <style jsx>{`
                .developer-settings-container {
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 0, 128, 0.4);
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 20px;
                }
                .dev-title {
                    color: #ff0080;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .input-group {
                    margin-bottom: 15px;
                }
                .input-group label {
                    display: block;
                    color: #ccc;
                    margin-bottom: 5px;
                    font-size: 14px;
                }
                .input-group input[type="password"] {
                    width: 100%;
                    padding: 10px;
                    border-radius: 5px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    box-sizing: border-box;
                }
                .status-msg {
                    padding: 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                    text-align: center;
                    font-weight: bold;
                    white-space: pre-wrap;
                }
                .status-success { background: rgba(0, 255, 136, 0.2); color: #00ff88; border: 1px solid #00ff88; }
                .status-error { background: rgba(255, 0, 0, 0.2); color: #ff4444; border: 1px solid #ff4444; }
                .status-info { background: rgba(0, 157, 255, 0.2); color: #009dff; border: 1px solid #009dff; }
                .status-warning { background: rgba(255, 193, 7, 0.2); color: #ffc107; border: 1px solid #ffc107; }
                
                .button-row {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                .btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 5px;
                    border: none;
                    font-weight: bold;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s;
                    min-width: 120px;
                }
                .btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-save { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255,255,255,0.3); }
                .btn-save:hover:not(:disabled) { background: rgba(255, 255, 255, 0.2); }
                .btn-scan { background: linear-gradient(135deg, #ff0080, #7928ca); color: white; }
                .btn-scan:hover:not(:disabled) { box-shadow: 0 0 10px rgba(255, 0, 128, 0.6); }
                .btn-export { background: linear-gradient(135deg, #00d2ff, #3a7bd5); color: white; }
                .btn-export:hover:not(:disabled) { box-shadow: 0 0 10px rgba(0, 210, 255, 0.6); }
                
                .camera-label {
                    display: inline-block;
                    cursor: pointer;
                    width: 100%;
                    box-sizing: border-box;
                }
                .stats {
                    text-align: center;
                    color: #aaa;
                    margin-top: 15px;
                    font-size: 14px;
                }
            `}</style>
            <h2 className="dev-title">🛠 Developer Tools</h2>

            <div className="input-group">
                <label>OpenAI API Key</label>
                <input 
                    type="password" 
                    value={openAiKey} 
                    onChange={e => setOpenAiKey(e.target.value)} 
                    placeholder="sk-..."
                />
            </div>
            
            <div className="input-group">
                <label>GitHub Personal Access Token</label>
                <input 
                    type="password" 
                    value={githubToken} 
                    onChange={e => setGithubToken(e.target.value)} 
                    placeholder="ghp_..."
                />
            </div>

            <div className="button-row">
                <button className="btn btn-save" onClick={saveKeys} disabled={loading}>
                    💾 Save Keys
                </button>
            </div>

            {status && (
                <div className={`status-msg status-${status.type}`}>
                    {status.message}
                </div>
            )}

            <div className="stats">
                Pending Cards in Local Storage: <strong>{savedCardsCount}</strong>
            </div>

            <div className="button-row">
                <label className={`btn btn-scan ${loading ? 'disabled' : ''}`}>
                    📷 Scan Card
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        style={{ display: 'none' }} 
                        ref={fileInputRef}
                        onChange={handleCapture}
                        disabled={loading || !openAiKey}
                    />
                </label>
                
                <button 
                    className="btn btn-export" 
                    onClick={handleExport} 
                    disabled={loading || savedCardsCount === 0 || !githubToken}
                >
                    🚀 Export & Clear JSON
                </button>
            </div>
        </div>
    );
}
