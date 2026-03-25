'use client';

import React from 'react';
import Link from 'next/link';

const SubscriptionPolicyPage = () => {
    return (
        <div className="home-container" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
            <div className="container max-w-4xl">
                <div className="box p-8 backdrop-blur-xl bg-opacity-80">
                    <div className="text-center mb-8">
                        <h1 className="hero-title text-5xl mb-4">Subscription Policy</h1>
                        <p className="text-sm text-muted">Last updated: March 25, 2026</p>
                    </div>

                    <div className="box p-6 bg-opacity-20 bg-warning border-warning mb-8">
                        <p className="mb-0">
                            <strong>⚠️ Key Point:</strong> DOOMlings offers three subscription tiers to remove ads. When upgrading between plans, your old plan auto-cancels and you pay the full price for the new plan. <strong>You will NOT receive a refund for unused time on your previous subscription.</strong>
                        </p>
                    </div>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">💰 Subscription Tiers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="box p-5 bg-black/20 border-primary/20">
                                <h3 className="section-title is-small is-primary mb-2">Monthly</h3>
                                <p className="text-muted mb-2"><strong>$3.99/month</strong></p>
                                <p className="text-sm text-muted mb-2">Removes all banner and interstitial ads for 1 month.</p>
                                <p className="text-xs text-muted">Auto-renews monthly</p>
                            </div>
                            <div className="box p-5 bg-black/20 border-info/20">
                                <h3 className="section-title is-small is-info mb-2">Yearly</h3>
                                <p className="text-muted mb-2"><strong>$39.99/year</strong></p>
                                <p className="text-sm text-muted mb-2">Removes all ads for 1 year. Includes a 7-day free trial.</p>
                                <p className="text-xs text-muted">Save ~58% vs 12 months</p>
                            </div>
                            <div className="box p-5 bg-black/20 border-success/20">
                                <h3 className="section-title is-small is-success mb-2">Lifetime</h3>
                                <p className="text-muted mb-2"><strong>$49.99</strong> (one-time)</p>
                                <p className="text-sm text-muted mb-2">Remove ads forever with no renewal charges ever.</p>
                                <p className="text-xs text-muted">Best long-term value</p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">❌ NO REFUNDS Policy</h2>
                        <div className="box p-6 bg-opacity-20 bg-danger border-danger mb-6">
                            <p className="text-muted mb-4">
                                <strong>When you upgrade subscriptions, you will NOT receive a refund for any unused time on your current plan.</strong>
                            </p>
                            <p className="text-muted mb-2"><strong>Example 1: Monthly → Yearly</strong></p>
                            <ul className="list-disc pl-6 mb-4 text-muted text-sm">
                                <li>You pay $3.99 for Monthly (current subscription)</li>
                                <li>You have 20 days remaining in your month</li>
                                <li>You upgrade to Yearly ($39.99)</li>
                                <li>Your Monthly plan auto-cancels</li>
                                <li><strong>You receive NO refund for the 20 unused days</strong></li>
                                <li>You pay the full $39.99 for the Yearly plan</li>
                                <li>Total cost: $3.99 + $39.99 = $43.98</li>
                            </ul>

                            <p className="text-muted mb-2"><strong>Example 2: Yearly → Lifetime</strong></p>
                            <ul className="list-disc pl-6 text-muted text-sm">
                                <li>You pay $39.99 for Yearly (current subscription)</li>
                                <li>You have 6 months remaining on your year</li>
                                <li>You upgrade to Lifetime ($49.99)</li>
                                <li>Your Yearly plan auto-cancels</li>
                                <li><strong>You receive NO refund for the 6 unused months</strong></li>
                                <li>You pay the full $49.99 for Lifetime</li>
                                <li>Total cost: $39.99 + $49.99 = $89.98</li>
                            </ul>
                        </div>

                        <div className="box p-6 bg-opacity-10 bg-white/10 border-white/10">
                            <h3 className="section-title is-small mb-4">Google Play Grace Period</h3>
                            <p className="text-muted mb-2">You have <strong>72 hours</strong> to request a refund directly through Google Play for any subscription.</p>
                            <p className="text-muted">Visit: <a href="https://support.google.com/googleplay/answer/2479637" className="text-info font-bold">Google Play Refund Help</a></p>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">🔄 Upgrading Between Plans</h2>
                        <div className="box p-6 bg-opacity-20 bg-info border-info mb-6">
                            <h3 className="section-title is-small is-info mb-4">How Upgrades Work</h3>
                            <ul className="list-disc pl-6 space-y-2 text-muted">
                                <li><strong>Automatic Cancellation:</strong> Your old subscription automatically cancels when you upgrade.</li>
                                <li><strong>Immediate Access:</strong> Your new subscription starts immediately upon purchase.</li>
                                <li><strong>Full Price Charged:</strong> You pay the full price of the new subscription tier. No credits, no prorations, no refunds.</li>
                                <li><strong>No Exchanges:</strong> You cannot "trade in" your current subscription for something else.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">⚡ How Purchases Work</h2>
                        <div className="box p-6 bg-opacity-20 bg-info border-info mb-6">
                            <h3 className="section-title is-small is-info mb-4">✅ Instant Purchase Confirmation</h3>
                            <ul className="list-disc pl-6 space-y-2 text-muted">
                                <li><strong>No app refresh needed</strong> — Subscription updates instantly when you complete a purchase</li>
                                <li>UI shows your new subscription type immediately</li>
                                <li>Continue playing without interruption</li>
                                <li>App automatically verifies status every 5 minutes as backup</li>
                            </ul>
                        </div>

                        <div className="box p-6 bg-opacity-20 bg-success border-success mb-6">
                            <h3 className="section-title is-small is-success mb-4">✅ Double-Purchase Prevention</h3>
                            <ul className="list-disc pl-6 space-y-2 text-muted">
                                <li><strong>Cannot buy the same subscription twice</strong> while active</li>
                                <li>Multi-click protection: Only one charge per action</li>
                                <li>RevenueCat blocks duplicate subscriptions automatically</li>
                                <li>All buttons disabled during "⏳ Processing..." to prevent accidents</li>
                            </ul>
                        </div>

                        <div className="box p-6 bg-opacity-20 bg-danger border-danger">
                            <h3 className="section-title is-small mb-4">⚠️ Accidental Double Transaction (Different Tiers)</h3>
                            <p className="text-muted mb-4">If you buy two <strong>different</strong> subscriptions in rapid succession before processing completes:</p>
                            <div className="box p-4 bg-opacity-10 bg-white/10 border-white/10 mb-4">
                                <p className="text-muted mb-2"><strong>Scenario:</strong> Buy Monthly, then immediately buy Yearly</p>
                                <ul className="list-disc pl-6 space-y-1 text-muted text-sm">
                                    <li>First charge: $3.99 (Monthly)</li>
                                    <li>Second charge: $39.99 (Yearly)</li>
                                    <li>Google Play conflict: Only one subscription allowed</li>
                                    <li>Monthly auto-cancels → Yearly becomes active</li>
                                    <li><strong>You're charged BOTH amounts: $43.98 total</strong></li>
                                    <li><strong>NO REFUND for the cancelled Monthly</strong></li>
                                </ul>
                            </div>
                            <p className="text-muted"><strong>Prevention:</strong> Wait for "⏳ Processing..." to disappear before clicking any other purchase button. This is your responsibility.</p>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">👤 User-Specific Subscriptions</h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted mb-6">
                            <li><strong>Account-Tied:</strong> Subscriptions are tied to your Google Play account, not your device.</li>
                            <li><strong>One Active Plan Per User:</strong> Only one subscription tier can be active at a time per account.</li>
                            <li><strong>Cannot Transfer:</strong> Subscriptions cannot be transferred between accounts or devices.</li>
                            <li><strong>Family Sharing:</strong> Each family member must purchase their own subscription.</li>
                            <li><strong>Reinstall Persistence:</strong> If you reinstall the app on the same device with the same account, your subscription carries over.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">⏰ Lifetime Subscription</h2>
                        <div className="box p-6 bg-opacity-20 bg-success border-success">
                            <ul className="list-disc pl-6 space-y-2 text-muted">
                                <li><strong>Purchase Once, Use Forever:</strong> No renewal charges, no expiration dates.</li>
                                <li><strong>Permanent:</strong> Lifetime subscriptions cannot be cancelled, downgraded, or refunded.</li>
                                <li><strong>Account-Wide:</strong> Applies to your Google Play account permanently.</li>
                                <li><strong>App Updates:</strong> Your Lifetime status persists through app updates and reinstalls.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">🔐 Restore Purchases</h2>
                        <p className="text-muted mb-4">If your subscription stops showing in the app:</p>
                        <div className="box p-6 bg-opacity-10 bg-white/10 border-white/10">
                            <ol className="list-decimal pl-6 space-y-2 text-muted">
                                <li>Open DOOMlings → Go to <strong>Settings</strong></li>
                                <li>Scroll to <strong>Premium Section</strong></li>
                                <li>Tap <strong>"🔄 Restore Previous Purchases"</strong></li>
                                <li>Wait for verification (usually instant)</li>
                                <li>Your subscription status will update automatically</li>
                            </ol>
                            <p className="text-xs text-muted mt-4"><strong>Note:</strong> The app automatically refreshes your subscription status every 5 minutes. No manual action needed in most cases.</p>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">❓ Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <div className="box p-6 bg-opacity-10 bg-white/10 border-white/10">
                                <h3 className="section-title is-small mb-2">Q: I bought Monthly. Can I downgrade or get a refund?</h3>
                                <p className="text-muted"><strong>A:</strong> No. You must wait for your subscription to expire or contact Google Play within 72 hours of purchase for a full refund.</p>
                            </div>

                            <div className="box p-6 bg-opacity-10 bg-white/10 border-white/10">
                                <h3 className="section-title is-small mb-2">Q: Do I get a refund for unused time when upgrading?</h3>
                                <p className="text-muted"><strong>A:</strong> <strong>No.</strong> You pay the full price of the new subscription. Your old subscription auto-cancels, but you do not receive any compensation for unused time.</p>
                            </div>

                            <div className="box p-6 bg-opacity-10 bg-white/10 border-white/10">
                                <h3 className="section-title is-small mb-2">Q: What if I buy Lifetime then regret it?</h3>
                                <p className="text-muted"><strong>A:</strong> Lifetime purchases are permanent and non-refundable after the Google Play 72-hour grace period expires. Choose carefully!</p>
                            </div>

                            <div className="box p-6 bg-opacity-10 bg-white/10 border-white/10">
                                <h3 className="section-title is-small mb-2">Q: Can I have Multiple subscriptions active at once?</h3>
                                <p className="text-muted"><strong>A:</strong> No. Only one subscription tier can be active per account at a time. Upgrading automatically cancels your previous plan.</p>
                            </div>

                            <div className="box p-6 bg-opacity-10 bg-white/10 border-white/10">
                                <h3 className="section-title is-small mb-2">Q: Do I need to refresh the app after purchasing?</h3>
                                <p className="text-muted"><strong>A:</strong> No. The app automatically updates your subscription status within seconds of any purchase. You can continue playing immediately without any refresh.</p>
                            </div>

                            <div className="box p-6 bg-opacity-10 bg-white/10 border-white/10">
                                <h3 className="section-title is-small mb-2">Q: What if I accidentally click the purchase button twice?</h3>
                                <p className="text-muted"><strong>A:</strong> The app prevents this by disabling all buttons during transaction processing. However, if you somehow manage to buy two <strong>different</strong> subscriptions in rapid succession, you'll be charged for both, and only the higher tier will remain active. No refund will be issued. Wait for the "⏳ Processing..." message to disappear before clicking again.</p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="section-title is-small mb-6">📧 Questions?</h2>
                        <div className="box p-6 bg-opacity-20 bg-info border-info text-center">
                            <p className="text-muted mb-4">If you have questions about your subscription:</p>
                            <p className="mb-4">Email: <a href="mailto:phoenix75.help@gmail.com" className="text-info font-bold">phoenix75.help@gmail.com</a></p>
                            <p className="text-xs text-muted">Subject: "Subscription Question"</p>
                            <p className="text-xs text-muted">Response time: 2-5 business days</p>
                        </div>
                    </section>

                    <div className="text-center mt-12 pt-8 border-t border-white/10 flex gap-4 justify-center flex-wrap">
                        <Link href="/" className="button is-light">🏠 Home</Link>
                        <Link href="/privacy" className="button is-light">⚖️ Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPolicyPage;
