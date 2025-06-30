'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';

const ContactPage = () => {
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const subject = (form.elements.namedItem('subject') as HTMLInputElement).value;
        const message = (form.elements.namedItem('message') as HTMLInputElement).value;

        const mailtoLink = `mailto:phoenix75.help@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;

        try {
            window.location.href = mailtoLink;
            setStatus({ message: "Opening your email client...", type: 'success' });

            setTimeout(() => {
                form.reset();
                setStatus({ message: '', type: '' });
            }, 2000);
        } catch (error) {
            setStatus({ message: "Error opening email client. Please try again.", type: 'error' });
        }
    };

    return (
        <>
            <style jsx>{`
                .contact-container {
                    max-width: 600px;
                    margin: 40px auto;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.7);
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0, 157, 255, 0.3);
                }

                .contact-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    color: #fff;
                    font-size: 16px;
                }

                .form-group input,
                .form-group textarea {
                    padding: 10px;
                    border: 1px solid rgba(0, 157, 255, 0.5);
                    border-radius: 5px;
                    background: rgba(0, 0, 0, 0.3);
                    color: #fff;
                    font-size: 16px;
                }

                .form-group textarea {
                    min-height: 150px;
                    resize: vertical;
                }

                .submit-btn {
                    background: linear-gradient(45deg, #007bff, #00ff88);
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 157, 255, 0.4);
                }

                #status-message {
                    text-align: center;
                    margin-top: 20px;
                    padding: 10px;
                    border-radius: 5px;
                }

                .success {
                    background-color: rgba(0, 255, 0, 0.2);
                    color: #00ff88;
                }

                .error {
                    background-color: rgba(255, 0, 0, 0.2);
                    color: #ff4444;
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
                    <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '30px' }}>Contact Us</h1>

                    <form id="contactForm" className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Name:</label>
                            <input type="text" id="name" name="name" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Your Email:</label>
                            <input type="email" id="email" name="email" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Subject:</label>
                            <input type="text" id="subject" name="subject" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message:</label>
                            <textarea id="message" name="message" required></textarea>
                        </div>

                        <button type="submit" className="submit-btn">Send Message</button>
                    </form>

                    {status.message && (
                        <div id="status-message" className={status.type}>
                            {status.message}
                        </div>
                    )}
                </div>
            </div>

            <footer style={{ textAlign: 'center', padding: '20px', marginTop: '40px', color: '#666' }}>
                <Link href="/" style={{ color: '#666', textDecoration: 'none', marginRight: '20px' }}>Home</Link>
                <Link href="/privacy-policy" style={{ color: '#666', textDecoration: 'none' }}>Privacy Policy</Link>
            </footer>
        </>
    );
};

export default ContactPage; 