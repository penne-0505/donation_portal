---
title: "Donation Portal MVP 実装計画"
domain: "donation-portal"
status: "draft"
version: "0.1.0"
created: "2025-10-29"
updated: "2025-10-29"
related_issues: []
related_prs: []
references:
  - docs/draft/interface_definition.md
  - docs/draft/impl_plan_v0.md
scope:
  - "Cloudflare Pages 上で /donate・/thanks・/donors を提供し、任意の単発/定期寄附を Stripe Checkout で受け付ける。"
  - "Discord OAuth を用いた表示名取得と掲示同意フロー、Stripe Customer metadata を単一のデータソースとして扱う。"
  - "Pages Functions による API 群（OAuth、Checkout、Donors、Consent、Webhook、Health）を MVP としてリリースする。"
non_goals:
  - "寄附額に応じた特典・ロール付与や物理的リワードの提供。"
  - "Stripe 以外の決済手段や自前データベースの導入。"
  - "Cloudflare Pages 以外のホスティング・独自ドメイン対応。"
requirements:
  functional:
    - "Discord OAuth による表示名・掲示同意の取得と短期セッション管理。"
    - "Stripe Checkout を用いた単発 (¥300) / 定期 (¥300, ¥3,000) 寄附フローの提供。"
    - "Donors ページで同意者の表示名のみを掲示し、撤回操作で即時非掲載とする。"
  non_functional:
    - "Webhook は Stripe-Signature を検証し、重複イベントを冪等に処理する。"
    - "API 応答は 1 秒以内、Webhook ACK は 200ms 以内を目標に早期 200 を返す。"
    - "UI 文言に『対価なし』『税控除なし』を明示し、24/7 可用性を想定する。"
constraints:
  - "SSOT は Stripe Customer / Event。永続ストレージは Stripe のみ使用。"
  - "Cookie は Secure / HttpOnly / SameSite=Lax、TTL=10分とする。"
  - "同一オリジンのみを許可し、CORS を外部に開放しない。"
api_changes:
  new:
    - name: "GET /oauth/start"
      description: "Discord OAuth 認可開始。consent_public を state と共に署名付き Cookie へ格納し Discord へリダイレクト。"
    - name: "GET /oauth/callback"
      description: "Discord からの戻り処理。state 検証、プロフィール取得、署名付き sess Cookie 発行。"
    - name: "POST /api/checkout/session"
      description: "Stripe Checkout Session を作成し、Customer metadata を SSOT として更新。"
    - name: "POST /api/webhooks/stripe"
      description: "Stripe Webhook を受信。署名検証と冪等化を行い、ログのみを記録。"
    - name: "GET /api/donors"
      description: "consent_public=true の Customer から表示名一覧を返却。"
    - name: "POST /api/consent"
      description: "掲示同意の更新。sess Cookie に紐づく Customer の consent_public を変更。"
    - name: "GET /health"
      description: "監視用ヘルスチェック。"
  updates: []
  deprecated: []
data_models:
  - "Stripe Customer metadata に display_name, display_name_source=discord, discord_id, consent_public を保持する。"
  - "セッション情報は署名付き Cookie (state, sess) に限定し、永続化しない。"
migrations:
  - "なし（Stripe metadata 更新のみで追加マイグレーション不要）。"
rollout_plan:
  - "GitHub Actions で lint / test / build / Pages デプロイの CI パイプラインを構築する。"
  - "Cloudflare Pages のプレビュー環境で Stripe Test キー／Discord Test 設定を用いた E2E テストを実施する。"
  - "Live 切替前に Stripe Live キーと Price ID を環境変数へ投入し、手動スモークテストを行う。"
rollback:
  - "Stripe Webhook を一時停止し、Pages デプロイを前バージョンへロールバックする。"
  - "Discord OAuth リダイレクト URL を無効化し、一時的に寄附フォームへの導線を停止する。"
test_plan:
  - "OAuth state 改ざん・TTL 失効・二重同意のユースケースをカバーする統合テスト。"
  - "Stripe Checkout 単発／定期／エラー分岐のモックテストと、Test ダッシュボードでの手動確認。"
  - "Webhook の署名検証成功/失敗、event.id 冪等性、Donors API のキャッシュ制御のテスト。"
