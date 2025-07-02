'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Preferences } from '@capacitor/preferences';

// Cloud Sync Section - Coming Soon
const CloudSyncSection = () => (
    <div className="cloud-sync-section">
        <div className="coming-soon-banner">
            <h3>🚀 Coming Soon</h3>
            <p>Cloud sync will allow you to:</p>
            <ul>
                <li>📱 Sync settings across devices</li>
                <li>💾 Backup your game saves</li>
                <li>🔄 Access your data anywhere</li>
                <li>👥 Share configurations with friends</li>
            </ul>
            <p className="note">
                <strong>Note:</strong> All sync features will be completely optional. 
                The app will always work fully offline if you prefer.
            </p>
        </div>
        <div className="sync-status">
            <div className="status-indicator offline">
                <span className="status-dot"></span>
                <span>Offline Mode (Local Storage Only)</span>
            </div>
        </div>
    </div>
);

const SettingsPage = () => {
    // State for UI scaling
    const [scale, setScale] = useState(100);

    // State for JSON editor
    const [jsonFiles, setJsonFiles] = useState<string[]>([]);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState('');

    // State for confirmation dialog
    const [showConfirm, setShowConfirm] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);

    const [fileName, setFileName] = useState('');
    const [savedFiles, setSavedFiles] = useState<string[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const savedScaling = localStorage.getItem('uiScaling');
        if (savedScaling) {
            setScale(parseInt(savedScaling, 10));
        }
        fetchJsonFiles();
        fetchSavedFiles();
    }, []);

    // Stub functions for now
    const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setScale(parseInt(e.target.value, 10));
    };

    const applyScale = () => {
        const scaleValue = scale / 100;
        document.documentElement.style.setProperty('--ui-scale', scaleValue.toString());
        localStorage.setItem('uiScaling', scale.toString());
        alert(`UI scale set to ${scale}%`);
    };

    const fetchJsonFiles = async () => {
        try {
            const response = await fetch('/api/list-files');
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            setJsonFiles(data);
        } catch (error) {
            console.error(error);
            // Handle error state in UI
        }
    };

    const viewFile = async (fileName: string) => {
        try {
            const response = await fetch(`/api/get-file?file=${fileName}`);
            if (!response.ok) {
                throw new Error('Failed to fetch file content');
            }
            const data = await response.json();
            setFileContent(JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(error);
            setFileContent('Error loading file content.');
        }
    };

    const editFile = (fileName: string) => {
        setEditingFile(fileName);
        viewFile(fileName); // Load content into editor
    };

    const saveFile = async (fileName: string) => {
        try {
            const response = await fetch('/api/save-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fileName, content: fileContent }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save file');
            }

            alert('File saved successfully!');
            setEditingFile(null);
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                alert(`Error saving file: ${error.message}`);
            } else {
                alert('An unknown error occurred.');
            }
        }
    };

    const deleteFile = (fileName: string) => {
        setFileToDelete(fileName);
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        if (fileToDelete) {
            try {
                const response = await fetch(`/api/delete-file?file=${fileToDelete}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete file');
                }

                alert('File deleted successfully!');
                // Refetch the file list to update the UI
                fetchJsonFiles();
            } catch (error) {
                console.error(error);
                if (error instanceof Error) {
                    alert(`Error deleting file: ${error.message}`);
                } else {
                    alert('An unknown error occurred.');
                }
            }
        }
        setShowConfirm(false);
        setFileToDelete(null);
    };

    const fetchSavedFiles = async () => {
        try {
            const { keys } = await Preferences.keys();
            const gameFiles = keys.filter(key => key.startsWith('gameState_'));
            setSavedFiles(gameFiles.map(key => key.replace('gameState_', '')));
        } catch (error) {
            console.error('Error fetching saved files:', error);
            setMessage('Error fetching saved files.');
        }
    };

    const handleLoad = async (fileToLoad: string) => {
        try {
            const result = await Preferences.get({ key: `gameState_${fileToLoad}` });
            if (result.value) {
                localStorage.setItem('gameState', result.value);
                setMessage(`Game state "${fileToLoad}" loaded successfully! You can now return to the game.`);
            } else {
                setMessage(`No data found for "${fileToLoad}".`);
            }
        } catch (error) {
            console.error('Error loading game state:', error);
            setMessage('Error loading game state.');
        }
    };

    const handleSave = async () => {
        if (!fileName.trim()) {
            setMessage('Please enter a file name.');
            return;
        }

        try {
            const gameState = localStorage.getItem('gameState');
            if (gameState) {
                await Preferences.set({
                    key: `gameState_${fileName}`,
                    value: gameState,
                });
                setMessage(`Game state saved as "${fileName}"!`);
                // Manually refresh the list to show the new file
                fetchSavedFiles();
                setFileName(''); // Clear input
            } else {
                setMessage('No game state found to save. Please play the game first.');
            }
        } catch (error) {
            console.error('Error saving game state:', error);
            setMessage('Error saving game state.');
        }
    };

    const handleDelete = async (fileToDelete: string) => {
        if (!confirm(`Are you sure you want to delete "${fileToDelete}"?`)) {
            return;
        }

        try {
            await Preferences.remove({ key: `gameState_${fileToDelete}` });
            setMessage(`"${fileToDelete}" has been deleted.`);
            // Manually refresh the list
            fetchSavedFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            setMessage('Error deleting file.');
        }
    };

    return (
        <>
            {/* Styles */}
            <style jsx>{`
                /* All the CSS from settings.html goes here */
                .container {
                    width: 100%;
                    max-width: 100vw;
                    overflow-x: hidden;
                    padding: 0 10px;
                    box-sizing: border-box;
                }
                /* ... (rest of the styles from the file) */
                 .settings-container {
            max-width: 800px;
            width: 90%;
            margin: 40px auto;
            padding: 20px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 157, 255, 0.3);
            box-sizing: border-box;
            overflow-x: hidden;
        }

        @media screen and (max-width: 600px) {
            .settings-container {
                width: 95%;
                padding: 15px;
                margin: 20px auto;
            }
        }

        .settings-section {
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 8px;
            box-sizing: border-box;
            overflow-x: hidden;
        }

        .settings-section h2 {
            color: #fff;
            margin-bottom: 20px;
        }
        
        .scale-control {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 15px;
            flex-wrap: wrap;
            width: 100%;
            box-sizing: border-box;
        }

        .scale-control label {
            color: #fff;
            min-width: 200px;
            flex-shrink: 0;
        }

        .scale-control input[type="range"] {
            flex: 1;
        }

        .scale-value {
            color: #00ff88;
            min-width: 50px;
            text-align: right;
        }

        .json-editor {
            margin-top: 20px;
        }

        .json-file {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 5px;
            border: 1px solid rgba(0, 157, 255, 0.3);
        }

        .json-file-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .json-file-name {
            color: #fff;
            font-weight: bold;
        }

        .json-actions {
            display: flex;
            gap: 10px;
        }

        .json-content {
            background: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            font-family: monospace;
            color: #fff;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
        }

        .json-edit-mode textarea {
            width: 100%;
            min-height: 200px;
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            border: 1px solid rgba(0, 157, 255, 0.5);
            border-radius: 5px;
            padding: 10px;
            font-family: monospace;
            margin-top: 10px;
        }

        .action-btn {
            background: linear-gradient(45deg, #007bff, #00ff88);
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 157, 255, 0.4);
        }

        .delete-btn {
            background: linear-gradient(45deg, #ff4444, #ff0000);
        }
        
        .confirm-dialog {
            display: ${showConfirm ? 'block' : 'none'};
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255, 0, 0, 0.5);
            z-index: 1000;
            text-align: center;
        }

        .confirm-dialog h3 {
            color: #fff;
            margin-bottom: 20px;
        }

        .confirm-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .overlay {
            display: ${showConfirm ? 'block' : 'none'};
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999;
        }

        .cloud-sync-section {
            text-align: center;
        }

        .coming-soon-banner {
            background: linear-gradient(135deg, rgba(60, 130, 247, 0.1), rgba(0, 255, 136, 0.1));
            border: 1px solid rgba(60, 130, 247, 0.3);
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 20px;
        }

        .coming-soon-banner h3 {
            color: #00ff88;
            margin-bottom: 15px;
            font-size: 1.4em;
        }

        .coming-soon-banner p {
            color: #e0e0e0;
            margin-bottom: 15px;
            line-height: 1.6;
        }

        .coming-soon-banner ul {
            text-align: left;
            max-width: 400px;
            margin: 20px auto;
            color: #ccc;
        }

        .coming-soon-banner li {
            margin-bottom: 8px;
            padding-left: 5px;
        }

        .coming-soon-banner .note {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            font-size: 0.9em;
            color: #b0b0b0;
        }

        .sync-status {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
        }

        .status-indicator.offline {
            background: rgba(128, 128, 128, 0.2);
            border: 1px solid rgba(128, 128, 128, 0.3);
            color: #ccc;
        }

        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #888;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .app-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .info-card {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(60, 130, 247, 0.2);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
        }

        .info-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(60, 130, 247, 0.2);
        }

        .info-card h3 {
            color: #3c82f7;
            margin-bottom: 10px;
            font-size: 1.1em;
        }

        .info-card p {
            color: #fff;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .info-card small {
            color: #ccc;
            font-size: 0.85em;
        }

        .advanced-settings {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .setting-item {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(60, 130, 247, 0.2);
            border-radius: 8px;
            padding: 20px;
        }

        .setting-item label {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #fff;
            font-weight: bold;
            cursor: pointer;
        }

        .setting-item input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: #3c82f7;
        }

        .setting-item small {
            display: block;
            color: #ccc;
            margin-top: 8px;
            margin-left: 30px;
            font-size: 0.9em;
            line-height: 1.4;
        }
            `}</style>
            
            {/* Overlay and Confirmation Dialog */}
            <div className="overlay" onClick={() => setShowConfirm(false)}></div>
            <div className="confirm-dialog">
                <h3>Are you sure you want to delete this file?</h3>
                <div className="confirm-actions">
                    <button className="action-btn delete-btn" onClick={confirmDelete}>Yes, Delete</button>
                    <button className="action-btn" onClick={() => setShowConfirm(false)}>Cancel</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container">
                <div className="settings-container">
                    <h1 style={{ color: '#fff', textAlign: 'center' }}>Settings</h1>

                    {/* UI Scaling Section */}
                    <div className="settings-section">
                        <h2>UI Scaling</h2>
                        <div className="scale-control">
                            <label htmlFor="ui-scale">Scale Interface:</label>
                            <input type="range" id="ui-scale" min="50" max="150" value={scale} onChange={handleScaleChange} />
                            <span className="scale-value">{scale}%</span>
                        </div>
                        <button className="action-btn" onClick={applyScale}>Apply Scale</button>
                    </div>

                    {/* Cloud Sync Section */}
                    <div className="settings-section">
                        <h2>Cloud Sync</h2>
                        <CloudSyncSection />
                    </div>

                    {/* JSON Editor Section */}
                    <div className="settings-section">
                        <h2>Customize Game Data</h2>
                        <div className="json-editor">
                            {jsonFiles.map(file => (
                                <div key={file} className="json-file">
                                    <div className="json-file-header">
                                        <span className="json-file-name">{file}</span>
                                        <div className="json-actions">
                                            {editingFile === file ? (
                                                <>
                                                    <button className="action-btn" onClick={() => saveFile(file)}>Save</button>
                                                    <button className="action-btn" onClick={() => setEditingFile(null)}>Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="action-btn" onClick={() => viewFile(file)}>View</button>
                                                    <button className="action-btn" onClick={() => editFile(file)}>Edit</button>
                                                    <button className="action-btn delete-btn" onClick={() => deleteFile(file)}>Delete</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {editingFile === file ? (
                                        <textarea value={fileContent} onChange={e => setFileContent(e.target.value)}></textarea>
                                    ) : (
                                         <div className="json-content" style={{ display: 'block' }}>
                                            <pre>{fileContent}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* App Information Section */}
                    <div className="settings-section">
                        <h2>App Information</h2>
                        <div className="app-info-grid">
                            <div className="info-card">
                                <h3>📱 Version</h3>
                                <p>2.1.0</p>
                                <small>Android 15 compatible with enhanced UI</small>
                            </div>
                            <div className="info-card">
                                <h3>🎮 Game Support</h3>
                                <p>Doomlings Board Game</p>
                                <small>Official companion app</small>
                            </div>
                            <div className="info-card">
                                <h3>💾 Storage</h3>
                                <p>Local Device Only</p>
                                <small>No cloud storage required</small>
                            </div>
                            <div className="info-card">
                                <h3>🔒 Privacy</h3>
                                <p>100% Private</p>
                                <small>No data collection</small>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Settings Section */}
                    <div className="settings-section">
                        <h2>Advanced Settings</h2>
                        <div className="advanced-settings">
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" defaultChecked />
                                    <span>Enable animations and transitions</span>
                                </label>
                                <small>Disable for better performance on older devices</small>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" defaultChecked />
                                    <span>Show tooltips and help text</span>
                                </label>
                                <small>Display helpful hints throughout the app</small>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" />
                                    <span>Developer mode</span>
                                </label>
                                <small>Show additional debugging information</small>
                            </div>
                        </div>
                    </div>

                    {/* Save & Load Game Section */}
                    <div className="settings-section">
                        <h2>Save & Load Game</h2>
                        {message && 
                            <div className="notification is-info is-light">
                                <button className="delete" onClick={() => setMessage('')}></button>
                                {message}
                            </div>
                        }

                        <div className="box">
                            <h3 className="subtitle">Save Current Game</h3>
                            <div className="field has-addons">
                                <div className="control is-expanded">
                                    <input
                                        className="input"
                                        type="text"
                                        placeholder="e.g., My Awesome Game"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                                    />
                                </div>
                                <div className="control">
                                    <button className="button is-primary" onClick={handleSave} disabled={!fileName.trim()}>
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="box">
                            <h3 className="subtitle">Load Saved Game</h3>
                            {savedFiles.length > 0 ? (
                                <table className="table is-fullwidth is-hoverable">
                                    <tbody>
                                        {savedFiles.map((file) => (
                                            <tr key={file}>
                                                <td style={{ verticalAlign: 'middle' }}>{file}</td>
                                                <td className="has-text-right">
                                                    <button className="button is-success mr-2" onClick={() => handleLoad(file)}>
                                                        Load
                                                    </button>
                                                    <button className="button is-danger is-light" onClick={() => handleDelete(file)}>
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No saved games found. Go play a game and save it!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <footer style={{ 
                textAlign: 'center', 
                padding: '30px 0', 
                marginTop: '40px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
                    <Link href="/" style={{ color: '#ccc', textDecoration: 'none', transition: 'color 0.3s ease' }}>
                        🏠 Home
                    </Link>
                    <Link href="/contact" style={{ color: '#ccc', textDecoration: 'none', transition: 'color 0.3s ease' }}>
                        📧 Contact
                    </Link>
                    <Link href="/privacy-policy" style={{ color: '#ccc', textDecoration: 'none', transition: 'color 0.3s ease' }}>
                        🔒 Privacy Policy
                    </Link>
                </div>
            </footer>
        </>
    );
};

export default SettingsPage; 