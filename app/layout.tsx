import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://donation-portal.pages.dev'),
  title: {
    default: 'Donation Portal',
    template: '%s | Donation Portal',
  },
  description: 'Discord コミュニティ向け寄附ポータルの公式 React UI。',
  openGraph: {
    title: 'Donation Portal',
    description: 'Discord コミュニティ向け寄附ポータル React UI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-root font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
