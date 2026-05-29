'use client';

import type { ReactNode } from 'react';
import { Navigation, DesktopNavigation } from './navigation';
import { ThemeProvider } from './theme-provider';
import { OTTProvider } from '@/contexts/ott-context';

export function AppWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <OTTProvider>
        <DesktopNavigation />
        {children}
        <Navigation />
      </OTTProvider>
    </ThemeProvider>
  );
}
