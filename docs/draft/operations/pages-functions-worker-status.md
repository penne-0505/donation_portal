---
title: "Pages Functions Worker 再構築メモ"
domain: "operations"
status: "draft"
version: "0.1.0"
created: "2025-11-05"
updated: "2025-11-09"
related_issues: []
related_prs: []
references:
  - "scripts/run-next-on-pages.cjs"
state: "in-progress"
hypothesis: "Wrangler生成のルートマニフェストを解析し直してワーカーを再バンドルすれば /api 404 を解消できる"
options:
  - "Wranglerの manifest を esbuild で束ね直し Cloudflare Pages Functions に配置する"
  - "wrangler build 成果物を直接配置する代替パスを調査する"
open_questions:
  - "esbuild で生成したワーカーのルーティング挙動が Cloudflare 標準と一致するか"
next_action_by: "ai"
review_due: "2025-11-12"
ttl_days: 30
---

## 現状概要

- `npm run ui:build` は Next 静的アセットの生成に成功するが、`scripts/run-next-on-pages.cjs` 内の `buildFunctionsWorker` が `Unexpected token ')'` で失敗し、`.open-next/functions/_worker.js` を生成できていない。
- Wrangler の `functionsRoutes-*.mjs` から生成したソースを `esbuild` でバンドルする際の構文変換が原因で、Pages Functions ワーカーが欠落し `/api/*` が 404 のまま。
- ルート定義自体は manifest から取得できているため、構文エスケープや `routeMatcher` 周りのコード生成を見直す必要がある。

## 次の一歩

1. `buildFunctionsWorker` が出力する TypeScript 文字列を一時ファイルに書き出して `node --check` などで構文検証し、どの行で `Unexpected token ')'` が出ているかを特定する。
2. エスケープ処理（特に `escapeRegex` やテンプレート文字列内のバックスラッシュ）を再確認し、生成コードが正しい文字列リテラルになっているか確認する。
3. ワーカー生成に成功したら `/api/session` を含む各ルートのレスポンスを `wrangler pages dev` で確認し、Cloudflare Pages 環境でも 200 を返すことを検証する。

## 2025-11-09 メモ: `wrangler dev .open-next/functions/_worker.js` の 500 対応

- Functions Worker 単体を `npx wrangler dev .open-next/functions/_worker.js --local true --port 8789` で起動すると、未マッチ時のフォールバックが常に `env["ASSETS"]` を参照する実装（`.open-next/functions/_worker.js:2069-2074`）のため、`ASSETS` バインディングが存在しない状態では `Cannot read properties of undefined (reading 'fetch')` で 500 になる。
- `wrangler pages dev` や Pages 本番ではプラットフォーム側が `ASSETS` を自動注入するが、スタンドアロンの `wrangler dev` では CLI で静的アセットを明示する必要がある。`wrangler dev --help` にも `--assets` オプション（「Static assets to be served. Replaces Workers Sites.」）が記載されている。
- Pages プロジェクトでは `ASSETS` というバインディング名が予約済みのため、`wrangler.json` に `assets.binding = "ASSETS"` を追加すると `Processing wrangler.json configuration: The name 'ASSETS' is reserved ...` エラーになる。設定ファイルではなくコマンド引数で差し込む。
- 対応策: `npm run ui:build` の後に `npx wrangler dev .open-next/functions/_worker.js --assets .open-next/static --local true --port 8789` を実行する。`--assets` 指定で `env.ASSETS.fetch` が利用可能になり、フォールバックで 500 が発生しなくなる。もし `--assets` を付け忘れた場合でも、`functions/_middleware.ts` が 501 を返すフェッチャーを暫定挿入するため、TypeError ではなく明示的なエラーレスポンスになる。

## 2025-11-09 メモ: デプロイ環境で `/api/*` が 404 になる件

- Cloudflare Pages のビルドログで `ensureRoutesManifest(... ['/api/*', '/oauth/*'])` により `.open-next/_routes.json` の `exclude` に API パターンが再注入されていた。これによりリクエストが Next.js 側に届かず静的配信で 404 になる。
- `scripts/run-next-on-pages.cjs` の `ensureRoutesManifest` 呼び出しから `/api/*`, `/oauth/*` を除去し、Next on Pages が生成した `_routes.json` をそのまま採用するよう修正済み。
- ローカル検証: `rm -rf .open-next && npm run build` 後、`.open-next/_routes.json` の `exclude` に `/api/*` が含まれないこと、`.open-next/functions/_routes.json` には API ルートが列挙されていることを確認。
