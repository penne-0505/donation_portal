# 現状UI vs 新UI案 比較

## 1. ファイル構成の違い

### 現状（`app/` + `components/`）
```
app/
  ├── (app-shell)/
  │   ├── layout.tsx （AppShellでラップ）
  │   ├── page.tsx （ホーム）
  │   ├── donate/page.tsx
  │   ├── donors/page.tsx
  │   └── thanks/page.tsx
  └── new/ （実験用）
      └── donate/, donors/, thanks/

components/
  ├── app-shell.tsx （全ページ共通レイアウト）
  ├── pages/
  │   ├── donate-page.tsx （既存実装）
  │   ├── donors-page.tsx （既存実装）
  │   ├── home-page.tsx
  │   └── thanks-page.tsx
  └── ui/
      ├── button.tsx
      ├── card.tsx
      └── checkbox.tsx
```

### 新UI案（`_new_ui_draft/app/`）
```
_new_ui_draft/
  ├── app/
  │   ├── layout.tsx （Theme Provider + metadata）
  │   ├── page.tsx （ホーム）
  │   ├── donate/page.tsx
  │   ├── thanks/page.tsx
  │   ├── donors/page.tsx
  │   ├── privacy/page.tsx （新規追加）
  │   ├── api/ （API routes！Next.js 13+ App Router）
  │   │   ├── auth/discord/route.ts
  │   │   ├── auth/discord/callback/route.ts
  │   │   ├── checkout/session/route.ts
  │   │   └── donors/route.ts
  │   └── globals.css
  └── components/
      ├── theme-provider.tsx
      ├── pages/
      │   ├── donate-page.tsx （新実装）
      │   ├── thanks-page.tsx
      │   ├── donors-page.tsx （新実装）
      │   └── privacy-page.tsx （新規）
      ├── ui/ （豊富なプリセット集）
      │   ├── button.tsx, card.tsx, checkbox.tsx, ...
      │   ├── accordion, alert, badge, breadcrumb
      │   ├── dialog, drawer, dropdown-menu, form
      │   ├── spinner, toast, toaster, sonner
      │   └── ...（全60+コンポーネント）
      ├── donation-card.tsx
      ├── consent-toggle.tsx
      ├── discord-login-button.tsx
      ├── confetti-celebration.tsx
      └── animated-background.tsx
```

---

## 2. 技術的な違い

### 現状実装
- **APIルート**: Pages Functions に統一（`functions/` ディレクトリ）
- **フック**: `useSession`, `useConsentMutation`, `useCheckout` など自作フック
- **状態管理**: React hooks のみ
- **UI Components**: 最小限（button, card, checkbox のみ）
- **スタイリング**: 独自CSS + Tailwind
- **レイアウト**: AppShell でラップ

### 新UI案
- **APIルート**: Next.js App Router 形式の `app/api/` ルート
  - `/api/auth/discord`
  - `/api/auth/discord/callback`
  - `/api/checkout/session`
  - `/api/donors`
- **フック**: より細かい実装（`use-mobile`, `use-toast` など）
- **UI Components**: 豊富なプリセット（shadcn/ui 相当の60+コンポーネント）
- **スタイリング**: Tailwind CSS 中心、複数の UI ライブラリが組み込まれている
- **レイアウト**: 独立した ThemeProvider

---

## 3. ページ実装の違い

### `/donate` ページ

**現状実装（`components/pages/donate-page.tsx`）**
- 305行
- カスタムフック多用：`useSession`, `useConsentMutation`, `useCheckout`
- Stripe Checkout プリセット（複数額）
- Donation Impact コンポーネント
- 既存フロントエンド中心

**新UI案（`_new_ui_draft/components/pages/donate-page.tsx`）**
- 220行
- より簡潔
- Props で `session` を受け取る設計（SSR 考慮？）
- `DonationType` (onetime | monthly | yearly) で型安全
- `DonationCard`, `ConsentToggle`, `DiscordLoginButton` など専用コンポーネント
- `AnimatedBackground` の活用
- モック実装（`handleMockLogin`, alert など）

