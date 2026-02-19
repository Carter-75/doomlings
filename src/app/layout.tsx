import "./globals.css";
import { Inter } from "next/font/google";
import { IframeProvider } from "@/lib/iframe-context";
import { IframeWrapper } from "@/components/iframe-wrapper";
import { BackHandler } from "@/components/back-handler";

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
  return (
    <html lang="en">
      <body className={inter.className}>
        <IframeProvider>
          <IframeWrapper>
            <BackHandler />
            {children}
          </IframeWrapper>
        </IframeProvider>
      </body>
    </html>
  );
}

