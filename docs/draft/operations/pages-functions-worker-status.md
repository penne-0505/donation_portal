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

## 2025-11-11 メモ: CI での型エラー対応

- `PagesFunction` の `context.env` はデフォルトだと `unknown` 型のため、`functions/_middleware.ts` で `ensureAssetsBinding(context.env)` を呼ぶと `EnvWithAssets` との整合性で `TS2345` が発生する (`npm test` の tsc ステップで検出)。
- `context.env as EnvWithAssets` の型アサーションを通してから `ensureAssetsBinding` に渡すよう修正し、CI でのビルド不可を解消した。
- 将来 `wrangler types` で生成した `Env` 定義を Pages Functions の型引数として渡せるようになった際は、型アサーションを外してジェネリクスで縛る方法に切り替える。

## 2025-11-09 メモ: デプロイ環境で `/api/*` が 404 になる件

- `@cloudflare/next-on-pages` v1.13.x は `_routes.json` に `["/*"]` しか出力せず、素のままだと `/api/*` や `/oauth/*` のリクエストも Next.js ワーカーで処理されてしまい 404 になる（`x-matched-path: /404`）。
- `scripts/run-next-on-pages.cjs` 終了時に `_routes.json` を補正し、`exclude` に `/api/*` と `/oauth/*` を強制的に追加する。これにより Pages Functions Worker にルーティングされる。
- 逆に Pages Functions 側の `_routes.json` に `/api/*`・`/oauth/*` が含まれていると静的配信にフォールバックしてしまうため、`removeExcludedPatterns` で除去する。
- `scripts/verify-routes.cjs` は上記条件を CI で検証する（`.open-next/_routes.json` に必須パターンが揃っているか、`.open-next/functions/_routes.json` に禁止パターンが含まれないか）。
- ローカル検証は `rm -rf .open-next && npm run build` の後、`npx wrangler pages dev .open-next/static --functions .open-next/functions --local true --port 8788` を起動し、`curl http://localhost:8788/api/session` が 200 / 401 系レスポンスを返すことを確認する。
