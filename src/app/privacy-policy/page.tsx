import React from 'react';

const PrivacyPolicyPage = () => {
    return (
        <>
            <style jsx>{`
                .privacy-container {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 8px;
                    color: #333;
                }
                h1, h2 {
                    color: #333;
                }
            `}</style>
            <div className="privacy-container">
                <h1>Privacy Policy</h1>
                <p>Last updated: March 31, 2025</p>

                <h2>Overview</h2>
                <p>This Privacy Policy describes how the Doomlings App handles your information. We are committed to protecting your privacy and want to be clear that we do not collect or share any personal information.</p>

                <h2>Information Collection</h2>
                <p>We do not collect any personal information from our users. The app functions entirely locally on your device.</p>

                <h2>Information Sharing</h2>
                <p>Since we do not collect any information, we do not share any personal data with third parties.</p>

                <h2>Data Storage</h2>
                <p>Any game data or preferences are stored locally on your device and are not transmitted to any external servers.</p>

                <h2>Changes to This Policy</h2>
                <p>We may update this privacy policy from time to time. We will notify users of any changes by updating the "Last updated" date at the top of this policy.</p>

                <h2>Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us.</p>
            </div>
        </>
    );
};

export default PrivacyPolicyPage; 