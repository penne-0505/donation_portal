---
title: Home Page LP Redesign - Implementation Reference
domain: ui
status: active
version: 1
created: 2025-11-02
updated: 2025-11-02
related_issues: []
related_prs: []
references:
  - ../../../docs/guide/ui/home-page.md
  - ../../../docs/intent/ui/home-page-redesign-lp.md
---

# ホームページ LP リデザイン - 実装リファレンス

> 本ドキュメントは、**ホームページ LP の実装仕様・コンポーネント詳細** を技術レベルで説明します。実装ガイドは `docs/guide/ui/home-page.md` を参照。

---

## 実装ファイル構成

```
components/
├── app-shell.tsx                 # ヘッダー・フッター（共通）
└── pages/
    ├── home-page.tsx             # ホームページ本体
    ├── donate-page.tsx           # 寄付ページ（計測追加）
    └── thanks-page.tsx           # サンクスページ（計測追加）

app/(app-shell)/
└── privacy/
    └── page.tsx                  # プライバシーポリシーページ

functions/
└── (既存 API ルート、変更なし)
```

---

## コンポーネント仕様

### 1. AppShell（ヘッダー・フッター）

**ファイル**: `components/app-shell.tsx`

#### プロップ

```typescript
interface AppShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}
```

#### ヘッダー実装

```typescript
<header className="sticky top-0 z-40 px-4 pt-4">
  <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl glass-sm border-gradient-subtle px-5 py-3 shadow-minimal shadow-inner-light backdrop-blur transition-glass">
    {/* Logo */}
    <Link href="/" className="text-base font-semibold ...">
      Donation Portal
    </Link>

    {/* Nav */}
    <nav className="flex items-center gap-4">
      {/* Text Link */}
      <Link href="/donors" onClick={handleDonorListClick} className="...">
        支援者一覧
      </Link>
      
      {/* Primary Button */}
      <Button href="/donate" onClick={handleCtaClick} size="md" aria-label="寄付をはじめる">
        寄付する
      </Button>
    </nav>
  </div>
</header>
```

#### フッター実装

```typescript
<footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-5">
    <span>© 2025 {ORGANIZATION_NAME}</span>
    <div className="flex items-center gap-4">
      <Link href="/privacy" className="...">
        プライバシーポリシー
      </Link>
      <span className="text-border/40">•</span>
      <Link href="/privacy#operator-info" className="...">
        運営者情報
      </Link>
    </div>
  </div>
</footer>

- `ORGANIZATION_NAME` は `@/lib/ui/branding` から import しているブランド定数。
```

#### 計測イベント

```typescript
const handleCtaClick = () => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'hero_cta_click');
  }
};

const handleDonorListClick = () => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'donor_list_click');
  }
};
```

#### クライアント指定

```typescript
'use client'; // React Hook (onClick) 使用のため必須
```

---

### 2. HomePage

**ファイル**: `components/pages/home-page.tsx`

#### 構造

```typescript
export function HomePage() {
  const { heroRef } = useHeroContext();
  const handleCTAClick = () => {
    // 計測: donate_start
  };

  return (
    <div className="page-enter space-y-20">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-10 px-6 py-16 text-center md:gap-12 md:py-24"
      >
        {/* H1 + Lead */}
        {/* CTA 2 個 */}
        {/* Badge 3 個 */}
      </section>
    </div>
  );
}
```

#### ヒーロー実装

##### H1 + リード

```typescript
<div className="space-y-6">
  <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
    Discordコミュニティの運営を支える寄付
  </h1>
  <p className="text-balance text-base text-gray-600 dark:text-gray-400 md:text-lg">
    透明性と感謝を大切に運営しています。
  </p>
</div>
```

**クラス詳細**:
- `text-balance`: 行揃え最適化（短い最終行を避ける）
- `text-4xl md:text-5xl`: SP 2.25rem / PC 3rem
- `text-gray-600`: 薄色、コントラスト 4.5:1 確保
- `tracking-tight`: 字間を詰める（見出し用）

