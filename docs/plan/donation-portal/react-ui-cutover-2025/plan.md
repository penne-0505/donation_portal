---
title: 'React UI 全面切替計画 2025'
domain: 'donation-portal'
status: 'active'
version: '0.1.0'
created: '2025-11-01'
updated: '2025-11-01'
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/react-ui-integration-2025/plan.md
  - docs/guide/development/setup.md
  - docs/guide/operations/production-deployment.md
  - docs/reference/ui/react-app-preview.md
  - functions/index.ts
  - public/donate/index.html
  - public/thanks/index.html
  - public/donors/index.html
---

## 1. 背景と目的

- `/new/*` として段階導入した Next.js UI を正式プロダクションとして採用し、旧静的ページ（`/donate`, `/thanks`, `/donors`）を廃止する。
- Cloudflare Pages 上で `/` を含む主要導線が React UI を指すようルーティングを更新し、旧 UI のメンテナンス負荷と UI 不整合を解消する。
- 切替時の Stripe/Discord フロー継続、SEO・リダイレクト・監視までを一括で管理する。

## 2. スコープ

### 対象

- 旧 `public/` 配下のページ（`donate`, `thanks`, `donors`）の削除または恒久的リダイレクト。
- `functions/index.ts` を含む Pages Functions のルーティング更新。
- Cloudflare Pages の Build 設定を `.open-next` ベースへ統一。
- React UI ドキュメント・ガイドラインの更新。

### 非対象

- Stripe / Discord API スキーマや価格設定の変更。
- `/api/*` エンドポイントの大幅刷新。
- 新規機能（例: マルチプラン追加、テーマ拡張）の同時実装。

## 3. 成果物と受け入れ条件

| 成果物                    | 受け入れ条件                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Pages デプロイ | `/donate`, `/thanks`, `/donors`, `/` が Next.js 版に統一され、旧 HTML にアクセスすると 301→新 URL で 200 を返す。            |
| ドキュメント更新          | `docs/guide/development/setup.md` と `docs/guide/operations/production-deployment.md` に切替手順と設定変更が反映されている。 |
| QA レポート               | Stripe Test/LIVE、Discord OAuth、Donors 表示の回帰確認ログを残す。                                                           |
| コミュニティ告知          | Discord #donation-portal-dev 等で切替スケジュールと新 UI の導線を周知。                                                      |

## 4. タイムライン（提案）

| フェーズ                | 期間目安 | 主担当       | アウトプット                                                  |
| ----------------------- | -------- | ------------ | ------------------------------------------------------------- |
| Phase 0: 準備           | 1 週間   | Web 担当・QA | `/new/*` の最終 QA、Stripe/Discord 動作確認、ドキュメント草案 |
| Phase 1: 切替実装       | 2〜3 日  | Web 担当     | 静的ページ撤去/リダイレクト、ルーティング更新、ビルド設定変更 |
| Phase 2: 検証           | 3〜5 日  | QA           | Preview/Production での E2E チェック、ログ監視                |
| Phase 3: 公開・フォロー | 1 週間   | 運用         | コミュニティ告知、アクセス監視、Stripe/Discord トラッキング   |

## 5. ワークストリーム詳細

### 5.1 準備

- `/new/donate`, `/new/donors`, `/new/thanks` の UI 文言・アクセシビリティ確認、アクセシビリティレビュー（WCAG 2.1 AA）。
- Stripe Test モードで単発・定期の Checkout を実施し、Webhook 成功・Donors 掲示更新を確認。
- `docs/reference/ui/react-app-preview.md` の記載を最新状態に更新。
- Cloudflare Pages build 設定のテスト（Preview プロジェクトで `npm run build` 出力を使う）。

### 5.2 切替実装

- `public/` の `donate/`, `donors/`, `thanks/` を削除し、必要に応じて `functions/` 側で 301 リダイレクトを追加。
- `functions/index.ts` を `/` → `/new/donate` へ変更し、環境によって `APP_BASE_URL` に応じた URL を生成。
- `scripts/run-next-on-pages.cjs` で生成される `_routes.json` の除外設定が最新であるか検証（`/api/*`, `/oauth/*`, `/health`, `/donors/*` などが含まれること）。
- Cloudflare Pages の Build 設定（`Build output: .open-next`, `Functions dir: .open-next/functions`）を本番プロジェクトに適用。

### 5.3 QA & 検証

- Preview 環境で 301 ルールと新ページが機能するか手動確認（デスクトップ/モバイル）。
- `npm run build` → `npm run cf:build` → Pages Preview での QA を行い、各パスの 200/301 を `wrangler pages deployment` ログで確認。
- Cloudflare Analytics で 404 が急増しないか、Stripe webhook 成功率に変化がないかを数日監視。

### 5.4 公開 & フォロー

- 公開日前に Discord コミュニティへ告知（変更点とロールバック窓口を明記）。
- 切替直後は 1 日あたりのアクセスと Stripe 決済をモニタリングし、CS 対応の窓口を共有。
- 切替完了後、旧静的ページのソースやアセットは Git 管理から削除し、plan のステータスを `active` に更新。

## 6. リスクと緩和策

| リスク               | 内容                                     | 緩和策                                                                                                         |
| -------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 301 リダイレクト漏れ | 旧 URL が 404 になる                     | 切替前にリダイレクトリストをチームレビュー、Playwright で URL リストを自動確認。                               |
| Stripe Webhook 失敗  | 新 UI での metadata 更新が反映されない   | 切替後すぐに実決済テスト（Test & Live）を実施し、ログ監視。                                                    |
| Discord OAuth エラー | `APP_BASE_URL` が切替後に一致しない      | 切替手順に `APP_BASE_URL` 再設定と Discord redirect URL 更新を組み込む。                                       |
| SEO 影響             | 検索流入が減少                           | 301 永続リダイレクトを設定し、Search Console でカバレッジ監視。                                                |
| ロールバック困難     | 新 UI に障害が発生した場合に復旧できない | Cloudflare Pages のデプロイ履歴で旧バージョンへ戻す手順を Runbook に追記し、旧 HTML/Functions を保存しておく。 |

## 7. ロールバック

1. Cloudflare Pages の最新デプロイから 1 つ前の成功デプロイへロールバック。
2. リポジトリで旧静的ページと Functions のブランチを保持し、必要に応じて revert。
3. 緊急性が高い場合は `dev` ブランチを切替前のリビジョンへ戻し再デプロイ（事後に変更理由を記録）。

## 8. 体制・担当

| ロール             | 主な責務                                           | 候補                  |
| ------------------ | -------------------------------------------------- | --------------------- |
| プロジェクト責任者 | 本計画承認、切替判断、コミュニケーション統括       | @donation-portal-core |
| 実装担当           | 旧ページ撤去、Next.js ビルド設定更新、デプロイ準備 | Web チーム            |
| QA リード          | Stripe/Discord 回帰テスト、Playwright クロール     | QA チーム             |
| 運用担当           | 監視設定、コミュニティ告知、ロールバック対応       | Ops チーム            |

## 9. 次のアクション

1. 本計画をチームレビューし、承認後にステータスを `active` へ更新。
2. 作業チケットを Phase ごとに作成（準備、切替、QA、公開）。
3. 切替ウィンドウ（日時）を関係者と合意し、前日までに旧ページの最終バックアップを取得。
4. 作業中と直後のモニタリング担当者を指名し、連絡先を共有。
