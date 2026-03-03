'use client';

import React from 'react';
import { PremiumSection } from '@/components/PremiumSection';

export default function PremiumPage() {
    return (
        <div className="home-container" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="container p-4 w-full max-w-2xl">
                <PremiumSection />
            </div>
        </div>
    );
}