observability:
  - "Stripe Webhook 成功/失敗ログと event.id を Cloudflare Logs へ送出し、重複検知を可視化する。"
  - "Pages Functions のエラーログを Slack 通知へ転送する軽量なワークフローを整備する。"
security_privacy:
  - "Cookie HMAC 用シークレットと Stripe/Discord 資格情報を Pages の Env Bindings で管理する。"
  - "個人情報は Stripe にのみ保持し、ログへ表示名・ID を出力しない。"
performance_budget:
  - "Pages Functions の応答時間 P95 < 500ms、Webhook ACK P95 < 200ms を目標とする。"
  - "Donors API は 200 名取得時でも 1 秒以内に応答する。"
i18n_a11y:
  - "日本語 UI を既定とし、ボタン/リンクにはアクセシビリティ対応のラベルを付与する。"
  - "Stripe Checkout の言語設定を ja-JP に固定し、スクリーンリーダ向けに主要操作へ aria-label を付与する。"
acceptance_criteria:
  - "単発/定期寄附完了後に /thanks へリダイレクトされ、Stripe レシートのみ送信される。"
  - "Donors ページで consent_public=true の表示名のみが 60 秒以内に更新される。"
  - "Webhook が署名検証を通過し、重複 event.id を無害化できる。"
  - "全画面に『対価なし』『税控除なし』が明記されている。"
owners:
  - "@donation-portal-core"
---

# Donation Portal MVP 実装計画

本計画は `docs/draft/interface_definition.md` と `docs/draft/impl_plan_v0.md` を統合し、Cloudflare Pages 上で Discord コミュニティ向け寄附機能を MVP として公開するための実施手順を定義する。Stripe Customer metadata を単一のデータソースとし、外部依存を最小限に抑えつつユーザー体験と運用負荷のバランスをとる。

## 1. 背景と目的

- Discord コミュニティが任意で寄附できる導線を整備し、同意者のみ Donors ページに表示名を掲示する。
- 寄附に対価や特典を付与せず、Stripe Checkout と Discord OAuth のみで MVP を成立させる。
- Pages Functions によりサーバレスに API と Webhook を実装し、Cloudflare Pages デプロイで運用コストを抑制する。

## 2. スコープと前提

### 2.1 スコープ内
- `/donate`, `/thanks`, `/donors` の静的/ハイブリッドページ実装。
- Discord OAuth による表示名・掲示同意の取得と短期セッション管理。
- Stripe Checkout Session 作成、Webhook 処理、Donors 表示、Consent 更新 API。
- Stripe/Discord/Cloudflare Pages の設定および Secrets 管理、CI/CD パイプライン整備。

### 2.2 非対象
- Stripe 以外の決済手段、寄附額に応じた特典付与。
- Webhook イベントのバックエンド永続化、分析基盤への連携。
- カスタムドメイン導入や多言語展開。

## 3. 依存関係と準備

- **Stripe**: Test/Live 両環境の Price、Webhook Secret、Checkout URL 設定。
- **Discord**: OAuth アプリ登録、`identify` スコープ、リダイレクト URI 設定。
- **Cloudflare Pages**: リポジトリ連携、Env Bindings 設定、Functions ディレクトリ構成。
- **開発環境**: TypeScript/ESLint/Prettier 設定、Wrangler CLI、Stripe CLI（Webhook テスト用）を整備。

## 4. 実装フェーズと主要タスク

### フェーズ1: プロジェクト基盤
- モノレポ構成（`/src`, `/functions`, `/public`, `/scripts`）とビルドツールの初期化。
- TypeScript 設定、ESLint/Prettier、Cloudflare Workers 用型定義、環境変数読み込みユーティリティを準備。
- GitHub Actions に lint/test/build/Pages デプロイを定義し、Secrets 連携の stub を作成。
- 成果物: リポジトリ初期構成、CI Green。

### フェーズ2: OAuth & セッション管理
- `/oauth/start` と `/oauth/callback` の Pages Functions を実装。
- HMAC 署名付き Cookie ユーティリティ、state TTL 検証、sess Cookie（表示名・discord_id・consent）発行を実装。
- `/donate` ページに Discord ログイン導線、掲示同意チェック UI を組み込み。
- 成果物: OAuth 成功で sess Cookie がセットされ、同意状態がフロントで反映される。

