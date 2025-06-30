'use client';

import { useEffect } from 'react';

const UIScaler = () => {
    useEffect(() => {
        const applyScaling = (value: number) => {
            const scaleValue = value / 100;
            document.documentElement.style.setProperty('--ui-scale', scaleValue.toString());
        };

        const savedScaling = localStorage.getItem('uiScaling');
        const initialScale = savedScaling ? parseInt(savedScaling, 10) : 100;
        applyScaling(initialScale);
    }, []);

    return null; // This component doesn't render anything
};

export default UIScaler; 