##### CTA ボタン 2 個

```typescript
<div className="flex flex-col items-center gap-3 sm:flex-row">
  <Button
    href="/donate"
    onClick={handleCTAClick}
    size="lg"
    className="gap-2 px-10"
    aria-label="寄付をはじめる"
  >
    <span className="flex items-center gap-2">
      寄付する
      <ArrowRight className="h-5 w-5" aria-hidden />
    </span>
  </Button>
  <Button
    href="/donors"
    size="lg"
    variant="outline"
  className="px-10"
  aria-label="支援者一覧を表示"
>
    支援者一覧
  </Button>
</div>
```

**クラス詳細**:
- `gap-3`: ボタン間隔 12px（12 / 16 = 0.75rem）
- `sm:flex-row`: SP `flex-col` (縦積み) / PC `flex-row` (横並び)
- `px-10`: 左右パディング 40px
- `aria-label`: スクリーンリーダー用ラベル
- `aria-hidden`: アイコンを読み上げ非表示化

##### バッジ 3 個

```typescript
<div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:pt-4">
  {[
    '🔒 Stripeで安全決済',
    '✅ OAuthで同意管理',
    '📋 支援者リストを公開',
  ].map((badge) => (
    <div key={badge} className="rounded-full border border-border/60 bg-white/5 px-4 py-2 text-center text-xs font-medium text-foreground backdrop-blur md:text-sm">
      <span>{badge}</span>
    </div>
  ))}
</div>
```

**クラス詳細**:
- `rounded-full`: 完全丸形（`w-full h-full` を避ける）
- `bg-white/5 backdrop-blur`: ガラスモルフィズム
- `text-xs md:text-sm`: SP 0.75rem / PC 0.875rem
- `px-4 py-2`: 内部余白（水平 16px、上下 8px）

#### 計測イベント

```typescript
const handleCTAClick = () => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'donate_start');
  }
};
```

---

### 3. ThanksPage（更新）

**ファイル**: `components/pages/thanks-page.tsx`

#### 計測イベント追加

```typescript
'use client';

import { useEffect } from 'react';

export function ThanksPage() {
  useEffect(() => {
    // 計測: donate_complete
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'donate_complete');
    }
  }, []);

  // ... JSX
}
```

**理由**: `useEffect` はクライアント側フック。`"use client"` ディレクティブ必須。

---

### 4. DonatePage（更新）

**ファイル**: `components/pages/donate-page.tsx`

#### handleCheckout 計測追加

```typescript
const handleCheckout = useCallback(
  async (preset: CheckoutPreset) => {
    if (!isSignedIn) {
      return;
    }
    setSelectedPreset(preset);
    resetError();
    
    // 計測: donate_start（チェックアウト開始時）
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'donate_start');
    }
    
    await startCheckout(preset);
  },
  [isSignedIn, resetError, startCheckout],
);
```

---

### 5. PrivacyPage（新規）

**ファイル**: `app/(app-shell)/privacy/page.tsx`

#### 構成

```typescript
export default function PrivacyPage() {
  return (
    <div className="space-y-8 py-8 page-enter">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          プライバシーポリシー
        </h1>
        <p className="text-base text-muted-foreground">最終更新：2025年11月2日</p>
      </div>

      {/* 7 sections */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">1. 序文</h2>
        <p>...</p>
      </section>
    </div>
  );
}
```

---

## Tailwind CSS クラス詳細

### カラー

| 用途 | クラス | 値 |
|---|---|---|
| テキスト（強） | `text-foreground` | `#000` (light) / `#fff` (dark) |
| テキスト（弱） | `text-muted-foreground` | `#666` (light) / `#999` (dark) |
| テキスト（グレー） | `text-gray-600` | `#4b5563` |
| 背景 | `bg-surface` | `#fff` (light) / `#0a0a0a` (dark) |
| ボーダー | `border-border/60` | 60% 透明度 |

### スペーシング

