import "./globals.css";
import { Outfit } from "next/font/google";
import { IframeProvider } from "@/lib/iframe-context";
import { IframeWrapper } from "@/components/iframe-wrapper";
import { BackHandler } from "@/components/back-handler";
import { AdProvider } from "@/lib/ad-context";
import { ThemeProvider } from "@/lib/theme-context";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

const outfitFont = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

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
        {/* Content Security Policy — allows card artwork images to load from the
            Webflow CDN (cdn.prod.website-files.com) inside Capacitor's WebView.
            Without an explicit img-src directive the Android WebView may block
            cross-origin image requests, causing every card to show the ? fallback. */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' https: data: blob:; connect-src 'self' https: wss:; font-src 'self' https: data:;"
        />
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
      <body className={`${outfitFont.className} ${outfitFont.variable}`}>
        <ThemeProvider>
          <IframeProvider>
            <AdProvider>
              <IframeWrapper>
                <BackHandler />
                {children}
                <div className="ad-space-placeholder" style={{ width: '100%', height: 'var(--ad-banner-height)', display: 'block', flexShrink: 0, pointerEvents: 'none' }} />
              </IframeWrapper>
            </AdProvider>
          </IframeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
