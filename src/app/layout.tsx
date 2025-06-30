import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import UIScaler from "@/components/UIScaler";
import AmbientEffects from "@/components/AmbientEffects";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Doomlings",
  description: "A digital companion for the Doomlings card game.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

