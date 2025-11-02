---
title: "React UI 本番: /donate, /donors, /thanks 概要"
domain: "donation-portal"
status: "draft"
version: "0.2.0"
created: "2025-11-01"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/react-ui-integration-2025/plan.md
  - docs/plan/donation-portal/react-ui-cutover-2025/plan.md
  - app/(app-shell)/donate/page.tsx
  - app/(app-shell)/donors/page.tsx
  - app/(app-shell)/thanks/page.tsx
  - components/pages/donate-page.tsx
  - components/pages/donors-page.tsx
  - components/pages/thanks-page.tsx
  - lib/ui/hooks/use-session.ts
  - lib/ui/hooks/use-consent.ts
  - lib/ui/hooks/use-checkout.ts
  - lib/ui/hooks/use-donors.ts
---

## 概要

Next.js (App Router) を利用した React 版 UI が `/donate`・`/donors`・`/thanks` の本番ルートで稼働している。旧 `/new/*` ルートは恒久的に本番導線へリダイレクトされ、Cloudflare Pages Functions (`/api/*`, OAuth フロー) をそのまま利用しつつ、クライアント側でセッション状態と同意フラグを管理する。

## ルーティング

| ルート | ファイル | 説明 |
| --- | --- | --- |
| `/` | `app/(app-shell)/page.tsx` | React UI のランディング。寄付/Donors への導線を表示。 |
| `/donate` | `app/(app-shell)/donate/page.tsx` | Discord OAuth を前提にした寄付フロー。セッション取得・同意更新・Stripe Checkout 起動を行う。 |
| `/donors` | `app/(app-shell)/donors/page.tsx` | Donors 一覧取得と同意撤回を提供。 |
| `/thanks` | `app/(app-shell)/thanks/page.tsx` | Stripe Checkout 成功後のサンクス画面。 |

全ページは `app/(app-shell)/layout.tsx` で共通ヘッダ (`components/app-shell.tsx`) を共有する。`app/new/*` からのアクセスは Next.js のリダイレクトで上記ルートへ転送される。

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

- `/api/checkout/session` (POST) に寄付のプリセット値 (`mode`, `variant`, `interval`) を送信。
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
| `components/donation-impact.tsx` | 寄付プランの鼓舞コンテンツ | 選択したメニューに応じたコピー/アイコンを出し分け。 |
| `components/donor-pill.tsx` | Donors リストのタグ表示 | Flex wrap を前提。 |
| `components/confetti-celebration.tsx` | /thanks での祝砲演出 | `canvas-confetti` を動的 import。 |
| `components/pages/*.tsx` | ページ固有の UI 構成 | `donate`/`donors` はクライアントコンポーネントとして hooks を利用。 |

Tailwind v4 のトークン定義は `app/globals.css` に集約し、旧静的 UI は `docs/archives/legacy-static/styles/base.css` と共存させている。

## テスト

- `npm test` は Node.js test runner と React Testing Library を組み合わせ、`tests/donate/ui.test.ts` と `tests/donors/ui.test.ts` でコンポーネント挙動を検証する。
- `tests/mocks/ui-hooks.ts` で UI フックと Donors フックをスタブし、`scripts/alias-loader.mjs` のオーバーライドで `next/link` など Next.js 依存をテスト用実装に差し替える。
- Hooks (`useSession` / `useConsentMutation` / `useCheckout` / `useDonors`) をスタブ化したうえでサインイン状態や同意更新・Checkout 呼び出しが UI 上で期待どおり遷移することを確かめる。

## ローカル検証

ローカルで `npm run ui:dev -- --port 3000` を起動し、以下のページをブラウザまたは Playwright で巡回する。

| URL | 主な確認事項 |
| --- | --- |
| `http://127.0.0.1:3000/donate` | OAuth 未ログイン時の CTA、同意チェックボックスの無効状態、寄付メニューの表示。 |
| `http://127.0.0.1:3000/donors` | Donors ローディング表示とログイン誘導文言。 |
| `http://127.0.0.1:3000/thanks` | サンクスメッセージと遷移リンク。 |

Cloudflare Pages 開発サーバ (`npm run dev`) に反映する際は `npm run ui:build` 実行後に `npm run dev` を再起動し、`.open-next/static` が配信されていることを確認する。

## 今後の課題

- `/donate` でセッションが `signed-in` の場合の UI ステート（Checkout ボタン有効化、同意トグル）に対する自動 E2E テスト。
- `npm run ui:build` の成果物同期を CI へ組み込み、Cloudflare Pages プレビューで常に React UI が利用できる状態に保つ。
- `/new/*` リダイレクトの監視を追加し、誤って旧 UI へアクセスした場合のログを分析する。
