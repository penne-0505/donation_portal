---
title: "API Session Fetch Incident Investigation"
domain: "operations"
status: "deprecated"
version: "0.2.0"
created: "2025-11-05"
updated: "2025-11-05"
state: "resolved"
hypothesis: "Pages Functions が 404 を返すのは、ビルド成果物内のルーティング設定または Functions バンドルの配備手順に欠陥があるためである"
options:
  - "_routes.json の exclude 設定から /api/* を除去し、リクエストを Functions Worker にフォールスルーさせる（✅ 採用・実装完了）"
  - "wrangler pages dev / deploy 時に --functions ディレクトリを .open-next/functions に明示的に指定する"
  - "Next.js App Router の API Route に移行し、Pages Functions を使わずにセッション API を提供する"
open_questions:
  - "Cloudflare Pages の本番環境でも修正が反映されているか（デプロイ後に確認予定）"
  - "将来的に Next.js API Routes へ移行する際の Stripe Webhook 等の互換性"
next_action_by: "@penne-0505"
review_due: "2025-11-12"
ttl_days: 30
related_issues: []
related_prs: []
references:
  - "../../intent/operations/routes-json-api-routing-fix.md"
  - "../../intent/operations/session-api-404-resolution.md"
  - "../../archives/plan/operations/session-api-404-investigation-and-resolution.md"
  - "../../../scripts/run-next-on-pages.cjs"
  - "../../../.open-next/_routes.json"
---

## 概要

`/donate` および `/donors` ページでセッション情報を取得できず、`/api/session` が 404 を返す事象が継続している。本ドキュメントでは現象の再現、Pages Functions のビルド成果物の調査、`wrangler` 開発サーバの挙動解析を行い、原因と有効性の高い解決策を整理する。

## 現象の再現

- `npm run ui:build` → `.open-next/` 配下の Next.js / Functions 成果物を生成
- `npm run dev` (=`wrangler pages dev .open-next/static --local --port 8788`)
  - ブラウザで `http://localhost:8788/donate` を開くと React error #418 が発生
  - コンソールに `GET http://localhost:8788/api/session 404 (Not Found)` が継続的に出力
- Cloudflare Pages 上でも同じ 404 が観測されている（ユーザー報告 / コンソールログ）

## 調査結果

### 1. Functions Worker のビルド成果物は生成されている

- `npx wrangler pages functions build ./functions --outdir _temp/functions-build`
  - `_temp/functions-build/index.js` には `routes = [...]` が展開され、`/api/session` を含む 9 本のエンドポイントが列挙されている
  - 各ハンドラー (`onRequestGet`, `onRequestPost` など) がバンドルされ、`parseSessionFromCookie` などの依存モジュールも内包
- `npm run ui:build` 実行後の `.open-next/functions/_worker.js` でも同様の構造を確認
  - よって「Functions がビルドに含まれていない」仮説は否定

### 2. `_routes.json` で `/api/*` が明示的に除外されている

- `scripts/run-next-on-pages.cjs` 末尾で以下の追記処理が行われている：
  ```js
  const additionalExcludes = ['/api/*', '/oauth/*', '/health'];
  const excludeSet = new Set([...(routes.exclude ?? []), ...additionalExcludes]);
  routes.exclude = Array.from(excludeSet);
  ```
- 生成された `.open-next/_routes.json` では `exclude` に `/api/*` が含まれ、リクエストが Next.js Worker へ到達する前に静的配信へフォールバック → 存在しないため 404
- Cloudflare Pages のルーティング仕様上、`exclude` は「Worker を経由しない」動作であり、Functions Worker にも到達しないことを確認

### 3. `wrangler pages dev` は `.open-next/functions` を自動認識するが、`exclude` により実行されない

- `wrangler pages dev` 起動中に `/api/session` へアクセスすると、`static` ディレクトリの 404 が返る（Functions ログは出力されない）
- `npx wrangler dev .open-next/functions/_worker.js` で Functions Worker 単体を起動すると、`routes` を正しく読み込むが、`fetch` ハンドラ内で `env["ASSETS"]` が未定義となり 500 → これは Pages プラットフォーム特有のラッパーが無い状態のためで、本番経路とは別問題

### 4. ユーザー報告の `ERR_CONNECTION_REFUSED` は開発サーバ停止が原因

- `npm run dev` 実行後に別コマンドを走らせると `wrangler` プロセスが終了し、ターミナルが再びプロンプト表示になる
- その状態で `b` キーを押しても反応せず、ブラウザは 8788 ポートへの接続が拒否される → サーバ不在による挙動であり根本原因とは無関係

## 原因の結論

`/api/session` が 404 を返す主因は、`run-next-on-pages.cjs` が `_routes.json` に `/api/*` 等のパターンを追加し、リクエストが Pages Functions Worker へ到達できなくなっていることである。Functions バンドルやアセット構成は問題なく生成されている。

## 解決策の実装

**採用解決策**: オプション1（推奨）- `_routes.json` から `/api/*` の exclude を除外する

詳細な実装内容・検討結果・検証結果は、新しく作成された intent ドキュメント `docs/intent/operations/routes-json-api-routing-fix.md` を参照。

### 実装完了の確認

- [x] `scripts/run-next-on-pages.cjs` から exclude 追加処理を削除
- [x] `npm run ui:build && npm run dev` で、`curl http://localhost:8788/api/session` が 200 OK を返すことを確認
- [x] レスポンス: `{"status":"signed-out"}`
- [x] `/api/donors` 等の他のエンドポイントも正常に動作することを確認

## 検証・フォローアップ

- [x] ローカル環境での `/api/session` 正常応答確認
- [ ] Cloudflare Pages プレビュー環境での `/api/session` 正常応答確認（デプロイ後）
- [ ] Cloudflare Pages 本番環境での動作確認（デプロイ後）

## 未解決の課題 / 今後の検討項目

- Functions と Next.js Worker の責務分離ポリシーを明文化し、ビルドスクリプトにテストを追加する
- Cloudflare Pages の本番環境で `nodejs_compat` フラグが確実に反映されるよう CI で `_worker.js/metadata.json` を検証する
- API Routes を Next.js App Router へ統合する場合のロードマップ検討

## 次のアクション

- ドキュメント整備: 本 draft を archives へ移動し、intent ドキュメントを正式版として管理
- Cloudflare Pages デプロイ環境での動作確認
- 必要に応じて guide/reference ドキュメントへ反映

---

## 参考: 実装前後の比較

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| `/api/session` ステータス | 404 Not Found | 200 OK ✅ |
| `_routes.json` の exclude | `["/_next/static/*", "/api/*", "/oauth/*", "/health"]` | `["/_next/static/*"]` |
| React error #418 | 発生 | 解消 ✅ |
| ビルド時間 | - | 微細な短縮 |

