---
title: "Pages Functions Routing Verification (2025-11-09)"
domain: "operations"
status: "confirmed"
version: 1
created: "2025-11-09"
updated: "2025-11-09"
related_issues: []
related_prs: []
references:
  - ../../plan/routing/ensure-pages-functions-routing/plan.md
summary:
  goal: "Cloudflare Pages ビルド成果物で API ルートが Functions に正しくルーティングされるかをローカル環境で再検証する"
  scope:
    - "`.open-next/_routes.json` の `exclude` 配列に `/api/*` と `/oauth/*` が含まれているか"
    - "`.open-next/functions/_worker.js` が生成されているか"
  constraints:
    - "Node.js v22.21.0 (npm 11.4.2) 環境で実行"
---

## 背景
Cloudflare Pages 本番環境で `/api/*` と `/oauth/*` が 404 を返す回帰が報告された。原因は `_routes.json` の `exclude` からこれらのパターンが欠落し、Next.js ワーカーへ誤ルーティングされることにあると想定された。計画ドキュメントに沿ってローカル環境で検証プロセスを実行し、補正スクリプトと検証スクリプトが期待通り機能しているかを確認する。

## 手順
1. `npm run build` を実行し、`scripts/run-next-on-pages.cjs` → `@cloudflare/next-on-pages` → `wrangler` によるビルドフローを通過させる。
2. ビルドログに `_routes.json exclude を更新しました` および `[verify-routes]` の完了ログが出力されるかを確認する。
3. 生成された `.open-next/_routes.json` を直接確認し、`exclude` に `/api/*` と `/oauth/*` が含まれているかを確かめる。
4. `.open-next/functions/_worker.js` が生成されているか（存在とファイルサイズ）を確認する。

## 観測結果
- `npm run build` 実行後、`[next-on-pages] _routes.json exclude を更新しました` ログが出力された。【ac75db†L1-L13】
- 検証スクリプトが起動し、`[verify-routes] ✅ すべての必須項目を確認しました` と出力された。【ac75db†L14-L27】
- `.open-next/_routes.json` の `exclude` 配列に `/_next/static/*`、`/api/*`、`/oauth/*` が揃っていることを直接確認した。【c031ee†L1-L13】
- `.open-next/functions/_worker.js` が 66KB の成果物として生成されている（`ls -lh` にて確認）。【24c93a†L1-L3】

## 考察
ビルド後に補正スクリプトと検証スクリプトの双方が正常に実行され、`_routes.json` と Functions バンドルが揃っていることを確認できた。これにより、Cloudflare Pages のビルドコマンドが `npm run build` に設定されている限り、ルーティングが Functions に流れることがローカル環境で保証されたと判断できる。

## 推奨アクション
- Cloudflare Pages ダッシュボードで `Build command = npm run build` を再確認し、誤ったコマンドが設定されていないかをチェックする。
- 本検証ログを運用手順書に追加し、Pages デプロイ確認時に `[verify-routes]` ログが出力されるかをチェック項目へ組み込む。
- `_routes.json` の検証に失敗した場合に備え、Slack などのアラート経路を検討する。
