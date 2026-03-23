'use client';

import React from 'react';
import { PremiumSection } from '@/components/PremiumSection';

export default function PremiumPage() {
    return (
        <div className="home-container" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
            <div className="container max-w-2xl px-4 flex items-center justify-center">
                <PremiumSection />
            </div>
        </div>
    );
}
