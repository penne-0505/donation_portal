import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';

export default function AppShellLayout({ children }: { readonly children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
