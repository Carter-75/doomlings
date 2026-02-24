import "./globals.css";
import { Inter } from "next/font/google";
import { IframeProvider } from "@/lib/iframe-context";
import { IframeWrapper } from "@/components/iframe-wrapper";
import { BackHandler } from "@/components/back-handler";
import { AdProvider } from "@/lib/ad-context";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Doomlings Companion",
  description: "A companion app for the Doomlings board game",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const hasRealAdsense = adsenseClientId && !adsenseClientId.includes('XXXX');

  return (
    <html lang="en">
      <head>
        {/* AdSense account verification — always present on web */}
        <meta name="google-adsense-account" content="ca-pub-8347349621527130" />
        {/* Google AdSense script — website only (native app uses AdMob) */}
        {hasRealAdsense && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={inter.className}>
        <IframeProvider>
          <AdProvider>
            <IframeWrapper>
              <BackHandler />
              {children}
            </IframeWrapper>
          </AdProvider>
        </IframeProvider>
      </body>
    </html>
  );
}
