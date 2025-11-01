---
title: "React UI プレビュー: /new/* ルート概要"
domain: "donation-portal"
status: "draft"
version: "0.1.0"
created: "2025-11-01"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/react-ui-integration-2025/plan.md
  - app/new/donate/page.tsx
  - app/new/donors/page.tsx
  - app/new/thanks/page.tsx
  - lib/ui/hooks/use-session.ts
  - lib/ui/hooks/use-consent.ts
  - lib/ui/hooks/use-checkout.ts
  - lib/ui/hooks/use-donors.ts
---

## 概要

Next.js (App Router) を利用した React 版 UI は `/new` プレフィックス配下で段階的に公開する。既存の Cloudflare Pages Functions (`/api/*`, OAuth フロー) をそのまま利用しつつ、クライアント側でセッション状態と同意フラグを管理する。

## ルーティング

| ルート | ファイル | 説明 |
| --- | --- | --- |
| `/new` | `app/new/page.tsx` | React UI プレビューのランディング。寄附/Donors への導線を表示。 |
| `/new/donate` | `app/new/donate/page.tsx` | Discord OAuth を前提にした寄附フロー。セッション取得・同意更新・Stripe Checkout 起動を行う。 |
| `/new/donors` | `app/new/donors/page.tsx` | Donors 一覧取得と同意撤回を提供。 |
| `/new/thanks` | `app/new/thanks/page.tsx` | Stripe Checkout 成功後のサンクス画面。 |

全ページは `app/new/layout.tsx` で共通ヘッダ (`components/app-shell.tsx`) を共有し、Cloudflare Pages の既存ルートとは独立している。

## 状態管理フロー

### セッション取得 (`useSession`)

- `/api/session` (GET) を呼び出し、以下の状態を返す。
  - `loading`: 初期取得中。
  - `signed-in`: Discord 表示名と `consentPublic` を保持。
  - `signed-out` / `error`: それぞれ未ログイン or エラー。
- ログイン/ログアウトは OAuth エンドポイントへのリダイレクト。

### 掲示同意更新 (`useConsentMutation`)

- `/api/consent` (POST) に `consent_public` を送信。
- 成功時はセッションの再取得 (`useSession.refresh`) をトリガー。
- 失敗時は API 応答からエラーメッセージを抽出して UI に表示。

### Stripe Checkout 起動 (`useCheckout`)

- `/api/checkout/session` (POST) に寄附のプリセット値 (`mode`, `variant`, `interval`) を送信。
- 成功レスポンス内の `url` へリダイレクト。失敗時は UI にエラーメッセージを表示。
- プリセットは `lib/ui/checkout-presets.ts` にて単発/月額/年額を定義。

### Donors 一覧 (`useDonors`)

- `/api/donors?limit=200` (GET) で最新の表示名を取得。
- ローディング中は Skeleton 文言、空の場合はプレースホルダーを表示。
- 成功時の総数は `count` を優先、未定義の場合は配列長を利用。

## UI コンポーネント

| コンポーネント | 役割 | 備考 |
| --- | --- | --- |
| `components/ui/button.tsx` | 主要操作・リンクのスタイル統一 | `href` を指定すると Next.js の `<Link>` を描画。 |
| `components/ui/card.tsx` | ガラス風カード表現 | カード内の余白とシャドウを統一。 |
| `components/ui/checkbox.tsx` | カスタムチェックボックス | 状態制御は `onCheckedChange` で行う。 |
| `components/donation-impact.tsx` | 寄附プランの鼓舞コンテンツ | 選択したメニューに応じたコピー/アイコンを出し分け。 |
| `components/donor-pill.tsx` | Donors リストのタグ表示 | Flex wrap を前提。 |
| `components/confetti-celebration.tsx` | /thanks での祝砲演出 | `canvas-confetti` を動的 import。 |

Tailwind v4 のトークン定義は `app/globals.css` に集約し、旧静的 UI の `public/styles/base.css` と共存させている。

## Playwright での動作確認

ローカルで `npx next dev --port 3000` を起動し、以下のページを Playwright で巡回した。

| URL | 主な確認事項 |
| --- | --- |
| `http://127.0.0.1:3000/new/donate` | OAuth 未ログイン時の CTA、同意チェックボックスの無効状態、寄附メニューの表示。 |
| `http://127.0.0.1:3000/new/donors` | Donors ローディング表示とログイン誘導文言。 |
| `http://127.0.0.1:3000/new/thanks` | サンクスメッセージと遷移リンク。 |

サーバー停止忘れを防ぐため、検証終了後に `kill <PID>` で Next.js dev サーバを停止すること。

## 今後の課題

- `/new/donate` でセッションが `signed-in` の場合の UI ステート（Checkout ボタン有効化、同意トグル）に対する E2E テスト。
- `npm run ui:build` の成果物を Cloudflare Pages のプレビューに組み込むラッパースクリプト整備（`.open-next/functions` の同期自動化など）。
- 旧静的 UI からのリダイレクト戦略の検討（Phase 3 での切替手順に沿って更新予定）。
