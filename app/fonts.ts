import localFont from 'next/font/local';

const interLatin = '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2';
const notoSansJpRegular =
  '../node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-0-400-normal.woff2';
const notoSansJpBold =
  '../node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-0-700-normal.woff2';
const zenKakuGothicBold =
  '../node_modules/@fontsource/zen-kaku-gothic-new/files/zen-kaku-gothic-new-10-700-normal.woff2';

export const inter = localFont({
  src: [
    {
      path: interLatin,
      weight: '100 900',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-inter',
  preload: false,
});

export const notoSansJp = localFont({
  src: [
    {
      path: notoSansJpRegular,
      weight: '400',
      style: 'normal',
    },
    {
      path: notoSansJpBold,
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-noto-sans-jp',
  preload: false,
});

export const zenKakuGothicNew = localFont({
  src: [
    {
      path: zenKakuGothicBold,
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-zen-kaku-gothic-new',
  preload: false,
});
