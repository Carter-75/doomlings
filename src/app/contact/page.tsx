'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useNotification } from '@/lib/notification-context';

const ContactPage = () => {
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<'contact' | 'faq' | 'support'>('contact');

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const subject = (form.elements.namedItem('subject') as HTMLInputElement).value;
        const message = (form.elements.namedItem('message') as HTMLInputElement).value;

        const mailtoLink = `mailto:phoenix75.help@gmail.com?subject=${encodeURIComponent(`[Doomlings App] ${subject}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n---\nSent from Doomlings Companion App Contact Form`)}`;

        try {
            window.location.href = mailtoLink;
            showNotification({
                title: 'Success',
                message: "Opening your email client...",
                type: 'success'
            });

            setTimeout(() => {
                form.reset();
            }, 1000);
        } catch (error) {
            showNotification({
                title: 'Error',
                message: "Error opening email client. Please try again.",
                type: 'error'
            });
        }
    };

    const faqs = [
        {
            question: "How do I save my game progress?",
            answer: "Go to Settings > Save & Load Game. Enter a name for your save file and click 'Save'. Your current game state will be stored locally on your device."
        },
        {
            question: "Can I customize the game cards and rules?",
            answer: "Yes! In Settings > Customize Game Data, you can view and edit the JSON files that contain all the game data including challenges, ages, catastrophes, and more."
        },
        {
            question: "Why aren't the spinner arrows showing on number inputs?",
            answer: "The custom styled spinner arrows should appear on all number inputs. If you don't see them, try refreshing the app or checking if your browser supports the styling."
        },
        {
            question: "How do I adjust the UI size?",
            answer: "In Settings > UI Scaling, use the slider to adjust the interface size from 50% to 150%. Click 'Apply Scale' to save your preference."
        },
        {
            question: "Is my data safe and private?",
            answer: "Absolutely! The app works entirely offline. All your game data, settings, and preferences are stored locally on your device and never transmitted anywhere."
        },
        {
            question: "Can I use this app without an internet connection?",
            answer: "Yes! The Doomlings Companion App is designed to work completely offline. You only need internet for the initial download and updates."
        },
        {
            question: "How do I reset the app to default settings?",
            answer: "You can clear your browser's local storage for this app, or delete individual saved games from the Settings page. There's no global reset button to prevent accidental data loss."
        },
        {
            question: "Can I export my game configurations?",
            answer: "Currently, game data is stored locally. We're considering adding export/import features in future updates. Contact us if this is important to you!"
        }
    ];

    return (
        <div className="home-container" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>

            <div className="container max-w-4xl">
                <div className="box p-8 backdrop-blur-xl bg-opacity-80">
                    <div className="text-center mb-8">
                        <h1 className="hero-title text-5xl mb-4">Get in Touch</h1>
                        <p className="text-xl text-muted">We're here to help with your Doomlings Companion App experience!</p>
                    </div>

                    <div className="nav mb-8">
                        <button
                            className={`nav-button ${activeTab === 'contact' ? 'is-primary' : 'is-light'}`}
                            onClick={() => setActiveTab('contact')}
                        >
                            📧 Contact Us
                        </button>
                        <button
                            className={`nav-button ${activeTab === 'faq' ? 'is-primary' : 'is-light'}`}
                            onClick={() => setActiveTab('faq')}
                        >
                            ❓ FAQ
                        </button>
                        <button
                            className={`nav-button ${activeTab === 'support' ? 'is-primary' : 'is-light'}`}
                            onClick={() => setActiveTab('support')}
                        >
                            🛠️ Support
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'contact' && (
                            <div>
                                <form className="grid-1 max-w-xl mx-auto" onSubmit={handleSubmit}>
                                    <div className="field">
                                        <label className="label" htmlFor="name">Your Name *</label>
                                        <input className="input" type="text" id="name" name="name" required />
                                    </div>

                                    <div className="field">
                                        <label className="label" htmlFor="email">Your Email *</label>
                                        <input className="input" type="email" id="email" name="email" required />
                                    </div>

                                    <div className="field">
                                        <label className="label" htmlFor="category">Category</label>
                                        <div className="dropdown-wrapper">
                                            <select className="styled-select" id="category" name="category">
                                                <option value="general">General Inquiry</option>
                                                <option value="bug">Bug Report</option>
                                                <option value="feature">Feature Request</option>
                                                <option value="help">Need Help</option>
                                                <option value="feedback">Feedback</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="field">
                                        <label className="label" htmlFor="subject">Subject *</label>
                                        <input className="input" type="text" id="subject" name="subject" required />
                                    </div>

                                    <div className="field">
                                        <label className="label" htmlFor="message">Message *</label>
                                        <textarea
                                            className="input"
                                            id="message"
                                            name="message"
                                            required
                                            style={{ minHeight: '120px' }}
                                            placeholder="Please describe your question, issue, or feedback in detail..."
                                        ></textarea>
                                    </div>

                                    <button type="submit" className="button is-primary w-full">Send Message</button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'faq' && (
                            <div className="grid-1 max-w-2xl mx-auto">
                                <h2 className="section-title text-center">Frequently Asked Questions</h2>
                                {faqs.map((faq, index) => (
                                    <div key={index} className="box p-0 overflow-hidden mb-4">
                                        <div className="p-4 bg-opacity-10 bg-white font-bold border-b border-white border-opacity-10">
                                            {faq.question}
                                        </div>
                                        <div className="p-4 text-muted">
                                            {faq.answer}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'support' && (
                            <div className="text-center">
                                <h2 className="section-title">Support & Resources</h2>
                                <p className="text-muted mb-8">
                                    Here are the different ways you can get help with the Doomlings Companion App:
                                </p>

                                <div className="grid-2 gap-6 mb-8">
                                    <div className="box p-6 hover-scale">
                                        <h3 className="section-title is-small is-secondary mb-4">📧 Email Support</h3>
                                        <p className="text-sm text-left">
                                            Send us an email at <strong>phoenix75.help@gmail.com</strong> for:
                                            <br />• Bug reports
                                            <br />• Feature requests
                                            <br />• General questions
                                            <br />• Technical issues
                                        </p>
                                    </div>

                                    <div className="box p-6 hover-scale">
                                        <h3 className="section-title is-small is-secondary mb-4">🔧 Self-Help</h3>
                                        <p className="text-sm text-left">
                                            Many issues can be resolved by:
                                            <br />• Refreshing the app
                                            <br />• Clearing browser cache
                                            <br />• Checking the FAQ section
                                            <br />• Reviewing app settings
                                        </p>
                                    </div>

                                    <div className="box p-6 hover-scale">
                                        <h3 className="section-title is-small is-secondary mb-4">📱 App Issues</h3>
                                        <p className="text-sm text-left">
                                            If the app isn't working properly:
                                            <br />• Try refreshing the page
                                            <br />• Check your browser compatibility
                                            <br />• Ensure JavaScript is enabled
                                            <br />• Contact us with details
                                        </p>
                                    </div>

                                    <div className="box p-6 hover-scale">
                                        <h3 className="section-title is-small is-secondary mb-4">💡 Feature Ideas</h3>
                                        <p className="text-sm text-left">
                                            Have ideas for improvements?
                                            <br />• We love user feedback!
                                            <br />• Send us your suggestions
                                            <br />• Tell us what features you need
                                            <br />• Help shape the app's future
                                        </p>
                                    </div>
                                </div>

                                <div className="box p-6 bg-opacity-20 bg-success border-success">
                                    <h3 className="section-title is-small is-success mb-2">🚀 Latest Features</h3>
                                    <p className="text-muted">
                                        We recently added local multiplayer sync and a modular game engine! 
                                        More updates coming soon.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="text-center mt-8">
                    <Link href="/" className="button is-light">🏠 Home</Link>
                </div>
            </div>
        </div>
    );
};

export default ContactPage; 