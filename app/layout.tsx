import localFont from 'next/font/local';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const inter = localFont({
  src: [
    {
      path: './fonts/inter-latin-wght-normal.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansJp = localFont({
  src: [
    {
      path: './fonts/noto-sans-jp-japanese-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/noto-sans-jp-japanese-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/noto-sans-jp-japanese-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/noto-sans-jp-japanese-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

const zenKakuGothicNew = localFont({
  src: [
    {
      path: './fonts/zen-kaku-gothic-new-japanese-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-zen-kaku-gothic-new',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://donation-portal.pages.dev'),
  title: {
    default: 'Donation Portal',
    template: '%s | Donation Portal',
  },
  description: 'Discord コミュニティ向け寄付ポータルの公式 React UI。',
  openGraph: {
    title: 'Donation Portal',
    description: 'Discord コミュニティ向け寄付ポータル React UI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja" data-force-glass="true">
      <body
        className={`${inter.variable} ${notoSansJp.variable} ${zenKakuGothicNew.variable} min-h-screen bg-root text-foreground antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
