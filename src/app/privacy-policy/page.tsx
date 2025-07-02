'use client';

import React from 'react';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
    return (
        <>
            <style jsx>{`
                .privacy-container {
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 30px;
                    background: rgba(0, 0, 0, 0.8);
                    border-radius: 15px;
                    box-shadow: 0 0 30px rgba(0, 157, 255, 0.3);
                    color: #fff;
                    line-height: 1.6;
                    font-family: 'Arial', sans-serif;
                }

                .privacy-container h1 {
                    color: #00ff88;
                    text-align: center;
                    margin-bottom: 10px;
                    font-size: 2.5em;
                    text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
                }

                .privacy-container .last-updated {
                    text-align: center;
                    color: #ccc;
                    margin-bottom: 30px;
                    font-style: italic;
                }

                .privacy-container h2 {
                    color: #3c82f7;
                    margin-top: 30px;
                    margin-bottom: 15px;
                    font-size: 1.4em;
                    border-bottom: 2px solid rgba(60, 130, 247, 0.3);
                    padding-bottom: 5px;
                }

                .privacy-container p {
                    margin-bottom: 15px;
                    color: #e0e0e0;
                }

                .privacy-container ul {
                    margin-left: 20px;
                    margin-bottom: 15px;
                }

                .privacy-container li {
                    margin-bottom: 8px;
                    color: #e0e0e0;
                }

                .highlight-box {
                    background: rgba(0, 255, 136, 0.1);
                    border: 1px solid rgba(0, 255, 136, 0.3);
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }

                .contact-info {
                    background: rgba(60, 130, 247, 0.1);
                    border: 1px solid rgba(60, 130, 247, 0.3);
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                }

                .contact-info a {
                    color: #3c82f7;
                    text-decoration: none;
                    font-weight: bold;
                }

                .contact-info a:hover {
                    color: #00ff88;
                    text-shadow: 0 0 5px rgba(0, 255, 136, 0.5);
                }

                .compatibility-info {
                    background: rgba(60, 130, 247, 0.1);
                    border: 1px solid rgba(60, 130, 247, 0.3);
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }

                .compatibility-info h3 {
                    color: #3c82f7;
                    margin-bottom: 15px;
                    font-size: 1.2em;
                }

                .footer-nav {
                    text-align: center;
                    padding: 30px 0;
                    margin-top: 40px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .footer-nav a {
                    color: #ccc;
                    text-decoration: none;
                    margin: 0 20px;
                    transition: color 0.3s ease;
                }

                .footer-nav a:hover {
                    color: #00ff88;
                }

                @media (max-width: 768px) {
                    .privacy-container {
                        margin: 20px;
                        padding: 20px;
                    }
                    
                    .privacy-container h1 {
                        font-size: 2em;
                    }
                }
            `}</style>

            <div className="gradient-overlay"></div>
            <div className="blue-glow-container">
                <div className="blue-circles">
                    <div className="blue-circle"></div>
                    <div className="blue-circle"></div>
                    <div className="blue-circle"></div>
                    <div className="blue-circle"></div>
                    <div className="blue-circle"></div>
                </div>
            </div>

            <div className="privacy-container">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last updated: December 2024</p>

                <div className="highlight-box">
                    <p><strong>📱 Privacy First:</strong> The Doomlings Companion App is designed with your privacy in mind. We believe your gaming data should stay yours, which is why we've built this app to work entirely on your device without collecting or transmitting any personal information.</p>
                </div>

                <h2>🔒 Information We Don't Collect</h2>
                <p>We want to be crystal clear about what we <strong>don't</strong> collect:</p>
                <ul>
                    <li>Personal information (name, email, phone number)</li>
                    <li>Device identifiers or tracking data</li>
                    <li>Location information</li>
                    <li>Usage analytics or behavioral data</li>
                    <li>Game statistics or progress data</li>
                    <li>Any data that could identify you personally</li>
                </ul>

                <h2>💾 Local Data Storage</h2>
                <p>The Doomlings Companion App stores all your game data locally on your device using:</p>
                <ul>
                    <li><strong>Local Storage:</strong> Your game preferences, settings, and current game state</li>
                    <li><strong>Device Storage:</strong> Saved game files and custom configurations</li>
                    <li><strong>Cache:</strong> App resources for faster loading</li>
                </ul>
                <p>This data never leaves your device unless you explicitly choose to share it (like exporting a game configuration).</p>

                <h2>🎮 How the App Works</h2>
                <p>The Doomlings Companion App is a fully offline experience:</p>
                <ul>
                    <li>All game logic runs locally on your device</li>
                    <li>No internet connection required for core functionality</li>
                    <li>No data is sent to external servers</li>
                    <li>No accounts or sign-ups required</li>
                </ul>

                <h2>🔧 Settings and Customization</h2>
                <p>You have full control over your app experience:</p>
                <ul>
                    <li>Customize game data files (stored locally)</li>
                    <li>Adjust UI scaling and preferences</li>
                    <li>Save and load multiple game configurations</li>
                    <li>Export/import game data as needed</li>
                </ul>

                <h2>🔄 Future Features</h2>
                <p>We may add optional cloud sync features in the future. If we do:</p>
                <ul>
                    <li>Cloud sync will be entirely optional</li>
                    <li>You'll have full control over what data is synced</li>
                    <li>We'll update this policy and notify users</li>
                    <li>Local-only mode will always remain available</li>
                </ul>

                <h2>🛡️ Security</h2>
                <p>Even though we don't collect data, we take security seriously:</p>
                <ul>
                    <li>App uses secure coding practices</li>
                    <li>Regular security updates</li>
                    <li>No third-party tracking or analytics</li>
                    <li>Open development process</li>
                </ul>

                <h2>👨‍💻 Third-Party Services</h2>
                <p>The app may use minimal third-party services for:</p>
                <ul>
                    <li><strong>App Store Distribution:</strong> Required for app installation</li>
                    <li><strong>Crash Reporting:</strong> Anonymous crash data to fix bugs (if enabled)</li>
                </ul>
                <p>These services don't receive any personal information from our app.</p>

                <h2>📱 Permissions & Compatibility</h2>
                <p>The app requests minimal permissions and maintains high compatibility standards:</p>
                <ul>
                    <li><strong>Storage:</strong> To save your game data and preferences locally</li>
                    <li><strong>Network (if applicable):</strong> Only for optional features like updates</li>
                    <li><strong>Android 15 Compatible:</strong> Targets API level 35 for enhanced security and performance</li>
                    <li><strong>Modern Security:</strong> Complies with Google Play's latest security requirements</li>
                </ul>
                
                <div className="compatibility-info">
                    <h3>🔧 System Requirements</h3>
                    <ul>
                        <li><strong>Android:</strong> 5.1 (API 22) or higher</li>
                        <li><strong>Target:</strong> Android 15 (API 35) for optimal experience</li>
                        <li><strong>Storage:</strong> Minimal local storage for game data</li>
                        <li><strong>Internet:</strong> Not required for core functionality</li>
                    </ul>
                </div>

                <h2>🔄 Policy Updates</h2>
                <p>We may update this privacy policy occasionally to:</p>
                <ul>
                    <li>Clarify our practices</li>
                    <li>Reflect new features</li>
                    <li>Comply with legal requirements</li>
                </ul>
                <p>Significant changes will be communicated through app updates.</p>

                <h2>👶 Children's Privacy</h2>
                <p>The Doomlings Companion App is safe for all ages:</p>
                <ul>
                    <li>No data collection means no privacy concerns</li>
                    <li>No chat or social features</li>
                    <li>No advertising or in-app purchases</li>
                    <li>Fully offline experience</li>
                </ul>

                <div className="contact-info">
                    <h2>📧 Contact Us</h2>
                    <p>Have questions about this privacy policy or the app?</p>
                    <p>Email us at: <a href="mailto:phoenix75.help@gmail.com">phoenix75.help@gmail.com</a></p>
                    <p>Or visit our <Link href="/contact" style={{ color: '#3c82f7', textDecoration: 'none', fontWeight: 'bold' }}>contact page</Link></p>
                </div>

                <div className="footer-nav">
                    <Link href="/">🏠 Home</Link>
                    <Link href="/contact">📧 Contact</Link>
                    <Link href="/settings">⚙️ Settings</Link>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicyPage; 