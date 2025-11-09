---
title: 'API Routing Regression (2025-11) Resolution'
domain: 'operations'
status: 'active'
version: '1.1.0'
created: '2025-11-09'
updated: '2025-11-09'
related_issues: []
related_prs: []
references:
  - '../../survey/donation-portal/api-routing-regression-2025.md'
  - '../../../scripts/run-next-on-pages.cjs'
  - '../../../docs/intent/operations/routes-json-api-routing-fix.md'
---

## 背景

2025-11-09 の調査（`docs/survey/donation-portal/api-routing-regression-2025.md`）で、Cloudflare Pages 向けビルド成果物 `.open-next/_routes.json` が `include: ["/*"]` のみを保持しているため、`/api/*`・`/oauth/*` を含むすべてのリクエストが Next.js ワーカーに誤ってルーティングされることが判明した。Pages Functions で実装した API が一切到達せず、UI ではセッション取得失敗エラーが恒常的に表示される。

過去の `docs/intent/operations/routes-json-api-routing-fix.md` では逆方向の不具合（`exclude` に `/api/*` を追加した結果、静的配信へフォールバックしてしまう）を是正したが、`@cloudflare/next-on-pages` v1.13.x の挙動では Next.js ワーカーが優先されるため、Pages Functions を利用するには改めて `_routes.json` の補正が必要である。

## 目的

- Cloudflare Pages Functions で提供している `/api/*` および `/oauth/*` エンドポイントを確実に呼び出せるようにする。
- `npm run ui:build`（`scripts/run-next-on-pages.cjs`）のビルド結果だけで、本番・プレビュー環境ともに正しいルーティング設定が得られる状態に戻す。
- ドキュメント上でルーティング方針を明示し、再発時に参照できる情報を整備する。

## 採用方針

1. `scripts/run-next-on-pages.cjs` で Next on Pages のビルド完了後に `_routes.json` を読み込み、`exclude` 配列へ `/api/*` と `/oauth/*` を追加する。
2. 既存の `exclude` 設定を尊重しつつ不足分のみを追記し、JSON のフォーマットを整えて保存する。
3. `_routes.json` が存在しない、あるいは破損している場合には警告ログを出力し、ビルド失敗にはしない（CI/CD で検出可能なログとする）。
4. Pages Functions 用に生成される `.open-next/functions/_routes.json` からは `/api/*`・`/oauth/*` を除去し、API ルートが静的配信へフォールバックしないよう維持する。

## 実装内容

- `scripts/run-next-on-pages.cjs`
  - `_routes.json` の存在確認と JSON パースを追加。
  - `exclude` 配列に `/api/*`・`/oauth/*` を追加する処理を実装し、変更があった場合のみ上書き保存するようにした。
  - Pages Functions 用の `_routes.json` から `/api/*`・`/oauth/*` を除外する処理を追加し、Functions のエンドポイントが 404 になる回帰を防止した。
  - 処理の成否を `console.log` / `console.warn` で出力してビルドログから検証できるようにした。
- `docs/intent/operations/routes-json-api-routing-fix.md`
  - 過去の結論を参照用に残しつつ、本対応によって内容が上書きされたことを明示した。
- `scripts/verify-routes.cjs`
  - `.open-next/_routes.json` に `/api/*`・`/oauth/*` が含まれていることを確認するのに加え、Functions 側の `_routes.json` に同パターンが含まれていないことを検証するよう拡張した。

## 動作確認

1. `npm run ui:build` を実行し、ビルドが成功することを確認。
2. 生成された `.open-next/_routes.json` の `exclude` 配列に `/api/*` および `/oauth/*` が追加されていることを確認。
3. `npx wrangler pages dev .open-next/static --functions .open-next/functions` を起動し、`
   - `curl http://localhost:8788/api/session`
   - `curl http://localhost:8788/oauth/start`
   が 404 を返さず Pages Functions のレスポンスを返すことを手動確認する（CI 手順は未整備のため暫定）。

## ロールアウトとフォローアップ

- `dev` → `main` へマージ後、Cloudflare Pages の Preview と Production で自動的に `_routes.json` が補正されることを確認する。
- 将来的な自動検証として、`npm run ui:build` の後に `_routes.json` を読み取って `exclude` の必須パターンをチェックするスクリプト／テストを追加する検討を継続する。
- Pages Functions のエンドポイントを追加した際は、本ドキュメントを更新し、除外対象のパターン一覧を保守する。

---
