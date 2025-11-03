---
title: "Donation Portal Comprehensive Refactor Plan"
domain: "donation-portal"
status: "proposed"
version: "0.1.0"
created: "2025-11-01"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - docs/standards/documentation_guidelines.md
  - docs/standards/documentation_operations.md
  - docs/intent/donation-portal/mvp-architecture-and-phases.md
scope:
  - "Pages Functions・`src/lib`・`public` を横断したアーキテクチャ再編で保守性と可観測性を向上させる。"
  - "API レイヤーのエラー/レスポンス仕様を統一し、Stripe/Discord 連携ロジックの重複を排除する。"
  - "テスト・CI/CD・ドキュメントを刷新し、継続的なリファクタリングが可能な体制を構築する。"
non_goals:
  - "Stripe 以外の決済手段や新規特典機能の追加。"
  - "Cloudflare Pages から別ホスティング基盤への移行。"
  - "SSOT を Stripe 以外に移す永続化方式の導入。"
requirements:
  functional:
    - "全既存エンドポイント（OAuth, Checkout, Consent, Donors, Webhook, Health）の公開インターフェースを後方互換で維持する。"
    - "`public/` 配下の画面フロー（/donate→Checkout→/thanks, /donors 掲載, 撤回処理）を現行仕様通りに保つ。"
  non_functional:
    - "主要ユーティリティの重複を削減し、コードベースの循環依存を 0 件にする。"
    - "ユニット/統合テストの網羅率（ファイルベース）を 85% 以上に引き上げる。"
    - "CI パイプラインの総実行時間を 5 分以内に維持する。"
constraints:
  - "Pages Functions は ESM モジュールを維持し、Wrangler ビルドフローを変えない。"
  - "Stripe Customer metadata を唯一の永続ストアとし、追加のデータベースを導入しない。"
  - "Discord OAuth スコープやリダイレクト URI は既存設定を踏襲する。"
api_changes:
  new: []
  updates:
    - name: "POST /api/checkout/session"
      description: "エラー応答とメタデータ書き込み処理を共通ユーティリティへ委譲し、レスポンススキーマを標準化する。"
    - name: "POST /api/consent"
      description: "成功時レスポンスを 204 固定とし、セッション更新ロジックを共有化する。"
    - name: "POST /api/webhooks/stripe"
      description: "冪等処理とログ出力をミドルウェア化し、遅延計測メトリクスを追加する。"
    - name: "GET /api/donors"
      description: "キャッシュ制御ヘッダとペイロード生成を新しいプレゼンター層へ移行する。"
  deprecated: []
data_models:
  - "Stripe Customer metadata に `last_checkout_at`, `consent_updated_at` を追加し、運用監視に活用する。"
  - "セッション Cookie の署名ペイロードを `version:2` 形式にし、互換性のための decoder を用意する。"
migrations:
  - "Stripe Customer metadata の既存レコードに新規フィールドをバッチ投入するスクリプトを用意し、Test → Live の順で適用する。"
  - "既存 Cookie の再署名は自然切り替えとし、v1 形式は 30 日で廃止する。"
rollout_plan:
  - "Phase 0: 現行挙動のメトリクス化とベースライン収集。"
  - "Phase 1: コアライブラリの分割と型ガード整備 (`src/lib`)."
  - "Phase 2: API 層のミドルウェア化とレスポンス整形統一 (`functions/api`)."
  - "Phase 3: フロントエンド UI の状態管理刷新と共有フック導入 (`public/`)."
  - "Phase 4: CI/CD・テスト・監視の強化、ドキュメント更新。"
rollback:
  - "各 Phase ごとにリリースタグを打ち、問題発生時は前段階タグへ Cloudflare Pages デプロイをロールバックする。"
  - "Stripe metadata スクリプトは dry-run 付きで実行し、異常時は更新レコードリストを用いて手動復旧する。"
  - "Cookie ペイロードのバージョンは Feature Flag で切替え、障害時は v1 デコーダーのみを許可する。"
test_plan:
  - "ユニットテスト: `src/lib/*` の純粋関数と Cookie/State ユーティリティを対象にケース網羅。"
  - "統合テスト: `tests/**` を再編し、API ごとに happy/edge ケースとリグレッションを自動化。"
  - "契約テスト: Stripe/Discord のモックを更新し、Webhook プロファイルと Checkout Session の外部依存を検証。"
  - "E2E テスト: Cloudflare Pages プレビューを用いたブラウザシナリオを Playwright で 3 パターン追加。"
observability:
  - "Cloudflare Logs に構造化 JSON を出力し、`request_id` や `latency_ms` を標準化する。"
  - "Stripe Webhook の処理結果を Metrics API へ送信し、再送率をダッシュボード化する。"
  - "エラー追跡に Sentry 互換エンドポイント（Workers Analytics Engine）を利用し、週次レビューを行う。"