### `/donors` ページ

**現状実装（`components/pages/donors-page.tsx`）**
- 199行
- `useDonors` フック で寄付者取得
- 同意管理・撤回機能
- ロール UI が統合

**新UI案（`_new_ui_draft/components/pages/donors-page.tsx`）**
- 165行
- `fetch` で直接 `/api/donors` を呼び出し
- ソート機能（desc / asc / random）
- より視覚的なソート UI（`getSortLabel`, `getSortIcon`）
- Cookie からセッション情報を読み取る実装

---

## 4. UI/UX の主な改善点

### スタイル・ビジュアル
- **AnimatedBackground**: 背景アニメーション導入
- **DonationCard**: Glassmorphism + グラデーション + glow 効果
- **DiscordLoginButton**: 紫色の glow + 専用デザイン
- **ConsentToggle**: スムーズなトグルアニメーション

### インタラクション
- **Confetti Celebration**: 寄付成功時の演出
- **ホバー効果**: Card elevation + glow intensity
- **ローディング**: Spinner コンポーネント

### レスポンシブ
- Mobile 優先設計
- `use-mobile` フック で デバイス判定

---

## 5. コンポーネント化の度合い

### 現状
- **汎用**: Button, Card, Checkbox（3種類）
- **ドメイン固有**: DonationImpact, DonorPill
- **ページ**: DonatePage, DonorsPage, ThanksPage, HomePage

### 新UI案
- **汎用**: 60+ の UI コンポーネント（shadcn/ui のプリセット集）
  - Form 関連: Input, Textarea, Select, Checkbox, Radio, Toggle
  - Dialog/Modal: Dialog, Drawer, AlertDialog, Popover, HoverCard
  - Navigation: Tabs, Breadcrumb, Pagination, NavigationMenu
  - Display: Avatar, Badge, Table, Progress, Spinner
  - Feedback: Toast, Sonner (toast library)
- **ドメイン固有**: DonationCard, ConsentToggle, DiscordLoginButton, AnimatedBackground, ConfettiCelebration
- **ページ**: DonatePage, DonorsPage, ThanksPage, PrivacyPage

---

## 6. API 設計の違い

### 現状（Pages Functions）
```
POST /api/checkout/session        → Stripe Checkout Session 作成
POST /api/webhooks/stripe         → Webhook 処理
GET  /api/donors                  → 同意者リスト取得
GET  /oauth/start                 → OAuth フロー開始
GET  /oauth/callback              → OAuth コールバック
POST /api/consent                 → 同意情報更新
```

### 新UI案（App Router API Route）
```
POST /api/auth/discord            → OAuth 開始
GET  /api/auth/discord/callback   → OAuth コールバック
POST /api/checkout/session        → Checkout Session 作成
GET  /api/donors                  → 同意者リスト取得
```

---

## 7. 状態管理・セッション

### 現状
- **フック**: `useSession` で 状態を管理
- **セッション形式**: 名前は `session.displayName`, 同意は `session.consentPublic`

### 新UI案
- **Props 経由**: `session` を Props で受け取り
- **セッション形式**: `session.display_name`, `session.consent_public`（スネークケース）
- **Cookie**: `sess=` という Cookie から手動で JSON パース

---

## 8. 将来への示唆

新UI案の特徴：
1. **Next.js App Router への本格移行**：`functions/` ではなく `app/api/` を使用
2. **豊富な UI プリセット**：shadcn/ui 相当の充実したコンポーネント集
3. **より細かい専用コンポーネント化**：DonationCard, ConsentToggle など
4. **ビジュアル演出の充実**：AnimatedBackground, ConfettiCelebration
5. **モバイル優先**：`use-mobile` フック で デバイス判定
6. **更新頻度の高い実装**：Toast, Spinner など UX 改善コンポーネント
