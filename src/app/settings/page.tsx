'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// This is a placeholder for the real implementation
const GoogleSignInButton = () => (
    <div className="google-signin">
        <button onClick={() => alert('Google Sign-In not implemented yet.')}>
            Sign in with Google
        </button>
        <p>Sign in to sync your settings across devices.</p>
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

    useEffect(() => {
        const savedScaling = localStorage.getItem('uiScaling');
        if (savedScaling) {
            setScale(parseInt(savedScaling, 10));
        }
        fetchJsonFiles();
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

        .google-signin {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        .google-signin button {
            background-color: #4285f4;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
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

                    {/* Google Sign-In Section */}
                    <div className="settings-section">
                        <h2>Cloud Sync</h2>
                        <GoogleSignInButton />
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
                </div>
            </div>
            
            <footer style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <Link href="/">Home</Link>
            </footer>
        </>
    );
};

export default SettingsPage; 