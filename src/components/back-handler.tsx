'use client';

import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';

export const BackHandler = () => {
    const router = useRouter();
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);
    const lastBackPressTime = useRef<number>(0);

    // Update the ref whenever pathname changes
    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        const handleBackButton = async () => {
            const currentTime = Date.now();
            const currentPath = pathnameRef.current;

            // Check if we are on the main page
            if (currentPath === '/') {
                if (currentTime - lastBackPressTime.current < 2000) {
                    // Double tap detected - exit app
                    App.exitApp();
                } else {
                    // First tap - show warning
                    lastBackPressTime.current = currentTime;

                    const toast = document.createElement('div');
                    toast.innerText = 'Press back again to exit';
                    toast.style.position = 'fixed';
                    toast.style.bottom = '50px';
                    toast.style.left = '50%';
                    toast.style.transform = 'translateX(-50%)';
                    toast.style.backgroundColor = 'rgba(0,0,0,0.8)';
                    toast.style.color = 'white';
                    toast.style.padding = '10px 20px';
                    toast.style.borderRadius = '20px';
                    toast.style.zIndex = '9999';
                    document.body.appendChild(toast);

                    setTimeout(() => {
                        if (document.body.contains(toast)) {
                            document.body.removeChild(toast);
                        }
                    }, 2000);
                }
            } else {
                // Not on main page - go back
                router.back();
            }
        };

        let handler: any;
        const setupListener = async () => {
            handler = await App.addListener('backButton', () => {
                handleBackButton();
            });
        };

        setupListener();

        return () => {
            if (handler) {
                handler.remove();
            }
        };
    }, [router]); // Only re-run if router changes (which is stable)

    return null;
};
