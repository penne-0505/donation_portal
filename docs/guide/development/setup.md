---
title: 'Donation Portal 開発環境セットアップガイド'
domain: 'donation-portal'
status: 'draft'
version: '0.1.0'
created: '2025-10-29'
updated: '2025-10-30'
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/phase-01-foundation/plan.md
  - docs/guide/auth/discord-oauth.md
---

## 概要

Cloudflare Pages 上で Donation Portal を開発するためのローカル環境セットアップ手順をまとめています。Phase 1 時点では Functions/API の開発基盤と CI 実行を目的とした最小構成です。

## 前提条件

- Node.js 18.x（`.nvmrc` で 18.20.4 を指定）
- npm 10 以降
- GitHub リポジトリへのアクセス権
- Cloudflare アカウント（Pages プロジェクトを作成するため）

> **補足**: 現在の開発コンテナでは npm レジストリへのアクセスが制限されており、一部パッケージを取得できません。社内ネットワークから利用する場合はプロキシ設定やミラーリポジトリの利用をご検討ください。

## セットアップ手順

1. リポジトリをクローンします。
   ```bash
   git clone <repo-url>
   cd donation_portal
   ```
2. Node.js バージョンを `.nvmrc` に合わせます。
   ```bash
   nvm install
   nvm use
   ```
3. 依存パッケージをインストールします。

   ```bash
   npm install
   ```

   - `wrangler` や `@cloudflare/workers-types` が取得できない場合は、Cloudflare 公式の npm レジストリにアクセスできるネットワークから再実行してください。

4. 環境変数テンプレートをコピーして編集します。
   ```bash
   cp .env.example .env
   # 値を自分のアカウント・テスト環境に合わせて編集
   ```
   - `COOKIE_SIGN_KEY` は OAuth state Cookie の HMAC 署名に利用する秘密鍵です。32 文字以上のランダムな英数字を生成し、
     漏洩しないよう Secrets 管理してください。
5. 静的アセットと Functions を含むローカル開発サーバを起動します。

   ```bash
   npm run dev
   ```

   - `wrangler` が未インストールの場合はエラーになるため、`npm install wrangler --save-dev` または `npm install -g wrangler` で導入してください。

## 環境変数と Secrets 管理

`.env.example` と Cloudflare Pages の Secrets 設定の対応関係は以下の通りです。Discord OAuth に関する詳細は [Discord OAuth フロー運用ガイド](../auth/discord-oauth.md) を参照してください。

| 変数 | 用途 | Pages での配置 | 備考 |
| --- | --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | `wrangler` CLI で Pages プロジェクトを操作するためのアカウント ID | ローカル `.env` のみ | CI からデプロイする際に利用します。 |
| `CLOUDFLARE_API_TOKEN` | `wrangler` が API 呼び出しを行う際のトークン | ローカル `.env` のみ | Pages ダッシュボードから作成。スコープは Pages デプロイに限定。 |
| `CLOUDFLARE_PAGES_PROJECT` | デプロイ対象プロジェクト名 | ローカル `.env` のみ | 既定値 `donation-portal`。 |
| `STRIPE_SECRET_KEY` | Checkout 作成や Customer 更新で使用 | Pages **Environment variables (Secrets)** | Test と Production で値を分け、ローカルは `.env` で管理。 |
| `STRIPE_WEBHOOK_SECRET` | Webhook 検証用署名 | Pages **Environment variables (Secrets)** | 本番/プレビューで別 Secret を登録し、Stripe Dashboard のエンドポイントごとに紐付け。 |
| `DISCORD_CLIENT_ID` | Discord OAuth クライアント ID | Pages **Environment variables (Secrets)** | Developer Portal で取得。 |
| `DISCORD_CLIENT_SECRET` | Discord OAuth クライアントシークレット | Pages **Environment variables (Secrets)** | Secrets 更新時は必ず再デプロイ。 |
| `DISCORD_REDIRECT_URI` | Discord からの Callback URL | Pages **Environment variables (Secrets)** | 本番は `https://<project>.pages.dev/oauth/callback` を指定。 |
| `APP_BASE_URL` | Functions が生成するリダイレクト先の基準 URL | Pages **Environment variables (Secrets)** | 本番の Pages URL を設定し、ローカルでは `http://localhost:8788`。 |
| `COOKIE_SIGN_KEY` | state/sess Cookie 署名用の HMAC キー | Pages **Environment variables (Secrets)** | 32 文字以上のランダム値。ローテーション時は古い Cookie を破棄。 |

### Cloudflare Pages への登録手順

1. Cloudflare Pages プロジェクトの **Settings → Environment variables** を開きます。
2. `Production` と `Preview` の両方に上記表で「Pages」欄が Secrets となっている値を追加します。
3. Secrets 変更後に GitHub 連携または `wrangler pages publish` で再デプロイします。Discord OAuth の動作確認は [Discord OAuth フロー運用ガイド](../auth/discord-oauth.md#secrets-設定手順) の手順に沿って実施してください。

## 開発用コマンド

| コマンド            | 目的                                             | 備考                                                                                                                         |
| ------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`      | ESLint による静的解析                            | `scripts/run-eslint.cjs` がグローバル `eslint` を呼び出します。TypeScript 用プラグインが未導入の場合は警告のみ出力されます。 |
| `npm run format`    | Prettier によるフォーマットチェック              | `scripts/run-prettier.cjs` がグローバル `prettier` を利用します。                                                            |
| `npm run typecheck` | TypeScript コンパイルチェック                    | グローバル `tsc` を利用します。                                                                                              |
| `npm test`          | Node.js 標準テストランナーでユニットテストを実行 | Phase 1 では `src/lib` 配下のモジュールを対象にしています。                                                                  |
| `npm run build`     | Functions のビルド検証                           | `wrangler` がインストールされていない場合はスキップメッセージを表示します。                                                  |

## Cloudflare Pages との連携

1. Cloudflare ダッシュボードで Pages プロジェクトを作成し、GitHub リポジトリを接続します。
2. ビルドコマンドに `npm run build`、ビルド出力ディレクトリに `public` を指定します。
3. Functions ディレクトリとして `functions` を登録し、`Compatibility date` を `2024-10-29` に合わせます。
4. Preview 環境では `.env` を利用せず、Cloudflare Pages の環境変数機能で Secrets を管理します。

## トラブルシューティング

- **npm 403 エラー**: プロキシ越しに npm レジストリへアクセスできない場合があります。Cloudflare ミラーや社内アーティファクトリの利用を検討してください。
- **`wrangler` コマンドが見つからない**: `npm install wrangler --save-dev` もしくは `npm install -g wrangler` を実行してインストールします。
- **Functions の型定義が認識されない**: `@cloudflare/workers-types` を devDependencies に追加し、`tsconfig.json` の `types` に `@cloudflare/workers-types` を追記してください。

## 次のステップ

- Phase 2 以降で Discord OAuth を実装する際は、`docs/plan/donation-portal/phase-02-oauth/plan.md` を参照し、必要な環境変数を `.env.example` に追記してください。
