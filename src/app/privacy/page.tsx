'use client';

import React from 'react';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
    return (
        <div className="home-container" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
            <div className="container max-w-4xl">
                <div className="box p-8 backdrop-blur-xl bg-opacity-80">
                    <div className="text-center mb-8">
                        <h1 className="hero-title text-5xl mb-4">Privacy Policy</h1>
                        <p className="text-sm text-muted">Last updated: February 23, 2026</p>
                    </div>

                    <div className="box p-6 bg-opacity-20 bg-info border-info mb-8">
                        <p className="mb-0">
                            <strong>📱 About This App:</strong> The Doomlings Companion App stores all your game data locally on your device. The free version is ad-supported using Google AdMob. You can remove all ads with a subscription available in the app Settings. No personal accounts are required — everything is managed through your Google Play account.
                        </p>
                    </div>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">🔒 Information We Don&apos;t Collect</h2>
                        <p className="text-muted mb-4">We want to be crystal clear about what we <strong>don&apos;t</strong> collect:</p>
                        <ul className="list-disc pl-6 mb-6 text-muted">
                            <li>Personal information (name, email, phone number)</li>
                            <li>Device identifiers or tracking data</li>
                            <li>Location information</li>
                            <li>Usage analytics or behavioral data</li>
                            <li>Game statistics or progress data</li>
                            <li>Any data that could identify you personally</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">💾 Local Data Storage</h2>
                        <p className="text-muted mb-4">The Doomlings Companion App stores all your game data locally on your device using:</p>
                        <ul className="list-disc pl-6 mb-6 text-muted">
                             <li className="mb-2"><strong>Local Storage:</strong> Your game preferences, settings, and individual game state.</li>
                            <li className="mb-2"><strong>Cloud Synchronization:</strong> For multiplayer modes, game state is briefly shared via a secure, encrypted cloud database (Upstash Redis) to keep all devices in sync. This data is **ephemeral** and is automatically deleted after 2 hours of inactivity.</li>
                            <li className="mb-2"><strong>Local Network (WiFi):</strong> Peer-to-peer data transfer for direct multiplayer syncing between nearby devices.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">📢 Advertising & Subscriptions</h2>
                        <p className="text-muted mb-4">The free version of this app is supported by advertising via <strong>Google AdMob</strong>.</p>
                        <div className="box p-6 hover-scale mb-6">
                            <h3 className="section-title is-small is-secondary mb-4">Google AdMob</h3>
                            <p className="text-sm text-muted mb-4">
                                AdMob may collect device identifiers (Advertising ID), IP address, and app interaction data.
                                <br />• <strong>Policy:</strong> <a href="https://policies.google.com/privacy" className="text-info font-bold">Google Privacy Policy</a>
                                <br />• <strong>Opt-out:</strong> You can reset your Advertising ID in your device Settings or upgrade to Premium.
                            </p>
                        </div>
                    </section>

                    <div className="box p-6 bg-opacity-10 bg-success border-success text-center">
                        <h2 className="section-title is-small is-success mb-4">📧 Contact Us</h2>
                        <p className="text-muted mb-4">Have questions about your privacy or the app?</p>
                        <p className="mb-4">Email: <a href="mailto:phoenix75.help@gmail.com" className="text-info font-bold">phoenix75.help@gmail.com</a></p>
                        <Link href="/contact" className="button is-small is-ghost">Visit Contact Page</Link>
                    </div>

                    <div className="text-center mt-12 pt-8 border-t border-white/10">
                        <Link href="/" className="button is-light">🏠 Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage; 