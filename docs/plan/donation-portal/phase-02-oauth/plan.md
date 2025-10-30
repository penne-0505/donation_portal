---
title: "Donation Portal Phase 2 — OAuth & Session 計画"
domain: "donation-portal"
status: "active"
version: "0.1.1"
created: "2025-10-29"
updated: "2025-10-31"
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/mvp/plan.md
  - docs/draft/interface_definition.md
scope:
  - "Discord OAuth を利用した表示名取得と掲示同意フローを実装する。"
  - "署名付き state Cookie と sess Cookie による短期セッション管理を実現する。"
  - "`/donate` ページに OAuth 導線と掲示同意 UI を統合する。"
non_goals:
  - "Stripe Checkout 連携や metadata 更新。"
  - "Donors ページの掲示 or consent 更新 API。"
  - "監視・Slack 通知などの運用整備。"
requirements:
  functional:
    - "`GET /oauth/start` と `GET /oauth/callback` を Pages Functions として実装する。"
    - "Discord OAuth の state 保護に HMAC 署名付き Cookie を利用する。"
    - "`/donate` に Discord ログイン導線、掲示同意チェックボックス、状態表示を追加する。"
  non_functional:
    - "state TTL は 10 分、期限切れや改ざんなら 401/400 を返す。"
    - "Cookie は Secure/HttpOnly/SameSite=Lax を満たす。"
    - "１名稼働で 4 日以内に完了する。"
constraints:
  - "Discord OAuth スコープは identify のみ。"
  - "Frontend は TypeScript + minimal framework (vanilla/Next 等) で既存構成に従う。"
  - "Cloudflare Workers の Crypto API を用い HMAC-SHA256 を実装する。"
api_changes:
  new:
    - name: "GET /oauth/start"
      description: "掲示同意フラグを受け取り、署名付き Cookie に保存して Discord 認可画面へリダイレクトする。"
    - name: "GET /oauth/callback"
      description: "state 検証とトークン交換を行い、表示名/discord_id/consent を sess Cookie に保存する。"
  updates: []
  deprecated: []
data_models:
  - "state Cookie: {nonce, consent_public, exp} を JSON で記録し署名。"
  - "sess Cookie: {display_name, discord_id, consent_public, exp} を JSON で記録し署名（TTL=600秒）。"
migrations:
  - "なし。"
rollout_plan:
  - "Discord OAuth アプリを Test 用に設定し、リダイレクト URI を登録する。"
  - "ローカル/Cloudflare Pages プレビューで OAuth フローが動作することを確認する。"
rollback:
  - "Discord OAuth 設定を一時的に無効化し、`/donate` からログイン導線を隠す。"
  - "不正な Cookie 発行が判明した場合は COOKIE_SIGN_KEY をローテーションする。"
test_plan:
  - "state 改ざん・TTL 失効・二重リクエストのユニット/統合テスト。"
  - "Discord OAuth 実機テスト（成功/キャンセル/エラー）。"
  - "Cookie 属性 (Secure/HttpOnly/SameSite) の自動テストまたはマニュアル確認。"
observability:
  - "OAuth 成功/失敗を Cloudflare Logs に記録し、event sampling を Phase 5 で Slack 通知に接続。"
security_privacy:
  - "Discord Client Secret、COOKIE_SIGN_KEY は Cloudflare Env Bindings で管理。"
  - "ログには表示名や discord_id を出力しない。"
performance_budget:
  - "OAuth 関連のレスポンスは 500ms 以内を目標。"
i18n_a11y:
  - "`/donate` のボタンやチェックボックスに aria-label と日本語説明文を追加する。"
acceptance_criteria:
  - "Discord OAuth 完了後に sess Cookie が発行され、同意 ON/OFF が UI に反映される。"
  - "state 改ざんや TTL 超過時に 400/401 を返し、UI が再ログイン導線を表示する。"
  - "Pages プレビューでも同様の挙動を確認できる。"
owners:
  - "@donation-portal-core"
---

# Phase 2 — OAuth & Session 計画

## 1. 目的

寄附前に Discord で表示名と掲示同意を取得し、Stripe Checkout へ渡すためのセッション基盤を構築する。

## 2. 背景と前提

- Phase 1 でリポジトリと CI/CD は整備済み。
- Discord OAuth credentials は Test 環境で取得可能。
- Stripe 連携は未実装のため、OAuth 完了後は `/donate` に戻すのみ。

## 3. タスク詳細

1. **OAuth Start Function**
   - HMAC 署名付き state Cookie（consent, nonce, exp）を発行。
   - Discord 認可 URL を生成し 302 リダイレクト。
   - 入力の consent_public は `true | false` のみ許容。

2. **OAuth Callback Function**
   - state 検証（署名・TTL・nonce）。
   - Discord API から `id`, `global_name`/`username` を取得。
   - sess Cookie を発行し `/donate` へ 302。
   - 失敗時は `/donate?error=` などにリダイレクトし、UI で再試行を促す。

3. **フロントエンド更新**
   - `/donate` に OAuth ボタン、掲示同意チェックボックス、ログイン状態表示を追加。
   - sess Cookie の有無で UI を切り替え、consent_public の初期値を反映。
   - エラー発生時のメッセージ表示とログ出力（console.warn レベル）。

4. **ドキュメント整備**
   - OAuth フロー概要を `docs/guide/auth/discord-oauth.md`（ドラフト）に記載。
   - Secrets 設定手順を Runbook に追加。

## 4. 成果物

- `functions/oauth/start.ts`, `functions/oauth/callback.ts`
- 更新済み `/src/donate/index.tsx`（仮）と関連スタイル。
- OAuth フロー仕様と設定手順のドキュメントドラフト。

## 5. リスクと対応

| リスク | 影響 | 対応策 |
| --- | --- | --- |
| OAuth state 漏洩 | セッション乗っ取り | HMAC と TTL、nonce で防御。 |
| Discord API 失敗 | ユーザ流出 | リトライガイドとエラーログ記録。 |
| Cookie 設定ミス | 401 連発 | 自動テスト＋ブラウザ確認で検証。 |

## 6. スケジュール

- Day 1: Function 実装とユニットテスト。
- Day 2: フロント連携と統合テスト（ローカル）。
- Day 3-4: Pages プレビュー検証、ドキュメント更新、レビュー対応。

## 7. 完了条件

- Acceptance Criteria を満たし、Phase 3 の Checkout 実装で sess Cookie を利用可能。
- Discord OAuth の設定手順が共有され、再現性が担保される。

## 8. 関連タスク

- [Core-Feature-2](../../../../TODO.md#core-feature-2)
