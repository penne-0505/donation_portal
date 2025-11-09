---
title: Ensure Pages API traffic reaches Functions
domain: infra
status: active
version: 1
created: 2025-11-09
updated: 2025-11-09
related_issues: []
related_prs: []
references:
  - ../../../standards/documentation_operations.md
  - ../../survey/donation-portal/pages-functions-routing-verification-2025-11-09.md
scope:
  - Cloudflare Pages ビルド成果物に含まれる `_routes.json` と Functions バンドルの整合性維持
  - `/api/*` および `/oauth/*` ルートのリクエストを Pages Functions に確実にルーティングするための検証プロセスの導入
non_goals:
  - Stripe 決済フローそのものの改修
  - Discord OAuth 実装の刷新
  - Cloudflare 外のホスティング環境向け最適化
requirements:
  functional:
    - Cloudflare Pages のビルドで `_routes.json` の `exclude` に `/api/*` と `/oauth/*` が含まれていることを自動検証すること
    - Pages Functions のビルド成果物（`functions/_worker.js`）の生成有無を自動検証すること
  non_functional:
    - 検証スクリプトは Node.js 18/20 のランタイムで動作すること
    - ビルド時間への影響を最小限に抑えること（±1秒程度まで）
constraints:
  - Cloudflare Pages は `npm run build` をビルドコマンドとして実行する前提
  - `_routes.json` の生成は `@cloudflare/next-on-pages` に依存しており直接上書きしない
  - Pages Functions は `wrangler pages functions build` の成果物を利用する
api_changes: []
data_models: []
migrations: []
rollout_plan:
  - Step 1: ローカル環境で新しい検証スクリプトを導入し、`npm run build` に組み込む
  - Step 2: Cloudflare Pages の Preview デプロイでビルドログに検証結果が表示されることを確認
  - Step 3: 本番デプロイに昇格し、初回の `/api/*` リクエストで 200/302 など既存挙動が維持されるかを手動確認
rollback:
  - `scripts/build.cjs` から検証スクリプトの呼び出しを削除し、必要に応じて `scripts/verify-routes.cjs` を無効化する
  - Cloudflare Pages のビルドコマンドを直ちに再デプロイすることで以前の挙動へ戻す
security_privacy:
  - 検証スクリプトは機密情報を扱わない
  - ログには Cloudflare の資格情報や Stripe の秘密情報を出力しない
performance_budget:
  - ビルド時間の増加を 1 秒以内に抑える
  - 追加メモリ使用量は無視できる範囲とする
observability:
  - `npm run build` のログに `[verify-routes]` プレフィックス付きで検証結果を出力
  - Cloudflare Pages デプロイログで検証メッセージを確認する運用ルールを追加
  - 再発時は検証スクリプトの失敗ログから原因（`exclude` 欠落 / Functions 不存在）を即時特定する
test_plan:
  unit:
    - npm run verify:routes
  integration:
    - npm run build
  manual:
    - Cloudflare Pages の Preview デプロイで検証ログを確認する
i18n_a11y:
  - 対象外（ビルド工程のみの変更）
acceptance_criteria:
  - `npm run build` 実行時に `_routes.json` と Functions の検証が自動実行される
  - `_routes.json` の `exclude` から `/api/*` または `/oauth/*` が欠落した場合、ビルドが失敗して原因メッセージが表示される
  - Cloudflare Pages のデプロイログで検証完了メッセージが確認できる
---

## 背景
Cloudflare Pages で `/api/*`・`/oauth/*` へのリクエストが 404 になる事象が報告された。原因を調査したところ、ビルド成果物の `_routes.json` に `exclude` 設定が含まれず、Next.js ワーカーへリクエストが誤送されていることが確認された。`scripts/run-next-on-pages.cjs` には `exclude` を補正する処理が存在するが、ビルドコマンドがこれを経由していない場合に再発する。

## 原因仮説と検証アプローチ
- Cloudflare Pages ビルドコマンドが `npm run build` 以外になっており、`scripts/run-next-on-pages.cjs` の補正が実行されていない。
- `_routes.json` の `exclude` に `/api/*` と `/oauth/*` が存在しないままデプロイされている。
- Pages Functions のバンドル自体は生成されているが、ルーティング設定の欠落で到達しない。

これらを確定するため、ビルド成果物の検証を自動化し、欠落時にはビルドを失敗させて原因を即座に把握できるようにする。

## 解決アプローチ
1. Cloudflare Pages プロジェクトの Build command を `npm run build` に統一し、`scripts/build.cjs` → `scripts/run-next-on-pages.cjs` のラッパーを必ず通過させる。
2. デプロイ後に `.open-next/_routes.json` の `exclude` が `/api/*`・`/oauth/*` を含むか、またはビルドログに補正完了メッセージが出力されていることを確認する。
3. 再発防止として、ビルド後に `_routes.json` を検査する自動チェックを追加し、必須パターンが欠落した場合はビルドを失敗させる。

## 実施内容
- `scripts/verify-routes.cjs` を新設し、`.open-next/_routes.json` と `functions/_worker.js` の存在を検証する。
- `scripts/build.cjs` からビルド直後に検証スクリプトを起動し、Cloudflare Pages でも同様の検証が走るようにする。
- `package.json` に `verify:routes` スクリプトを追加し、ローカル確認や CI で単独実行できるようにする。

## テスト計画
- ローカルで `npm run build` を実行し、検証スクリプトが成功ログを出力することを確認する。
- `_routes.json` から `/api/*` を意図的に削除して検証スクリプトを実行し、ビルドが失敗することを確認する（手動検証）。
- Cloudflare Pages の Preview デプロイで検証ログが表示されることを確認する。

## リスクとフォローアップ
- 検証スクリプトの失敗によってビルドが停止するため、緊急時には `verify-routes.cjs` の条件を一時緩和する判断が必要になる可能性がある。
- 今後、他の Functions ルートを追加する場合は `REQUIRED_EXCLUDE_PATTERNS` に追記し、ドキュメントを更新する運用ルールを作成する。

