---
title: 'Testing Coverage Survey'
domain: 'donation-portal'
status: 'active'
version: '1.0.0'
created: '2025-11-01'
updated: '2025-11-01'
related_issues: []
related_prs: []
references:
  - README.md
  - docs/guide/operations/phase-06-qa-release.md
---

## 背景

Donation Portal におけるテスト体制を把握し、今後のリリース準備および品質保証に向けた追加整備の要否を評価するために調査を実施した。調査時点で `npm test` は Node.js 組み込みの `node:test` ランナーを利用しており、合計 14 スイート / 56 テストが 0.2 秒程度で完走する。

## 調査対象と前提

- 対象コード: `tests/` 配下の全テストスイート、`src/lib` および `functions/` 配下の主なビジネスロジック、`public/donate` と `public/donors` の UI スクリプト。
- 実行環境: `package.json` の `test` スクリプト（TypeScript を `dist/` にトランスパイル後、ESM として `node --test` を実行）。
- 前提条件: Cloudflare Pages Functions をローカルで実行する統合テストは存在せず、Stripe / Discord 連携はすべてモックで検証。

## 調査手法

1. `npm test` を実行し、全スイートがグリーンであることと実行時間を確認。
2. テストコードと実装コードをクロスレビューし、ユースケースと分岐がどの程度網羅されているかを確認。
3. 主要な Cloudflare Pages Functions（Checkout / Consent / Donors / Session / OAuth / Webhook）と UI スクリプトのテストアプローチを整理。

## 結果概要

| カテゴリ | 主な対象 | カバレッジの概要 |
| --- | --- | --- |
| Pages Functions | `functions/api/*`, `functions/oauth/*`, `functions/health.ts` | Stripe 連携・OAuth・Consent・Donors など主要エンドポイントに対し、正常系と代表的な異常系を網羅。 |
| 共通ライブラリ | `src/lib/auth/*`, `src/lib/cookie/*`, `src/lib/oauth/*` | Cookie 署名・セッション解析・Discord OAuth URL 生成などを単体テストで検証。 |
| UI スクリプト | `public/donate/app.js`, `public/donors/app.js` | カスタム DOM ダブルを用いて、API フェッチ、同意 UI、アクセシビリティ属性などを確認。 |

## 詳細観察

### Cloudflare Pages Functions

- Checkout: 顧客の新規作成・既存更新、Stripe API エラー処理、入力バリデーションまでテスト済み。ただし `APP_BASE_URL` 省略時のフォールバックや価格 ID 未設定時の例外分岐は未カバー。
- Consent / Donors / Session: セッション Cookie の検証、Stripe API 呼び出し、エラーハンドリングの主要分岐を押さえている。Donors API は `order=random` の分岐を検証済みだが、`asc`/`desc` の整列結果までは自動テストで確認されていない。
- Webhook: 署名検証と冪等性キャッシュの正ケース、署名エラー、`event.id` 欠如時をテスト済み。環境変数欠如や JSON 解析失敗時のレスポンスは未検証。

### OAuth フロー

- `/oauth/start` と `/oauth/callback` 双方でモックを活用し、state Cookie 発行、Discord API コール、典型的なエラー（state mismatch、TTL 超過、トークン/ユーザー取得失敗）をカバー。
- Cookie 署名ユーティリティは TTL 超過や署名改ざんを含めた単体テストが充実しており、セキュリティ観点の安心感が高い。

### フロントエンド UI

- `/donate` と `/donors` のスクリプトはカスタム DOM ダブル上で API フェッチと UI 状態遷移を確認。指定された要素 ID を直接生成しているため、HTML 側で ID が変更された場合に気付きにくい構造になっている。
- ユーザー補助属性やエラーメッセージの表示動作まで確認しており、画面ロジックの回帰検知には有効。

### 共通ライブラリ

- `parseSessionFromCookie` や `issueSessionCookie` は API テスト経由で正常系が検証されているが、無効な `display_name` や `exp` 値など異常系を直接確認する単体テストは存在しない。
- `stateCookieService` はランダム UUID 生成と TTL を内包するが、戻り値の構造を直接検証するテストはモック経由のみとなっている。

## ギャップ分析

| No. | 重要度 | 領域 | 課題 | 推奨整備 |
| --- | --- | --- | --- | --- |
| 1 | 高 | Stripe Webhook (`functions/api/webhooks/stripe.ts`) | 秘密鍵未設定・JSON 解析失敗時のレスポンスとログがテストされておらず、設定漏れを検知できない。 | 500 応答とエラーログを検証するテスト、および `parseEvent` が `null` を返すケースのテストを追加。冪等性キャッシュの TTL クリアも `Date.now` をスタブして確認する。 |
| 2 | 中 | Checkout (`functions/api/checkout/session.ts`) | `resolveBaseUrl` のフォールバックや価格 ID 未設定時の例外分岐が未検証。 | `APP_BASE_URL` を省略したリクエストと、価格環境変数を外した状態での 500 応答テストを追加し、リグレッションを防ぐ。 |
| 3 | 中 | セッション解析 (`src/lib/auth/session.ts`) | 無効な `display_name`/`discord_id`/`exp` に対するエラー分岐が API テストから間接的にしか確認できない。 | 単体テストで `parseSessionFromCookie` の異常経路を直接検証し、Cookie 仕様変更時に早期検知できるようにする。 |
| 4 | 低 | UI ダブル (`tests/donate/ui.test.ts`, `tests/donors/ui.test.ts`) | テストが手作業で定義した Fake DOM に依存しており、HTML テンプレートの ID 変更を検出できない。 | `public/*/index.html` を `JSDOM` 等で読み込み、必要な要素 ID が存在するかを確認するスモークテストを追加。 |
| 5 | 低 | テスト運用全般 | カバレッジ計測や CI へのテスト統合が未確認。 | `c8` などでカバレッジを出力し、閾値を設定した上で CI へ組み込む。 |

## 推奨アクション

1. Webhook 環境変数欠如・JSON デコード失敗・TTL クリアを検証するテストケースを追加し、設定漏れによる本番障害を防ぐ。
2. Checkout の環境変数バリデーションと URL フォールバック経路をテストに組み込み、Stripe 価格 ID 変更時のリグレッションを検知できるようにする。
3. `src/lib/auth/session.ts` に対して異常系を網羅する単体テストを新設し、セッション構造の変更に強い体制を整える。
4. UI テストに HTML テンプレートの存在確認を追加し、DOM 構造のドリフトを早期検知できるようにする。
5. カバレッジ計測（例: `npm test -- --experimental-test-coverage` や `c8`）と CI 連携を検討し、継続的に指標をモニタリングする。

## 対応履歴

- 2025-11-01: Webhook 秘密鍵欠如・JSON 解析失敗・冪等性 TTL 経路を網羅するテストを追加。Checkout では `APP_BASE_URL` フォールバックと価格 ID 未設定時の異常系を検証するテストを実装し、セッション Cookie の異常系解析テストも新設。フロントエンド UI テストに実ファイル由来の要素 ID 確認を組み込み、`npm run test:coverage` スクリプトでカバレッジ計測を整備。

## 追加メモ

- 現状のテストはすべてローカル実行を前提としており、Cloudflare Pages での実働バンドルを用いた統合テストは存在しない。将来的にリリース前スモークとして `wrangler pages dev` を利用した簡易 E2E を導入する余地がある。
- テスト実行時間が短いため、上記の追加テストを組み込んでも開発者体験への影響は限定的と見込まれる。
