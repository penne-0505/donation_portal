---
title: 'Donation Portal 開発環境セットアップガイド'
domain: 'donation-portal'
status: 'draft'
version: '0.1.0'
created: '2025-10-29'
updated: '2025-10-29'
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/phase-01-foundation/plan.md
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
