---
title: 'Cloudflare Pages nodejs_compat 適用不備調査'
domain: 'operations'
status: 'active'
version: '0.1.0'
created: '2025-11-01'
updated: '2025-11-01'
related_issues: []
related_prs: []
references:
  - ../guide/operations/production-deployment.md
  - https://developers.cloudflare.com/pages/functions/bindings/#enable-node-js-compatibility
  - https://developers.cloudflare.com/pages/framework-guides/nextjs/ssr/troubleshooting
---

## 概要

Cloudflare Pages へのデプロイ後に表示が `Node.JS Compatibility Error` に置き換わった事象について、原因調査と恒久対策を整理する。調査の結果、`@cloudflare/next-on-pages` が生成する `_worker.js` に互換性メタデータが含まれないため、Pages プロジェクト設定で `nodejs_compat` フラグが無効な場合に Node.js API が利用できず、本エラーが発生することを突き止めた。

## 事象

- 発生タイミング: 2025-11-01 の Cloudflare Pages 本番デプロイ直後
- 症状: `/` を含む全ページが `Node.JS Compatibility Error` 画面（`no nodejs_compat compatibility flag set`）に差し替わる
- 影響範囲: Next.js App Router で提供する全 UI
- 再現条件: Pages プロジェクト側で `nodejs_compat` フラグが未設定、かつ `@cloudflare/next-on-pages` 生成物に互換性メタデータが存在しない状態でデプロイ

## 調査ログ

1. ローカルで `node scripts/run-next-on-pages.cjs` を実行し、出力物 `.open-next/_worker.js/index.js` を検証
   - Node.js 組み込みモジュールを `import('node:buffer')` として遅延読み込みし、失敗時に静的エラー (`cdn-cgi/errors/no-nodejs_compat.html`) を返却する実装を確認
   - `.open-next/_worker.js` 直下に `metadata.json` が生成されておらず、互換性設定をバンドル内で指定できないことを確認
2. `@cloudflare/next-on-pages` のビルドスクリプト（`node_modules/@cloudflare/next-on-pages/dist/index.js`）を調査
   - 互換性フラグを CLI オプション・環境変数経由で注入するフックが存在せず、Pages 設定に依存していることを把握
3. Cloudflare 公式ドキュメントを参照
   - Pages Functions の互換性を `metadata.json` または Dashbord 設定で付与できることを再確認
4. 既存の Pages プロジェクト設定を確認（ユーザー申告）
   - Preview では `nodejs_compat` を有効化していたが、本番側で設定漏れがありエラーが再発した

## 原因分析

- `@cloudflare/next-on-pages` は Cloudflare が提供するビルド成果物 (`.open-next/_worker.js/index.js`) に Node.js 互換性要件を持つコードを生成する
- 互換性フラグは Cloudflare Pages で明示的に指定しない限り無効である
- プロジェクト設定で Production/Preview の両方に `nodejs_compat` を指定しないと、本番デプロイ時に互換機能が無効化される
- ビルド成果物側に `metadata.json` を同梱すれば、Pages 設定とは独立して互換フラグを付与できるが、従来スクリプトは生成していなかった

## 対応策

1. `scripts/run-next-on-pages.cjs` を更新し、ビルド完了後に `.open-next/_worker.js/metadata.json` を生成するよう変更
   - 内容例:

```json
{
  "compatibility_date": "2025-10-30",
  "compatibility_flags": ["nodejs_compat"]
}
```

2. 同スクリプトにデフォルト環境変数 `NEXT_ON_PAGES_COMPATIBILITY_DATE` / `NEXT_ON_PAGES_COMPATIBILITY_FLAGS` を明示し、Pages Build 環境からも上書き可能とした
3. 運用ガイド (`docs/guide/operations/production-deployment.md`) に互換フラグ適用手順とエラー時のリカバリ手順を追記

## 検証結果

- ローカルビルド後に `.open-next/_worker.js/metadata.json` が生成されることを確認
- メタデータには `compatibility_date` と `compatibility_flags` が設定され、Pages の Direct Upload 互換形式を満たす
- 既存ルートや静的ファイル出力への副作用は無し

## 今後の課題

- Cloudflare Pages ダッシュボード側でも Production/Preview へ互換フラグが設定されているか定期的に監査する仕組みを検討
- ビルド時に `metadata.json` を検証する自動テスト（例: CI で JSON を読み取り必須キーを確認）を追加予定

