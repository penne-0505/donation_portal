import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import './globals.css';
import { inter, notoSansJp, zenKakuGothicNew } from './fonts';

const PLATFORM_HEADER = 'x-platform-target';
const FALLBACK_PLATFORM = 'mac';

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
  const headerList = headers();
  const platform = headerList.get(PLATFORM_HEADER) ?? FALLBACK_PLATFORM;

  return (
    <html
      lang="ja"
      data-force-glass="true"
      data-platform={platform}
      className={`${inter.variable} ${notoSansJp.variable} ${zenKakuGothicNew.variable}`}
    >
      <body className="min-h-screen bg-root text-foreground antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