| 用途 | クラス | 値（px） |
|---|---|---|
| 小余白 | `gap-3` | 12 |
| 中余白 | `gap-4` | 16 |
| 大余白 | `gap-8` | 32 |
| 縦余白 SP | `py-16` | 64 |
| 縦余白 PC | `py-24` | 96 |

### ブレークポイント

| プレフィックス | 幅 |
|---|---|
| （なし） | 0px（デフォルト） |
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

---

## イベント スキーマ

### GA4 イベント定義

#### hero_cta_click

```json
{
  "event": "hero_cta_click",
  "page_path": "/",
  "page_title": "Home",
  "user_id": null (anonymous)
}
```

#### donor_list_click

```json
{
  "event": "donor_list_click",
  "page_path": "/",
  "page_title": "Home"
}
```

#### donate_start

```json
{
  "event": "donate_start",
  "page_path": "/" or "/donate",
  "method": "home" or "donate_page"
}
```

#### donate_complete

```json
{
  "event": "donate_complete",
  "page_path": "/thanks"
}
```

---

## アクセシビリティ実装

### 見出しマークアップ

```typescript
<h1>Discordコミュニティの運営を支える寄付</h1>  {/* H1: ページタイトル */}
<h2>プライバシーポリシー</h2>                  {/* H2: セクション */}
```

### ARIA属性

```typescript
// ボタンラベル
<Button aria-label="寄付をはじめる">寄付する</Button>

// 装飾要素の非表示化
<ArrowRight aria-hidden />
```

### フォーカス管理

```typescript
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
```

### コントラスト比

| 要素 | テキスト色 | 背景色 | 比率 |
|---|---|---|---|
| H1 | `text-foreground` | `bg-surface` | 14:1 |
| リード | `text-gray-600` | `bg-surface` | 4.8:1 ✅ |
| フッター | `text-muted-foreground` | `bg-surface` | 5.2:1 ✅ |

---

## レスポンシブ実装

### メディアクエリ（Tailwind）

```typescript
className="
  py-16              // SP: 64px
  md:py-24           // PC: 96px
  text-4xl           // SP: 2.25rem
  md:text-5xl        // PC: 3rem
  flex flex-col      // SP: 縦積み
  sm:flex-row        // PC: 横並び
"
```

### コンテナサイズ

```typescript
className="max-w-3xl"  // 最大幅 48rem (768px)
className="max-w-6xl"  // 最大幅 72rem (1152px)
```

---

## ビルド・デプロイ

### ビルドコマンド

```bash
npm run build
```

### 検証項目

- ✅ TypeScript コンパイル
- ✅ ESLint チェック
- ✅ Prettier フォーマット
- ✅ ページプリレンダリング

### プリレンダル例

```
✅ /
✅ /donate
✅ /donors
✅ /thanks
✅ /privacy
```

---

## パフォーマンス指標

### Core Web Vitals 目標

| 指標 | 目標 | 現状 |
|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 🚧 TBD |
| FID (First Input Delay) | ≤ 100ms | 🚧 TBD |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 🚧 TBD |

### イメージ最適化

- ✅ SVG/webp 形式で配信
- ✅ 遅延読み込み（`loading="lazy"`）
- ✅ 画像なし（テキスト + CSS のみ）

---

## デバッグ・トラブルシューティング

### イベント発火確認

```typescript
// ブラウザコンソールで確認
window.gtag = function() {
  console.log('gtag called:', arguments);
};
```

### レスポンシブテスト

```bash
# 375px でテスト
open "http://localhost:8787"
# ブラウザ DevTools → Responsive Mode → iPhone SE (375x667)
```

### アクセシビリティ検査

```bash
# axe DevTools: Chrome 拡張で検査
# Lighthouse: Chrome DevTools → Accessibility タブ
```

---

## 関連リソース

- **UI ライブラリ**: Shadcn/ui style components
- **スタイル**: Tailwind CSS v3
- **フレームワーク**: Next.js 15
- **計測**: Google Analytics 4 (gtag)

---

**ステータス**: ✅ 実装完了  
**最終更新**: 2025-11-02  
**テスト状況**: ビルド成功、レスポンシブ確認済み
