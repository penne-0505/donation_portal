import type { ReactNode } from 'react';
import { HeroProvider } from '@/lib/ui/contexts/hero-context';
import { AppShell } from '@/components/app-shell';

export default function NewLayout({ children }: { readonly children: ReactNode }) {
  return (
    <HeroProvider>
      <AppShell>{children}</AppShell>
    </HeroProvider>
  );
}
