import { useEffect } from 'react';
import { useNotification } from '@/lib/notification-context';

export default function CapacitorProvider() {
  const { showNotification } = useNotification();
  useEffect(() => {
    // Check if we're running in a native Capacitor environment
    const isNative = typeof window !== 'undefined' && 
                     window.Capacitor && 
                     window.Capacitor.isNativePlatform && 
                     window.Capacitor.isNativePlatform();

    if (isNative) {
      // Handle native app rating logic
      const handleAppRating = () => {
        const counter = parseInt(localStorage.getItem('launch_count') || '0', 10) + 1;
        localStorage.setItem('launch_count', counter.toString());

        const rated = localStorage.getItem('rated');
        const maybeLater = parseInt(localStorage.getItem('maybe_later') || '0', 10);

        if (rated === 'true') {
          return;
        }

        // Simple web-based prompt for rating (fallback)
        if (counter === 3 || (maybeLater > 0 && counter - maybeLater >= 5)) {
          showNotification({
            title: 'Enjoying the app?',
            message: 'Are you enjoying the DOOMlings Companion app? Would you like to rate it on the Play Store?',
            type: 'success',
            confirmText: 'Rate Now',
            cancelText: 'Maybe Later',
            onConfirm: () => {
              localStorage.setItem('rated', 'true');
              window.open('https://play.google.com/store/apps/details?id=com.doomlings.companion', '_blank');
            }
          });
          
          if (!localStorage.getItem('rated')) {
             localStorage.setItem('maybe_later', counter.toString());
          }
        }
      };

      handleAppRating();
    }
  }, []);

  return null; // This component doesn't render anything
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
    };
  }
}