security_privacy:
  - "新ユーティリティでログ出力前に表示名・discord_id をマスクする。"
  - "Secrets バインディング使用箇所を集中管理し、権限監査ログを整備する。"
  - "Cookie 再署名に伴い HMAC キーのローテーション計画を策定し、侵害時の無効化手順を明文化する。"
performance_budget:
  - "Pages Functions P95 応答時間を 400ms 以下、Webhook ACK P95 を 150ms 以下に維持する。"
  - "フロントエンドの初回ロードサイズを 200KB gzipped 以下に抑える。"
  - "CI パイプライン全体で 5 分以内、ユニットテストは 90 秒以内を目標とする。"
i18n_a11y:
  - "日本語 UI テキストの一貫性を保ち、共通翻訳辞書を `src/lib/i18n` に集約する。"
  - "キーボード操作とスクリーンリーダーのフォーカス管理を `/public/donate` と `/public/donors` に適用する。"
  - "新規 UI 変更時は WCAG 2.1 AA のチェックリストを更新する。"
acceptance_criteria:
  - "全 API テストがグリーンで、後方互換性テスト（v1 Cookie, 既存メタデータ）が成功する。"
  - "Cloudflare Pages プロダクションで 7 日間エラー率 < 0.5%、Stripe 再送イベント 0 件を確認する。"
  - "コードベースの循環依存が ESLint ルールで検出 0 件となる。"
  - "Docs (`guide`, `reference`, `operations`) が更新され、関連 Runbook がレビュー承認済みになる。"
owners:
  - "@donation-portal-core"
---

# Donation Portal 包括的リファクタリング計画

## 1. 背景
MVP リリース後、`functions/api/` と `src/lib/` に重複ユーティリティや断片的な例外処理が増加し、Stripe/Discord 連携まわりの回帰リスクが高まっている。Cloudflare Pages 上の監視やテストも暫定的な実装に留まり、将来の機能拡張（任意額対応、通知強化など）に備えた基盤が不足している。本計画は既存機能の後方互換を維持しつつ、コードベースを再構築して継続的改善を容易にすることを目的とする。

## 2. 現状課題サマリ
- **API 層の一貫性不足**: `functions/api/consent.ts` のように自前レスポンス生成と Stripe 呼び出しが密結合で、例外処理が各ファイルに散在している。
- **共通ロジックの重複**: Cookie 発行・検証や Stripe 呼び出しが複数のモジュールに分散し、型安全性が保証されていない。
- **テストカバレッジの偏り**: `tests/` には API ごとのテストが存在するものの、失敗パターンやレース条件に対する網羅が不十分。
- **監視の粒度不足**: Webhook や Checkout の latency を計測する仕組みがなく、障害時の MTTR が長期化するリスクがある。
- **ドキュメントの分散**: 実装意図や運用手順が draft/archives に散在し、最新のベストプラクティスが把握しづらい。

## 3. リファクタリングで実現したい状態
1. API レイヤーが共通ミドルウェアを用いて `JSON` 応答・ログ・エラー分類を一括管理する。
2. `src/lib` がドメイン別モジュール（auth, payments, donors, infra）に再編され、Pages Functions から薄いアダプターで呼び出せる。
3. Stripe/Discord 連携が抽象化され、テストで外部 API をモックしやすい構造になる。
4. Cloudflare Pages/Workers Analytics を用いたメトリクス・ログが SLO を測定できる状態になり、異常検知が自動化される。
5. ドキュメント・Runbook・CI 設定が更新され、新しい開発者が 1 スプリント以内に onboarding できる。

## 4. フェーズ別計画
### Phase 0: ベースライン確立（1 週間）
- 本番・プレビュー双方でエラー率、レスポンスタイム、Stripe 再送イベント数を収集。
- ESLint/TypeScript で循環依存検知ルール（`import/no-cycle` など）を導入し、現状の違反を棚卸し。
- 既存テストスイートの実行時間と失敗パターンを測定し、改善対象を記録。
- **Exit Criteria**: ベースラインレポート作成、改善対象 Issue 化、計測タグを wrangler.toml に追記。

### Phase 1: コアライブラリ再編（2 週間）
- `src/lib/auth/` と `src/lib/oauth/` を中心に、Cookie/State/Session ユーティリティを `src/lib/core/` へ統合。
- Stripe API 呼び出しを `src/lib/payments/stripeClient.ts`（仮）に切り出し、retry・タイムアウトを共通化。
- 型安全な環境変数ラッパーを追加し、Pages Functions から env アクセスを一元化。
- **Exit Criteria**: 共通ユーティリティの重複削減、ESLint 循環依存 0 件、主要関数に単体テスト追加。

