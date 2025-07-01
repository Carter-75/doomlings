'use client';

import { useEffect } from 'react';
import { AppRate } from '@awesome-cordova-plugins/app-rate';
import { Capacitor } from '@capacitor/core';
import "./globals.css";
import { Inter } from "next/font/google";
import UIScaler from "@/components/UIScaler";
import AmbientEffects from "@/components/AmbientEffects";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      AppRate.setPreferences({
        storeAppURL: {
          android: 'market://details?id=com.doomlings.companion',
        },
        customLocale: {
          title: 'Would you want to rate us?',
          message: 'What do you think we deserve?',
          cancelButtonLabel: 'Maybe Later',
          rateButtonLabel: '5 Stars!!!',
        },
        callbacks: {
          onRateDialogShow: function() {
            console.log('rate dialog shown!');
          },
          onButtonClicked: function(buttonIndex: number) {
            console.log('Selected index: ' + buttonIndex);
            if (buttonIndex === 2) {
                const currentLaunches = parseInt(localStorage.getItem('launch_count') || '0', 10);
                localStorage.setItem('maybe_later', currentLaunches.toString());
            } else if (buttonIndex === 1) {
              localStorage.setItem('rated', 'true');
            }
          }
        },
      });

      const handlePrompt = () => {
        const counter = parseInt(localStorage.getItem('launch_count') || '0', 10) + 1;
        localStorage.setItem('launch_count', counter.toString());

        const rated = localStorage.getItem('rated');
        const maybeLater = parseInt(localStorage.getItem('maybe_later') || '0', 10);

        if (rated === 'true') {
          return;
        }

        if (maybeLater > 0) {
            const launchesSinceMaybe = counter - maybeLater;
            if (launchesSinceMaybe >= 3) {
                 localStorage.removeItem('maybe_later');
                 AppRate.promptForRating(true);
            }
            return;
        }

        if (counter === 2) {
          AppRate.promptForRating(true);
        }
      };

      handlePrompt();
    }
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <UIScaler />
        <AmbientEffects />
        {children}
      </body>
    </html>
  );
}

