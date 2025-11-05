---
title: "Session API 404 Analysis"
domain: "operations"
status: "proposed"
version: 1
created: "2025-11-05"
updated: "2025-11-05"
related_issues: []
related_prs: []
references:
  - "functions/api/session.ts"
  - "lib/ui/hooks/use-session.ts"
  - "scripts/run-next-on-pages.cjs"
  - "docs/archives/plan/operations/session-api-404-investigation-and-resolution.md"
state: "exploring"
hypothesis:
  - "UI開発専用サーバー(next dev)がCloudflare Pages Functionsを提供せず、/api/sessionが存在しないのではないか"
options:
  - "npm run dev でWrangler経由の統合開発サーバーを起動する"
  - "UI専用開発時に利用できるモック/プロキシを用意する"
open_questions:
  - "デザイナーやUI実装者がui:devのみで作業したい場合の代替手段をどうするか"
next_action_by: "unassigned"
review_due: "2025-12-05"
ttl_days: 30
---

# Session API 404 Analysis

## 背景
- `donate/` と `donors/` のページではセッション状態を取得し、ログイン済みかどうかでUIを出し分けている。
- セッション取得ロジックは `lib/ui/hooks/use-session.ts` の `fetch('/api/session')` に依存している。
- サーバー側のエンドポイントは Cloudflare Pages Functions として `functions/api/session.ts` に実装されている。
- ビルド済みアーティファクト（`.open-next/functions/_worker.js`）は `wrangler pages functions build` によって生成されることが期待される。

## 観測された症状
- UI 上で「セッション情報の取得に失敗しました。」が表示され、ブラウザのコンソールには `GET /api/session 404` が出力される。
- `npm run ui:dev`（Next.js 単体サーバー）だけでなく、`npm run dev`（Wranglerローカル）、Cloudflare Pages プレビュー・本番デプロイでも同じ404が再現する。
- 404 応答はNext.jsの標準404であり、Cloudflare Pages Functions のレスポンスではない。

## 調査過程
1. `lib/ui/hooks/use-session.ts` を確認し、`/api/session` を前提としたフェッチ処理であることを確認。
2. `functions/api/session.ts` に `export const onRequestGet` が定義されており、Cloudflare Pages Functions で `GET /api/session` を処理する構成を把握。
3. `package.json` のスクリプト構成と `scripts/run-next-on-pages.cjs` を確認し、ビルド成果物の生成フローを追跡。
4. `.open-next/functions/` の中身を確認したところ、ビルド手順によっては `wrangler pages functions build` の出力ではなく TypeScript ソースがそのままコピーされるケースがある（既存の調査ドキュメントとも一致）。
5. Cloudflare Pages のプレビュー／本番環境でも `_worker.js` が含まれないデプロイが生じており、`/api/session` が Next.js 側の 404 で応答することを確認した。

## 原因の考察
### 1. Next.js 単体開発サーバー (`ui:dev`)
- `npm run ui:dev` では Next.js の開発サーバーのみが起動し、Cloudflare Pages Functions が動作しない。
- そのため `/api/session` を含む Functions ルートが存在せず、404 となる。

### 2. Wrangler ローカル / Cloudflare Pages 環境
- `scripts/run-next-on-pages.cjs` が `.open-next/functions/` に `functions/` ディレクトリをそのままコピーしている。
- Cloudflare Pages Functions は TypeScript の依存解決（`../../src/lib/...`）を行えず、未ビルドのままではエントリポイントとして認識されない。
- `wrangler pages functions build` を実行して `_worker.js` を生成しない限り、Functions が登録されず 404 となる。
- プレビュー / 本番デプロイでも同様にビルド済み `_worker.js` が欠落し、Next.js 側の 404 が返却されている。

## 推奨アクション
- セッション API が必要な動作確認では `npm run dev` を使用する運用ルールを明文化する（`ui:dev` ではエラーになる旨を明記）。
- `scripts/run-next-on-pages.cjs` を修正し、`wrangler pages functions build` をビルドフローに統合して `.open-next/functions/_worker.js` を生成する。
- 生成された `_worker.bundle` / `_worker.js` を Cloudflare Pages デプロイ成果物に含めるよう `build` スクリプトを更新する。
- UI 単体開発のためには `/api/session` のモックレイヤー（MSW等）を導入し、Functions 依存を回避する方針を検討する。
- ビルド手順書（例: `docs/guide/development/setup.md`）に、`npm run build` 前後で `wrangler pages functions build` が実行されていることを確認するチェックリストを追加する。
