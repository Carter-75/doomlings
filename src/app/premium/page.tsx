'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumSection } from '@/components/PremiumSection';
import { MONETIZATION_DISABLED } from '@/lib/monetization-config';

export default function PremiumPage() {
    const router = useRouter();

    useEffect(() => {
        if (MONETIZATION_DISABLED) {
            router.replace('/');
        }
    }, [router]);

    if (MONETIZATION_DISABLED) {
        return null;
    }

    return (
        <div className="home-container min-h-screen py-8 px-4 flex items-center justify-center">
            <div className="container max-w-2xl">
                <PremiumSection />
            </div>
        </div>
    );
}
