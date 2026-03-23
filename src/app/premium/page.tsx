'use client';

import React from 'react';
import { PremiumSection } from '@/components/PremiumSection';

export default function PremiumPage() {
    return (
        <div className="home-container min-h-screen py-8 px-4 flex items-center justify-center">
            <div className="container max-w-2xl">
                <PremiumSection />
            </div>
        </div>
    );
}
