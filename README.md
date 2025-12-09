# This project has been handed over to [here](https://github.com/penne-9595/clover-web-page). It is no longer updated and no guarantees are provided.


# Donation Portal

Discord コミュニティ向けの任意寄付を受け付ける Cloudflare Pages プロジェクトです。Stripe Checkout で単発・定期寄付を処理し、Discord OAuth で取得した表示名を寄付者の同意がある場合のみ公開します。Stripe の Customer metadata を単一のデータソース（SSOT）として利用し、自前の永続ストアは用意しません。

## プロジェクト概要

- Cloudflare Pages + Pages Functions 上で Next.js 15 App Router UI と API を提供
- TypeScript・Tailwind CSS 4 ベースの React UI。`app/(main)/`が主要ルート
- Discord OAuth によるログインと掲示同意の取得、HMAC 署名付き Cookie でセッションを管理
- Stripe Checkout を利用した複数プランによる寄付
- Stripe Webhook (`payment_intent.succeeded` / `invoice.paid`) を検知し、重複排除と署名検証を実装

## 主要エンドポイント

| Method | Path                                                 | 役割                                                                    |
| ------ | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `GET`  | `/api/health`                                        | Pages Functions のヘルスチェック                                        |
| `GET`  | `/api/session`                                       | Discord セッション状態と掲示同意の取得                                  |
| `POST` | `/api/consent`                                       | 掲示同意 (`consent_public`) の更新                                      |
| `POST` | `/api/checkout/session`                              | Stripe Checkout Session の生成（ログイン必須）                          |
| `GET`  | `/api/donors`                                        | `consent_public=true` の Display Name 一覧を Stripe Search API から取得 |
| `POST` | `/api/webhooks/stripe`                               | Stripe Webhook 受信・署名検証・冪等化                                   |
| `GET`  | `/oauth/start` / `/oauth/callback` / `/oauth/logout` | Discord OAuth フローとセッション破棄                                    |

## アーキテクチャ

- **UI**: Next.js App Router (`app/`)、`.open-next/` に Cloudflare Pages 配信用ビルドを生成。`components/` と `lib/ui/` が UI 専用モジュール。
- **Pages Functions**: `functions/` 配下で Cloudflare Pages Functions を実装。`src/lib/` の共通ロジック（OAuth、Cookie、Stripe クライアントなど）を参照。
- **テスト**: Node.js ネイティブテストランナー（`npm test`）。ビルド済み成果物 (`dist/tests/**/*`) に対して実行し、Stripe/Webhook/OAuth/Consent/Session の主要ケースをカバー。
- **ドキュメント**: `docs/` に標準・計画・ガイドを集約。更新時は `docs/standards/documentation_guidelines.md` と `docs/standards/documentation_operations.md` を参照してください。

## リポジトリ構成

- `app/(main)/` – 現行 UI ルート (`/`, `/donate`, `/donors`, `/thanks`, `/terms`)
- `components/` – UI コンポーネント・ページ単位の React 実装
- `lib/ui/` – UI 向けユーティリティ、ブランド定義、Hooks
- `functions/` – Cloudflare Pages Functions（API、OAuth、Webhook、Health）
- `src/lib/` – Functions で共有するドメインロジック（Stripe クライアント、セッション、Cookie 署名など）
- `tests/` – Node.js テストランナー用のテストコードとモック
- `scripts/` – ESLint/TS/Next/Wrangler を呼び出すユーティリティスクリプト
- `docs/` – ガイド・仕様・計画・意図などプロジェクトドキュメント一式
- `types/` – Cloudflare/Node/Pages 用の型定義

## セットアップ

### 前提条件

- Node.js 18.x（`.nvmrc` は 18.20.4）
- npm 10 以上
- Cloudflare アカウント（Pages/Wrangler が利用可能な API トークン）
- Stripe の API キーと Price ID（単発 / 月額 / 年額）
- Discord Developer Portal で作成したアプリケーション（OAuth クライアント ID/Secret）

### 手順

