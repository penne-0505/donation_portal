---
title: "Pages Functions Worker 再構築メモ"
domain: "operations"
status: "draft"
version: "0.1.0"
created: "2025-11-05"
updated: "2025-11-05"
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
