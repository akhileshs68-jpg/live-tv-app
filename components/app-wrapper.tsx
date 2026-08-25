'use client';

import type { ReactNode } from 'react';
import { Navigation, DesktopNavigation } from './navigation';
import { ThemeProvider } from './theme-provider';
import { OTTProvider } from '@/contexts/ott-context';
import { ErrorBoundary } from './error-boundary';

export function AppWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <OTTProvider>
        <ErrorBoundary>
          <div className="min-h-screen flex flex-col bg-background text-foreground pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            <DesktopNavigation />
            <main className="flex-1">{children}</main>
            <Navigation />
          </div>
        </ErrorBoundary>
      </OTTProvider>
    </ThemeProvider>
  );
}
