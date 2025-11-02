---
title: "Phase 1-6 Implementation Survey"
domain: "donation-portal"
status: "active"
version: "1.0.0"
created: "2025-10-31"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - ../../plan/donation-portal/phase-01-foundation/plan.md
  - ../../plan/donation-portal/phase-02-oauth/plan.md
  - ../../plan/donation-portal/phase-03-checkout/plan.md
  - ../../plan/donation-portal/phase-04-donors/plan.md
  - ../../plan/donation-portal/phase-05-webhook/plan.md
  - ../../plan/donation-portal/phase-06-qa/plan.md
  - ../../guide/operations/phase-06-qa-release.md
---

# 調査概要

Phase 1〜6 の計画で定義された成果物がコードベースとドキュメントに反映されているかを確認した。リポジトリの実装内容とテスト結果を調べ、達成済みの項目・未確認項目を整理している。本調査は `ed0ac9881ca2ec16332ed3f45d69fe38cd247a7d` 時点の `dev` ブランチをベースとし、Stripe/Discord 連携の主要ユースケースについてコードレビューとテスト実行ログを突き合わせて確認した。

## 調査対象と証跡

- **コードベース**: `functions/` 配下の Pages Functions、`public/` 配下の UI スクリプト、`src/lib/` の共通ユーティリティを中心に確認。
- **ドキュメント**: 各 Phase の `docs/plan/` および関連する `docs/guide/`/`docs/reference/` の整合性を調べ、受け入れ基準が最新化されているかをチェック。
- **テスト結果**: `npm test` を実行し、OAuth／Checkout／Donors／Webhook／Health のユニットテスト 52 件が成功することを確認。
- **未確認項目**: Cloudflare Pages のデプロイログや Stripe Live 環境の切り替えはリポジトリ外に証跡が存在する想定のため、本調査では未確認扱いとした。

## 調査方法

- `functions/`, `src/lib/`, `public/` 配下の主要実装ファイルを精読し、各 API／UI の仕様と Phase ごとの acceptance criteria を照合。
- `docs/plan/` と `docs/guide/` の関連資料を読み、更新状況と実装の差異がないかを確認。
- `npm test` 実行ログとテストケースを確認し、主要ユースケースを網羅しているかを判断。
- 計画書に記載された運用項目（Cloudflare Pages、Stripe Live 切替など）のうち、リポジトリ内で完結しない内容は「未確認」とした。

## 総合評価

| フェーズ | 判定 | コメント |
| --- | --- | --- |
| Phase 1 | ✅ 実装内容確認済み | リポジトリ構成・ビルド/テストスクリプトが整備済み。CI とデプロイ結果はリポジトリだけでは判別不可。 |
| Phase 2 | ✅ 実装内容確認済み | Discord OAuth の start/callback・セッション Cookie・`/donate` UI が揃っている。 |
| Phase 3 | ✅ 実装内容確認済み | Checkout API と寄付ボタンが Stripe metadata を更新する実装に一致。 |
| Phase 4 | ✅ 実装内容確認済み | Donors API・Consent API・`/donors` UI が動作し、撤回導線も実装済み。 |
| Phase 5 | ✅ 実装内容確認済み | Stripe Webhook・冪等処理・Health エンドポイントが存在し、テストも用意されている。 |
| Phase 6 | ⚠️ 書類と実装の準備のみ確認 | QA/Release Runbook はあるが、Live キー投入・本番デプロイ完了の証跡はリポジトリ内に存在しない。 |

以下、フェーズ別の詳細を記す。

## Phase 1 — Project Foundation

| 受け入れ基準 | 状態 | 根拠・備考 |
| --- | --- | --- |
| リポジトリ構成とビルド設定が整備されている | ✅ | `package.json`, `tsconfig.json`, `wrangler.toml`, `functions/`, `public/`, `src/`, `scripts/` が揃い、テスト/ビルド/開発用スクリプトが用意されている。 |
| CI パイプラインが main/dev で成功する | ⚠️ 未確認 | GitHub Actions の結果やバッジはリポジトリに含まれておらず、外部サービスを確認できないため未評価。 |
| Cloudflare Pages プレビューが表示される | ⚠️ 未確認 | デプロイ URL やログは含まれていない。 |
| ローカルで Pages Functions を実行できる | ⭕ 満たしていると判断 | `npm run dev` が wrangler 経由で Functions を起動する想定のスクリプトとして整備されている。 |

## Phase 2 — OAuth & Session