### フェーズ3: Checkout セッションとメタデータ更新
- `POST /api/checkout/session` を実装し、Stripe Customer metadata を SSOT として更新。
- 単発/定期の入力バリデーション、Price ID の環境変数化、エラーハンドリングとレスポンススキーマを整備。
- `/donate` ページに単発/定期の寄附ボタン、同意 ON/OFF に応じた挙動を実装。
- 成果物: Checkout URL を受け取り、成功時 `/thanks` へ遷移。

### フェーズ4: Donors 掲示と同意管理
- `GET /api/donors` で Stripe から consent_public=true の表示名を集計し、キャッシュ制御を実装。
- `/donors` ページで表示名一覧と撤回導線を表示、同意状態をフロントで反映。
- `POST /api/consent` による consent_public 更新と API エラーモデル統一。
- 成果物: Donors ページに同意者のみ表示、撤回後 60 秒以内に非掲載。

### フェーズ5: Webhook と運用整備
- `POST /api/webhooks/stripe` で Stripe-Signature 検証、event.id による冪等化、ログ出力を実装。
- Cloudflare Logs へのエクスポート設定、Slack 通知などの軽量監視導線を整える。
- `GET /health` の簡易実装と Pages Functions の 429/5xx ハンドリングを確認。
- 成果物: Webhook の再送耐性と監視基盤の初期セット。

### フェーズ6: QA とリリース
- Stripe Test 環境で単発/定期寄附の E2E、Webhook 再送、Donors キャッシュ挙動を検証。
- Discord OAuth 実機テスト、Cookie TTL/改ざんテスト、UI コピーの最終校閲。
- 本番用 Stripe Live キー投入、Live 環境で少額スモーク、運用 Runbook 整備。
- 成果物: 受け入れ基準を満たす MVP を Pages 本番へデプロイ。

## 5. マイルストーンと完了条件

1. **M1: 基盤準備完了** — CI が成功し、OAuth/Checkout/API のひな型がコンパイル済み。
2. **M2: 機能フリーズ** — フロント・API・Webhook が Test 環境で通しテスト済み。
3. **M3: 本番リリース** — Stripe Live 切替、Donors 掲示確認、監視通知有効化。
4. **M4: 初期運用評価** — デプロイ後 1 週間の障害なし、ログ/寄附フローの安定稼働を確認。

各マイルストーンで acceptance_criteria を確認し、未達項目は次フェーズへ進まない。

## 6. リスクと緩和策

- **OAuth セッション欠如**: sess Cookie が無い場合の 401 応答と UI の再認証導線を明示。
- **Webhook 冪等性不足**: event.id 保存の in-memory キャッシュと Stripe の retry 設定を活用し、ログで検知。
- **Donors キャッシュ遅延**: `Cache-Control: max-age=60` と `ETag` で制御し、撤回操作時はプロンプトで遅延許容を通知。
- **秘密情報漏洩**: Env Bindings 経由でのみ参照し、デバッグログに資格情報や表示名を出さない。
- **Stripe/Discord 設定ミス**: Runbook にチェックリストを用意し、二名レビューで確認。

## 7. モニタリングと運用

- Cloudflare Analytics で HTTP 5xx/429 を監視し、閾値超過で Slack アラート。
- Stripe Dashboard の webhook 成功率・イベントリトライ回数を週次レビュー。
- Donors API のレスポンス時間とキャッシュヒット率を Cloudflare Logs で可視化。
- 障害時は Rollback 手順に従い Pages デプロイを戻し、Webhook を一時停止して調査する。

## 8. ドキュメントと後続タスク

- 本計画の進行に応じて `docs/intent/` へ実装意図を記録し、完了後はガイド/リファレンスへ昇格させる。
- OAuth/Checkout/Donors/API ごとにガイドラインを整備し、利用者向けに公開する。
- MVP 運用状況を踏まえ、次期フェーズでの拡張（任意額、ログ分析）の調査を `docs/draft/` に記録する。

以上により、Donation Portal MVP を安全かつ最小限の運用コストで公開できる計画を確立する。
