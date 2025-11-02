import { Inter, Noto_Sans_JP } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

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
    <html lang="ja" className={`${inter.variable} ${notoSansJp.variable}`}>
      <body className="min-h-screen bg-root text-foreground antialiased">{children}</body>
    </html>
  );
}
