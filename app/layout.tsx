import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppWrapper } from "@/components/app-wrapper";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Watch & Earn - Reward Coins Platform",
  description: "Earn reward coins by watching videos, completing tasks, and referrals. Secure wallet with real-time tracking and leaderboard competition.",
  keywords: "earn coins, rewards, watch videos, crypto rewards, gamification",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#9333ea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <AuthProvider>
            <AppWrapper>{children}</AppWrapper>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
