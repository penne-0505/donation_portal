---
title: "API Routing Regression Survey (2025-11)"
domain: "operations"
status: "confirmed"
version: 1
created: "2025-11-09"
updated: "2025-11-09"
related_issues: []
related_prs: []
references:
  - lib/ui/hooks/use-session.ts
  - functions/api/session.ts
  - scripts/run-next-on-pages.cjs
  - .open-next/_routes.json
---

# Cloudflare Pages API ルーティング障害 調査報告書（2025年11月）

## 背景

2025年11月初旬より、Donation Portal の `/donate` と `/donors` ページで「セッション情報の取得に失敗しました。」という UI エラーが恒常的に表示され、Discord OAuth を含む `/oauth/*`・`/api/*` エンドポイントが全て 404 を返す事象が報告された。サイトの主要導線（寄付手続き・寄付者同意管理）が一切利用できないため、重大インシデントとして調査を実施した。

## 症状の整理

- クライアントサイドの `useSession` フックが `/api/session` への GET を実行するが、`response.ok` が偽となり即座にエラー状態へ遷移するため、寄付 UI では常にエラーメッセージが描画される。【F:lib/ui/hooks/use-session.ts†L39-L66】
- Cloudflare Pages Functions 側には `functions/api/session.ts` を始め、必要な API エントリポイントが従来どおり配置されているが、どのパスに対してもワーカーが応答せず 404 が返ってくる。【F:functions/api/session.ts†L1-L72】
- 現地調査のために `npm run ui:build` を実行したところ、生成された `.open-next/_routes.json` で `include` に `"/*"` が設定され、全リクエストが Next.js ワーカーにルーティングされる構成になっていることを確認した。【F:.open-next/_routes.json†L1-L1】

## 調査手法

1. UI 側のフェッチ実装とエラーハンドリングを確認し、`/api/session` が失敗している事実をコードレベルで裏付けた。
2. Pages Functions のエントリポイントが存在していること、かつ通常どおり JSON レスポンスを返す設計であることを確認した。
3. `npm run ui:build` で Cloudflare Pages 向けビルドを再現し、生成物の `_routes.json` を直接確認することで実際のルーティングテーブルを把握した。
4. ルーティング制御を担う `scripts/run-next-on-pages.cjs` の処理を精査し、ビルド後に `_routes.json` を補正していない点を検証した。【F:scripts/run-next-on-pages.cjs†L20-L110】

## 主な調査結果

### 1. Next.js ワーカーが全リクエストを捕捉している

- `_routes.json` の `include: ["/*"]` が優先され、`/api/*` や `/oauth/*` も Next.js 側の `_worker.js` へ送られる。
- Next.js アプリにはこれら API を処理するルートが存在しないため、Next.js ワーカーは 404 を返し、Pages Functions にはリクエストが到達しない。

### 2. Pages Functions 自体はビルドされている

- `scripts/run-next-on-pages.cjs` は `wrangler pages functions build` を実行し、`.open-next/functions/_worker.js` を生成している。ビルドの成否ログおよび出力ファイルから、Functions のバンドルは成功していることを確認した。【F:scripts/run-next-on-pages.cjs†L53-L98】【F:.open-next/functions/_worker.js†L1-L20】
- 従って問題は Functions の未配置ではなく、ルーティング段階で Next.js へ誤配されている点にある。

### 3. ルーティング補正ロジックが存在しない

- 過去に `_routes.json` へ `/api/*` を除外する処理が存在したが、コメントのみ残り現在は補正が一切行われていない。このため Next on Pages が吐き出すデフォルト設定（`include: "/*"`）がそのままデプロイされてしまう。【F:scripts/run-next-on-pages.cjs†L100-L107】

## 根本原因

Cloudflare Pages へ配置された `_routes.json` が `include: "/*"` のみを指定しているため、`/api/*`・`/oauth/*` を含む全てのリクエストが Next.js ワーカーに送られ、Pages Functions の API 実装が一切呼び出されない。Next.js 側に該当ルートが存在しないため、結果として 404 が返却され、UI でセッションエラーが表示される。Pages Functions のビルドやコードは正常であり、ルーティング設定だけが原因である。

## 解決候補

| 案 | 内容 | メリット | リスク/懸念 |
| --- | --- | --- | --- |
| A | ビルド後に `_routes.json` の `include` を `/api/*`・`/oauth/*` 除外付きの形へ自動書き換え（例: `include: ["/*"]`, `exclude: ["/_next/static/*", "/api/*", "/oauth/*"]`） | デプロイ手順を変えずに即時復旧できる | スクリプト改修のテスト工数が必要 |
| B | Cloudflare Pages 側で手動 `_routes.json` を上書き配置 | 迅速なホットフィックスが可能 | 手作業のため再発リスクが高い。ビルドパイプライン更新時に失効 |
| C | Next.js App Router に API を移植して Next ワーカーで処理 | 将来的に `_routes.json` 依存が不要になる | 大規模実装変更。短期復旧には不向き |

## 推奨アクション

- **案A** を採用し、`scripts/run-next-on-pages.cjs` に `_routes.json` の補正処理を復活させる。具体的には、ビルド完了後に JSON を読み込み、`exclude` に `/api/*`・`/oauth/*` を追加して保存する。
- 追加で、`_routes.json` の内容を `wrangler.toml` などで監視し、CI で `include: "/*"` のままになっていないかを検証する自動チェックを検討する。

## 成功条件

1. デプロイ後の `_routes.json` に `/api/*` および `/oauth/*` が `exclude` として明示されていること。
2. ブラウザで `/api/session` を叩いた際に Pages Functions が応答し、`status: 'signed-in' | 'signed-out' | 'error'` の JSON が返ること。
3. `/donate`・`/donors` ページでセッションエラーが表示されず、Discord OAuth フローが 404 を返さないこと。
4. `npm run ui:build` 実行時のログおよび成果物において、ルーティング補正処理が成功したことを検証できること。

## 未解決の懸念事項

- `_routes.json` の補正がビルドパイプライン（CI/CD）で確実に適用される保証をどう担保するか。ユニットテストや lint による検証の導入を検討する必要がある。
- 今後 Pages Functions のパスが増えた際に、除外リストを自動拡張する仕組み（例: `functions/` 配下から動的抽出）を実装するかは別途判断が必要。