| 受け入れ基準 | 状態 | 根拠・備考 |
| --- | --- | --- |
| Discord OAuth 完了後に sess Cookie が発行される | ✅ | `functions/oauth/start.ts` と `functions/oauth/callback.ts` が state Cookie 発行と Discord API 連携を実装し、`issueSessionCookie` で署名付き Cookie を返している。 |
| state 改ざん／TTL 超過で 400/401 を返す | ✅ | `stateCookieService` の TTL は 600 秒に固定され、`verifySignedCookie` の検証で署名・有効期限がチェックされる。異常時は `/donate?error=` へリダイレクト。 |
| `/donate` UI がログイン状態と同意フローを反映する | ✅ | `public/donate/app.js` が sess Cookie を解析してログイン状態・同意チェックボックス・寄付ボタンの有効化を切り替える。 |

## Phase 3 — Checkout & Metadata

| 受け入れ基準 | 状態 | 根拠・備考 |
| --- | --- | --- |
| 単発/定期寄付の Checkout セッション生成 | ✅ | `functions/api/checkout/session.ts` が `mode`/`interval`/`variant` を検証し、Price ID を環境変数から取得して `POST /v1/checkout/sessions` を呼び出す。 |
| Stripe Customer metadata の更新 | ✅ | 同ファイルで `ensureCustomer` が `metadata[display_name]` などを上書きし、既存 Customer の検索・作成を実装。 |
| UI の寄付ボタンが Checkout API と連携 | ✅ | `public/donate/app.js` が `fetch('/api/checkout/session')` でレスポンス URL にリダイレクトし、エラー時のメッセージ表示も含む。 |
| `/thanks` に感謝メッセージと注意書き | ✅ | `public/thanks/index.html` が寄付完了文言と方針説明を掲載。 |

## Phase 4 — Donors & Consent

| 受け入れ基準 | 状態 | 根拠・備考 |
| --- | --- | --- |
| Donors ページで consent_public=true の表示名を掲示 | ✅ | `functions/api/donors.ts` が Stripe search で consent_public=true を抽出し、`public/donors/app.js` がリスト表示とキャッシュ注意書きを提供。 |
| Consent API が掲示同意の更新に対応 | ✅ | `functions/api/consent.ts` が sess Cookie を検証し、Customer metadata を更新後 204 を返却する。 |
| 撤回操作で UI が更新される | ✅ | Donors ページの撤回ボタンが API 成功時にリストから名前を削除し、ステータス表示とカウントを更新。 |
| API リファレンスの草案 | ✅ | `docs/reference/api/donors.md` と `docs/reference/api/consent.md` が存在し、実装済みステータスを記載。 |

## Phase 5 — Webhook & Operations

| 受け入れ基準 | 状態 | 根拠・備考 |
| --- | --- | --- |
| Stripe Webhook が署名検証と冪等処理を行う | ✅ | `functions/api/webhooks/stripe.ts` が署名解析・HMAC 検証・event.id ごとのメモリキャッシュを実装し、対象イベントでログを出力する。 |
| 署名不正時に 400、重複時に冪等応答 | ✅ | 同ファイルの制御分岐とテストが確認できる。 |
| Health エンドポイントが利用可能 | ✅ | `functions/health.ts` および `functions/api/health.ts` が監視用レスポンスを返す。 |
| Webhook 運用手順がドキュメント化 | ✅ | `docs/guide/payments/stripe-webhook-operations.md` が登録・テスト・障害対応手順を整理。 |

## Phase 6 — QA & Release

| 受け入れ基準 | 状態 | 根拠・備考 |
| --- | --- | --- |
| 総合テスト結果が保存されている | ⚠️ 未確認 | Runbook (`docs/guide/operations/phase-06-qa-release.md`) にチェックリストはあるが、実施結果の記録やリンクは見当たらない。 |
| Stripe Live キー投入と本番デプロイ完了 | ⚠️ 未確認 | 環境変数や Secrets の Live 値はリポジトリに含まれず、完了報告も確認できない。 |
| 運用ドキュメントが最新化 | ✅ | Runbook と Stripe Webhook ガイドが Phase 6 の準備に合わせて更新済み。 |

## テスト状況

- `npm test` は 52 件のテストを全て成功させ、OAuth／Checkout／Donors／Webhook／Health のユースケースが自動化されている。
- テストでは Stripe API コールや Discord OAuth をモックし、例外処理・冪等性・アクセシビリティ要件の検証が含まれている。

## 残課題・フォローアップ

- Phase 1 の CI 成功実績、Cloudflare Pages プレビュー URL はリポジトリから確認できないため、別途デプロイログの共有が必要。
- Phase 6 の Live 切替と QA 実績が未確認。Runbook のチェックリストを Notion / Jira 等で運用し、証跡リンクを追記することを推奨。
- ドキュメント上は Phase 1, 3, 4, 5 の plan が `status: draft` のままになっており、実装完了に合わせてステータス更新を検討すると整合性が高まる。
