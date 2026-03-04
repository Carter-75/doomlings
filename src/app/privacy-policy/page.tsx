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
                    padding-top: 30px;
                    padding-bottom: calc(30px + var(--ad-banner-height, 0px));
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
                <p className="last-updated">Last updated: February 23, 2026</p>

                <div className="highlight-box">
                    <p><strong>📱 About This App:</strong> The Doomlings Companion App stores all your game data locally on your device. The free version is ad-supported using Google AdMob. You can remove all ads with a $3.99/month subscription available in the app Settings. No personal accounts are required — everything is managed through your Google Play account.</p>
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
                    <li><strong>Local Network (WiFi):</strong> If you choose to sync your game state with another device on the same local network, data is transferred directly peer-to-peer. No data is sent over the internet or to our servers.</li>
                </ul>
                <p>This data never leaves your device unless you explicitly choose to share it (like exporting a game configuration).</p>

                <h2>🎮 How the App Works</h2>
                <p>The Doomlings Companion App offers different gameplay modes (Companion App & upcoming Full Digital Game) under two tiers:</p>
                <ul>
                    <li><strong>Free (Ad-Supported):</strong> All game logic runs locally. Google AdMob serves banner and interstitial ads, which may use device identifiers (see Advertising section below).</li>
                    <li><strong>Premium ($3.99/month):</strong> All ads are removed. No ad data is collected. Subscription managed by Google Play Billing — no separate account needed.</li>
                    <li>No internet connection required for core game functionality (Local WiFi multiplayer operates purely on your local network)</li>
                    <li>No accounts or sign-ups required from us</li>
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
                <p>We take security seriously:</p>
                <ul>
                    <li>App uses secure coding practices</li>
                    <li>Regular security updates</li>
                    <li>Limited ad tracking via Google AdMob in the free tier (opt-out: purchase Remove Ads in Settings)</li>
                    <li>Open development process</li>
                </ul>

                <h2>📢 Advertising &amp; Subscriptions</h2>
                <p>The free version of this app is supported by advertising. We use <strong>Google AdMob</strong> to serve ads.</p>
                <ul>
                    <li><strong>What Google AdMob may collect:</strong> Device identifiers (Advertising ID), IP address, app interaction data, and general device information to serve and measure ads.</li>
                    <li><strong>Google's Privacy Policy:</strong> <a href="https://policies.google.com/privacy" style={{ color: '#3c82f7' }}>policies.google.com/privacy</a></li>
                    <li><strong>How to opt out of personalized ads:</strong> Go to your Android Settings → Privacy → Ads → Delete Advertising ID or opt out of ad personalization.</li>
                    <li><strong>Remove Ads Subscription:</strong> For $3.99/month you can remove all ads. Your subscription is managed entirely by Google Play — we never see your payment details. No app account is required; the subscription is tied to your Google Play account.</li>
                    <li><strong>Restore Purchases:</strong> If you reinstall the app, use the "Restore Purchases" button in Settings to re-apply your subscription without paying again.</li>
                </ul>

                <h2>👨‍💻 Third-Party Services</h2>
                <p>The app uses the following third-party services:</p>
                <ul>
                    <li><strong>Google AdMob:</strong> Ad serving in the free tier. May collect device ad identifiers and interaction data. <a href="https://support.google.com/admob/answer/6128543" style={{ color: '#3c82f7' }}>AdMob Privacy Policy</a></li>
                    <li><strong>Google Play Billing:</strong> Processes the Remove Ads subscription payment. Google handles all payment data — we do not store your payment information.</li>
                    <li><strong>App Store Distribution:</strong> Required for app installation</li>
                    <li><strong>Crash Reporting:</strong> Anonymous crash data to fix bugs (if enabled)</li>
                </ul>
                <p>Premium subscribers (Remove Ads active) are not subject to AdMob data collection.</p>

                <h2>📱 Permissions & Compatibility</h2>
                <p>The app requests minimal permissions and maintains high compatibility standards:</p>
                <ul>
                    <li><strong>Storage:</strong> To save your game data and preferences locally</li>
                    <li><strong>Network:</strong> To facilitate optional Local WiFi syncing between devices and checking for updates</li>
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
                <p>The Doomlings Companion App is designed to be family-friendly:</p>
                <ul>
                    <li>No data collection by us (all game data stays on device)</li>
                    <li>No chat or social features</li>
                    <li>The free version displays ads via Google AdMob, which may use non-personalized identifiers. Parents can remove all ads with the $3.99/month Remove Ads subscription.</li>
                    <li>To disable all advertising for children, purchase the Remove Ads subscription in Settings, or reset the Advertising ID in device Settings → Privacy → Ads.</li>
                </ul>

                <h2>🌍 Global Privacy Rights</h2>
                <p>We are committed to global privacy compliance (including GDPR, CCPA, and others):</p>
                <ul>
                    <li><strong>Right to Access:</strong> Your game data resides on your device. You have full access to it at all times.</li>
                    <li><strong>Right to Deletion:</strong> You can delete any game file via the Settings menu or clear your app data to remove everything.</li>
                    <li><strong>Right to Opt Out of Advertising:</strong> Purchase the Remove Ads subscription ($3.99/month) to stop all ad data collection, or reset your Android Advertising ID in device Settings → Privacy → Ads.</li>
                    <li><strong>Right to Revoke Consent:</strong> Cancel your Remove Ads subscription at any time via Google Play → Subscriptions. Upon cancellation, ads will resume at the end of the billing period.</li>
                </ul>

                <div className="contact-info">
                    <h2>📧 Contact Us</h2>
                    <p>Have questions about this privacy policy or the app?</p>
                    <p>Email us at: <a href="mailto:phoenix75.help@gmail.com">phoenix75.help@gmail.com</a></p>
                    <p>Or visit our <Link href="/contact" style={{ color: '#3c82f7', textDecoration: 'none', fontWeight: 'bold' }}>contact page</Link></p>
                </div>

                <div className="footer-nav">
                    <Link href="/">🏠 Home</Link>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicyPage; 