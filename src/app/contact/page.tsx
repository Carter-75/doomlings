'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';

const ContactPage = () => {
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
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
            setStatus({ message: "Opening your email client...", type: 'success' });

            setTimeout(() => {
                form.reset();
                setStatus({ message: '', type: '' });
            }, 3000);
        } catch (error) {
            setStatus({ message: "Error opening email client. Please try again.", type: 'error' });
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
        <>
            <style jsx>{`
                .contact-container {
                    max-width: 900px;
                    margin: 40px auto;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.8);
                    border-radius: 15px;
                    box-shadow: 0 0 30px rgba(0, 157, 255, 0.3);
                }

                .contact-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .contact-header h1 {
                    color: #00ff88;
                    font-size: 2.5em;
                    margin-bottom: 10px;
                    text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
                }

                .contact-header p {
                    color: #ccc;
                    font-size: 1.1em;
                }

                .tab-navigation {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 30px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .tab-button {
                    background: none;
                    border: none;
                    color: #ccc;
                    padding: 15px 25px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    border-bottom: 3px solid transparent;
                }

                .tab-button.active {
                    color: #3c82f7;
                    border-bottom-color: #3c82f7;
                }

                .tab-button:hover {
                    color: #00ff88;
                }

                .tab-content {
                    min-height: 400px;
                }

                .contact-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    color: #fff;
                    font-size: 16px;
                    font-weight: bold;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 12px;
                    border: 2px solid rgba(60, 130, 247, 0.3);
                    border-radius: 8px;
                    background: rgba(0, 0, 0, 0.5);
                    color: #fff;
                    font-size: 16px;
                    transition: border-color 0.3s ease;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #3c82f7;
                    box-shadow: 0 0 10px rgba(60, 130, 247, 0.3);
                }

                .form-group textarea {
                    min-height: 120px;
                    resize: vertical;
                }

                .submit-btn {
                    background: linear-gradient(45deg, #3c82f7, #00ff88);
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    transition: transform 0.2s, box-shadow 0.2s;
                    margin-top: 10px;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(60, 130, 247, 0.4);
                }

                .status-message {
                    text-align: center;
                    margin-top: 20px;
                    padding: 15px;
                    border-radius: 8px;
                    font-weight: bold;
                }

                .status-message.success {
                    background-color: rgba(0, 255, 136, 0.2);
                    color: #00ff88;
                    border: 1px solid rgba(0, 255, 136, 0.3);
                }

                .status-message.error {
                    background-color: rgba(255, 68, 68, 0.2);
                    color: #ff4444;
                    border: 1px solid rgba(255, 68, 68, 0.3);
                }

                .faq-section {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .faq-item {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(60, 130, 247, 0.2);
                    border-radius: 8px;
                    margin-bottom: 15px;
                    overflow: hidden;
                }

                .faq-question {
                    background: rgba(60, 130, 247, 0.1);
                    padding: 20px;
                    color: #fff;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.3s ease;
                    border: none;
                    width: 100%;
                    text-align: left;
                    font-size: 16px;
                }

                .faq-question:hover {
                    background: rgba(60, 130, 247, 0.2);
                }

                .faq-answer {
                    padding: 20px;
                    color: #e0e0e0;
                    line-height: 1.6;
                    border-top: 1px solid rgba(60, 130, 247, 0.1);
                }

                .support-section {
                    max-width: 700px;
                    margin: 0 auto;
                    text-align: center;
                }

                .support-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 30px 0;
                }

                .support-card {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(60, 130, 247, 0.3);
                    border-radius: 10px;
                    padding: 25px;
                    text-align: center;
                    transition: transform 0.3s ease;
                }

                .support-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(60, 130, 247, 0.2);
                }

                .support-card h3 {
                    color: #3c82f7;
                    margin-bottom: 15px;
                    font-size: 1.3em;
                }

                .support-card p {
                    color: #ccc;
                    line-height: 1.6;
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
                    .contact-container {
                        margin: 20px;
                        padding: 15px;
                    }
                    
                    .contact-header h1 {
                        font-size: 2em;
                    }

                    .tab-navigation {
                        flex-direction: column;
                    }

                    .tab-button {
                        padding: 10px;
                    }

                    .support-grid {
                        grid-template-columns: 1fr;
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

            <div className="container">
                <div className="contact-container">
                    <div className="contact-header">
                        <h1>Get in Touch</h1>
                        <p>We're here to help with your Doomlings Companion App experience!</p>
                    </div>

                    <div className="tab-navigation">
                        <button 
                            className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
                            onClick={() => setActiveTab('contact')}
                        >
                            📧 Contact Us
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'faq' ? 'active' : ''}`}
                            onClick={() => setActiveTab('faq')}
                        >
                            ❓ FAQ
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'support' ? 'active' : ''}`}
                            onClick={() => setActiveTab('support')}
                        >
                            🛠️ Support
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'contact' && (
                            <div>
                                <form className="contact-form" onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="name">Your Name *</label>
                                        <input type="text" id="name" name="name" required />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">Your Email *</label>
                                        <input type="email" id="email" name="email" required />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="category">Category</label>
                                        <select id="category" name="category">
                                            <option value="general">General Inquiry</option>
                                            <option value="bug">Bug Report</option>
                                            <option value="feature">Feature Request</option>
                                            <option value="help">Need Help</option>
                                            <option value="feedback">Feedback</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="subject">Subject *</label>
                                        <input type="text" id="subject" name="subject" required />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="message">Message *</label>
                                        <textarea 
                                            id="message" 
                                            name="message" 
                                            required
                                            placeholder="Please describe your question, issue, or feedback in detail..."
                                        ></textarea>
                                    </div>

                                    <button type="submit" className="submit-btn">Send Message</button>
                                </form>

                                {status.message && (
                                    <div className={`status-message ${status.type}`}>
                                        {status.message}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'faq' && (
                            <div className="faq-section">
                                <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '30px' }}>
                                    Frequently Asked Questions
                                </h2>
                                {faqs.map((faq, index) => (
                                    <div key={index} className="faq-item">
                                        <button className="faq-question">
                                            {faq.question}
                                        </button>
                                        <div className="faq-answer">
                                            {faq.answer}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'support' && (
                            <div className="support-section">
                                <h2 style={{ color: '#fff', marginBottom: '20px' }}>
                                    Support & Resources
                                </h2>
                                <p style={{ color: '#ccc', marginBottom: '30px' }}>
                                    Here are the different ways you can get help with the Doomlings Companion App:
                                </p>

                                <div className="support-grid">
                                    <div className="support-card">
                                        <h3>📧 Email Support</h3>
                                        <p>
                                            Send us an email at <strong>phoenix75.help@gmail.com</strong> for:
                                            <br />• Bug reports
                                            <br />• Feature requests  
                                            <br />• General questions
                                            <br />• Technical issues
                                        </p>
                                    </div>

                                    <div className="support-card">
                                        <h3>🔧 Self-Help</h3>
                                        <p>
                                            Many issues can be resolved by:
                                            <br />• Refreshing the app
                                            <br />• Clearing browser cache
                                            <br />• Checking the FAQ section
                                            <br />• Reviewing app settings
                                        </p>
                                    </div>

                                    <div className="support-card">
                                        <h3>📱 App Issues</h3>
                                        <p>
                                            If the app isn't working properly:
                                            <br />• Try refreshing the page
                                            <br />• Check your browser compatibility
                                            <br />• Ensure JavaScript is enabled
                                            <br />• Contact us with details
                                        </p>
                                    </div>

                                    <div className="support-card">
                                        <h3>💡 Feature Ideas</h3>
                                        <p>
                                            Have ideas for improvements?
                                            <br />• We love user feedback!
                                            <br />• Send us your suggestions
                                            <br />• Tell us what features you need
                                            <br />• Help shape the app's future
                                        </p>
                                    </div>
                                </div>

                                <div style={{ 
                                    background: 'rgba(0, 255, 136, 0.1)', 
                                    border: '1px solid rgba(0, 255, 136, 0.3)',
                                    borderRadius: '10px',
                                    padding: '20px',
                                    marginTop: '30px'
                                }}>
                                    <h3 style={{ color: '#00ff88', marginBottom: '15px' }}>
                                        🚀 Coming Soon Features
                                    </h3>
                                    <p style={{ color: '#e0e0e0' }}>
                                        We're working on exciting new features including cloud sync, 
                                        enhanced customization options, and improved mobile experience. 
                                        Stay tuned for updates!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="footer-nav">
                <Link href="/">🏠 Home</Link>
                <Link href="/privacy-policy">🔒 Privacy Policy</Link>
                <Link href="/settings">⚙️ Settings</Link>
            </div>
        </>
    );
};

export default ContactPage; 