1. リポジトリを取得し、Node.js バージョンを合わせます。
   ```bash
   git clone https://github.com/penne-0505/donation_portal
   cd donation_portal
   nvm install
   nvm use
   ```
2. 依存パッケージをインストールします。
   ```bash
   npm install
   ```
3. 環境変数テンプレートをコピーし、Stripe/Discord/Cloudflare の値を設定します。
   ```bash
   cp .env.example .env
   ```
4. HMAC 署名用の `COOKIE_SIGN_KEY` を 32 文字以上のランダム英数字で生成し、`.env` と Cloudflare Pages Secrets 双方に登録します。
5. ローカル開発用の Pages Functions + UI を起動します。
   ```bash
   npm run dev
   ```
6. Next.js のホットリロードで UI を確認する場合は別ターミナルで `npm run ui:dev` を実行します。

詳細解説やトラブルシュートは `docs/guide/development/setup.md` を参照してください。

## シークレット

`.env.example` に全一覧があります。主要な項目は以下の通りです。

| 変数                                                                        | 用途                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_PAGES_PROJECT` | Wrangler から Pages を操作するためのクレデンシャル                    |
| `STRIPE_SECRET_KEY`                                                         | Stripe API 呼び出し（Checkout 生成・顧客更新・Donors API）            |
| `STRIPE_WEBHOOK_SECRET`                                                     | Webhook 署名検証に利用                                                |
| `PRICE_ONE_TIME_300`, `PRICE_SUB_MONTHLY_300`, `PRICE_SUB_YEARLY_3000`      | Checkout で利用する Price ID                                          |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`        | Discord OAuth フローに利用                                            |
| `APP_BASE_URL`                                                              | Functions が生成する URL のベース。ローカルは `http://localhost:8788` |
| `COOKIE_SIGN_KEY`                                                           | OAuth state / セッション Cookie の HMAC 署名キー                      |

## ローカル開発とビルド

| コマンド                                  | 説明                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run dev`                             | Cloudflare Pages Functions + Next ビルド成果物を `wrangler` で提供（http://localhost:8788） |
| `npm run ui:dev`                          | Next.js 開発サーバを起動（http://localhost:3000）                                           |
| `npm run ui:build`                        | Next.js UI を `.open-next/` にビルド（Pages 配信用）                                        |
| `npm run build`                           | UI ビルド + Functions バンドルをまとめて生成（Cloudflare Pages 本番と同一構成）             |
| `npm run cf:build`                        | Functions のみを Wrangler でビルド（CI 検証用）                                             |
| `npm run lint` / `npm run typecheck`      | ESLint・TypeScript チェック                                                                 |
| `npm run format` / `npm run format:write` | Prettier チェック・整形                                                                     |
| `npm test` / `npm run test:coverage`      | Node.js テストランナーとカバレッジ収集                                                      |

`npm test` は `dist/` に TypeScript トランスパイル後のファイルを出力してから実行します。Node.js 18 または 20 での実行を想定しており、`--experimental-global-webcrypto` を利用して Cloudflare と同等の WebCrypto API を提供します。

## デプロイ

1. Cloudflare Pages の Build 設定を以下の通りに構成します。
   - Build command: `npm run build`
   - Output directory: `.open-next`
   - Compatibility date: `2025-10-30`(適宜更新してください。)
   - Compatibility flags: `nodejs_compat`
2. Production/Preview の双方に `.env.example` の Secrets を登録します。
3. GitHub 連携デプロイ、または `npx wrangler pages deploy .open-next` 相当のコマンドで公開します。

より詳しい運用手順は `docs/guide/operations/` 配下の各ガイドを参照してください。

## ドキュメント運用

- 仕様変更や実装追加時は関連ドキュメント（guide/reference/plan/intent）を必ず更新します。
- 執筆時は `docs/standards/documentation_guidelines.md` と `docs/standards/documentation_operations.md` のフローに従って草案→計画→意図→(ガイド/リファレンス)へ昇格させてください。
- ドキュメント更新内容に関連する Issue/PR は front-matter の `related_issues` / `related_prs` に追記します。

---
