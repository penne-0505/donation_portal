---
title: 'Cloudflare Pages nodejs_compat 適用方針'
domain: 'operations'
status: 'active'
version: '1.0.0'
created: '2025-11-02'
updated: '2025-11-02'
related_issues: []
related_prs: []
references:
  - ../guide/operations/production-deployment.md
  - ../survey/operations/nodejs-compat-investigation.md
  - ../../wrangler.json
---

## 背景

Cloudflare Pages の本番デプロイにおいて `Node.JS Compatibility Error` が発生し、Workers ランタイムで Node.js 互換機能が無効化されていることが判明した。調査の結果、`wrangler.toml` が Pages ビルドで無効と解釈され、`nodejs_compat` フラグが適用されていなかった。これを是正するために設定およびビルドフローを整理した。

## 決定

1. Wrangler 設定は `wrangler.json` に統一し、以下を確実に指定する。
   - `compatibility_date`: `2025-10-30`
   - `compatibility_flags`: `nodejs_compat`
   - `pages_build_output_dir`: `.open-next`
2. ビルドスクリプト (`scripts/run-next-on-pages.cjs`) で `.open-next/_worker.js/metadata.json` を生成し、互換フラグと互換日を出力成果物に同梱する。
3. Cloudflare Pages ダッシュボードの Production / Preview それぞれで `nodejs_compat` が有効化されていることをリリース前チェック項目に追加する。
4. ビルドログに互換フラグの状態を記録するデバッグ出力を維持し、Pages 側ログの警告 (`node:buffer`, `node:async_hooks`) が発生していないか確認する。

## 影響

- Wrangler 設定のバリデーションエラーが解消され、Pages デプロイで `nodejs_compat` が確実に適用される。
- メタデータを成果物へ同梱することで、Pages 設定の漏れがあっても互換フラグを担保できる保険を確保。
- リリースチェックリストに互換フラグ確認が追加され、今後の再発リスクを低減。

## 残課題

- CI において `.open-next/_worker.js/metadata.json` を検証するテストの導入を検討する。
- Cloudflare Pages の UI 操作が必要な項目は Runbook へ明文化し、スクリーンショットによるエビデンス取得フローを整える。