### Phase 2: API ミドルウェア導入（2 週間）
- `functions/api/*` にリクエストバリデーション・レスポンス整形・ログ出力を担う共通ミドルウェアを挿入。
- Checkout/Consent/Webhook のエラーハンドリングを統一し、`ErrorBody` のシリアライズを 1 箇所に集約。
- Stripe metadata 書き込み処理を共通関数化し、`consent_updated_at` の記録を追加。
- **Exit Criteria**: 各エンドポイントでミドルウェア採用、レスポンス仕様がドキュメント化、API テスト更新。

### Phase 3: フロントエンド刷新（2 週間）
- `/public/donate/app.js` などで直接 fetch を行っている箇所を共有フック（例: `useCheckoutSession`）に置き換え、エラーハンドリングとローディング制御を統一。
- UI コンポーネントのアクセシビリティ属性・フォーカス制御を整備し、同意フローの UX を改善。
- i18n 辞書を導入し、固定文言を一元管理。
- **Exit Criteria**: 共通フック導入、UI テスト（Playwright）成功、Lighthouse でアクセシビリティ 90 点以上。

### Phase 4: 品質保証と運用強化（1 週間）
- GitHub Actions で Lint → Test → Build → Deploy のパイプラインを再編し、Parallel 実行で 5 分以内へ短縮。
- Cloudflare Logs を Workers Analytics Engine に接続し、Webhook 成功率ダッシュボードを公開。
- `docs/guide/`・`docs/reference/`・`docs/operations/` を更新し、Runbook を最新化。
- **Exit Criteria**: CI グリーン、監視ダッシュボード稼働、ドキュメントレビュー完了。

## 5. クロスカットワークストリーム
- **Configuration & Secrets**: Wrangler `env` 管理を整理し、Feature Flag で新旧ロジックを切り替え。
- **データ移行**: Stripe metadata へのフィールド追加を Test → Staging → Production の順に適用し、サンプル顧客で検証。
- **開発者体験 (DX)**: ESLint/Prettier 設定を共有し、`scripts/run-*` を整理。コミット前フックの導入を検討。
- **ドキュメント**: 各フェーズ完了時に plan を更新し、Intent への昇格条件を満たすよう進捗を記録。

## 6. 依存関係と準備作業
- Stripe: Test/Live 双方で `last_checkout_at`, `consent_updated_at` の空フィールド追加を許容することを確認。
- Discord: OAuth リダイレクト URL が一時的に増える場合に備えた許可設定を事前に用意。
- Cloudflare: Workers Analytics Engine と Pages Analytics API の有効化権限を取得。
- Docs Platform WG: Runbook レビューとアクセシビリティ監査のスケジュール確保。

## 7. リスクと緩和策
| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| Stripe metadata 移行で既存値を上書き | 寄付履歴の整合性崩壊 | バックアップ用に顧客リストをエクスポートし、dry-run 結果を比較レビュー |
| Cookie v2 ロールアウトで互換性問題 | ログイン維持が切れ、寄付導線が遮断 | Feature Flag で段階的展開、v1/v2 デコーダー併存期間を 30 日確保 |
| ミドルウェア導入でレスポンス遅延 | Webhook ACK 遅延により Stripe 再送増加 | latency 計測を導入し、Phase 2 中に P95 を監視 |
| フロント構造のリライトによるバグ混入 | Donors 掲載が遅延/失敗 | Playwright E2E と手動 QA チェックリストを前倒し実行 |
| CI 並列化の失敗 | パイプライン停止 | 段階的にジョブを移行し、1 ジョブずつ並列化 |

## 8. コミュニケーションとドキュメント整備
- フェーズ開始時に Discord #donation-portal-dev で作業範囲と影響を共有し、質疑を 24 時間以内に返答する。
- 各フェーズ完了後、`docs/plan/donation-portal/comprehensive-refactor-2025/plan.md` を更新して進捗と差分を明記。
- Intent への昇格時には決定事項・トレードオフ・未解決課題を `docs/intent/` へ記録し、archives 移行条件を満たす。
- Runbook／QA 手順は `docs/operations/phase-06-qa-release.md` を参照しつつ最新版へ追記。

## 9. メトリクスとフォローアップ
- Cloudflare Analytics と Stripe Dashboard の指標を週次でレビューし、SLO 逸脱時は Incident レポートを作成。
- テストカバレッジと循環依存のレポートを CI で保存し、リファクタリング完了までダッシュボード化。
- 本計画完了後 1 ヶ月間は監視・アラート設定を強化し、突発的な回帰に対してローリングレビューを行う。
- 次フェーズ（任意額対応など）の検討材料として、残課題・改善案を `docs/draft/` にメモ化する。
