---
title: '寄付受付 要件定義書'
domain: 'donation-portal'
status: 'superseded'
version: '1.0.0'
created: '2025-10-29'
updated: '2025-10-29'
related_issues: []
related_prs: []
references:
  - docs/draft/interface_definition.md
  - docs/intent/donation-portal/mvp-architecture-and-phases.md
state: 'exploring'
hypothesis:
  - '定義済み要件を各フェーズ計画へ正しく落とし込める'
options: []
open_questions: []
next_action_by: 'product-owner'
review_due: '2025-11-28'
ttl_days: 30
superseded_by: docs/intent/donation-portal/mvp-architecture-and-phases.md
---

# 本ドキュメントの位置付け

要件定義は intent ドキュメント `docs/intent/donation-portal/mvp-architecture-and-phases.md` に統合済みです。背景や決定事項を確認する際は intent を参照してください。

# 寄付受付（Discordコミュニティ）要件定義書 — 確定版 v1.0

最終更新日: 2025-10-29（JST）

---

## 0. 現状整理（確定事項サマリー）

* **提供形態**: 寄付（任意の支援）のみ。**対価・特典は一切付与しない**（アクセス権／ロール／優遇／物品などは不可）。
* **決済**: Stripe Checkout。**単発・定期**の両方を用意。

  * **V1（MVP）**: 決済手段は**カードのみ**。
  * 将来（V2以降）: 銀行振込／コンビニ／PayPay（いずれも単発想定）を再検討。
* **通知**: Stripeのレシートのみ。**独自のサンクスメールは送信しない**。
* **UI遷移**: 成功時 `/thanks`、キャンセル時 `/donate`。
* **寄付者名の掲示**: Discord OAuthで本人確認し、**同意者のみ**サイトに**表示名だけ**を列挙（額・回数・順位は非表示／いつでも撤回可）。
* **SSOT**: Stripe（自前DBは持たない）。
* **技術スタック**: **Cloudflare Pages + Pages Functions（Workers）**へ集約、**TypeScript**で実装。
* **ドメイン**: **カスタムドメインは使わない**（`*.pages.dev` を利用）。
* **開始時期の目安**: 2025年12月（目標）。

---

## 1. 目的・非目的

* **目的**: コミュニティを任意の寄付で継続支援できる受け皿を用意する。
* **非目的**: 会員制・限定アクセス・ゲーム内優遇・物品提供等、**対価性を生む要素**の一切。

---

## 2. スコープ

* **In**: 寄付の受付（単発／定期）、受領後の感謝表示（/thanks）、寄付者名（同意者のみ）のサイト掲示。
* **Out**: 特典やロール付与、寄付額に応じた表示・ランキング、独自メール運用、会計レポートの定期出力。

---

## 3. 画面／エンドポイント

### 3.1 画面（Cloudflare Pages）

* `/donate`  … 寄付の趣旨・注意書き（**対価なし／税控除なし**）とボタン。
* `/thanks`  … 感謝メッセージのみ（特典表現なし）。
* `/donors`  … 同意者の **表示名のみ** を列挙（撤回導線を併記）。
* `/privacy`（任意） … 簡潔なプライバシー方針と問い合わせ先。

### 3.2 API（Pages Functions / Workers）

* `POST /api/checkout/session`

  * 入力: OAuthセッション（後述）により `display_name` と同意フラグを保持。
  * 処理: Stripe Checkout Session を作成し、`customer.metadata.display_name` / `display_name_source=discord` / `consent_public=true|false` を保存。
  * 出力: CheckoutのURL。
* `POST /api/webhooks/stripe`

  * 処理: 署名検証 → イベント分岐 → 受領ログ（非同期）。
  * 対象イベント: **単発**=`payment_intent.succeeded`、**定期**=`invoice.paid`、その他はログのみ。
  * 副作用: （V1は）独自メールなし。必要最低限の内部ログのみ。
* `GET /api/donors`

  * 処理: Stripe APIから `consent_public=true` の顧客を収集し、`display_name` の配列を返す（額・回数は返さない）。
* `GET /oauth/callback`

  * 処理: Discord OAuthで `display_name` と `discord_id` を取得。署名付きCookieに **state** と **consent_public**（既定OFF）を保存（TTL=10分）。
* `GET /health`  … ヘルスチェック（200）。

---

## 4. フロー

1. `/donate` → Discord OAuthで本人確認（同意チェックは既定OFF）
2. `POST /api/checkout/session` → Stripe Checkoutへ遷移
3. 決済成功 → `/thanks` へリダイレクト
4. Webhook（`payment_intent.succeeded`／`invoice.paid`）を受信、受領ログのみ
5. `/donors` では `consent_public=true` の **表示名のみ** を表示（撤回は即反映）

---

## 5. データ方針（SSOT=Stripe）

* **自前DBなし**。必要最小の情報を **Stripe Customerの `metadata`** に保持。

  * `display_name` / `display_name_source=discord` / `consent_public=true|false`。
* `/api/donors` は都度Stripeから取得（必要なら短期キャッシュ）。
* PIIの最小化（メールや住所の管理はStripeに委譲）。

---

## 6. セキュリティ／プライバシー

* **Webhook署名検証**（`Stripe-Signature`）必須。`event.id` による冪等。
* **OAuth state** は **HMAC署名付きCookie**（TTL=10分、Secure/HttpOnly/SameSite）で維持。
* Secretsは **Env Bindings**（`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`）。
* CORSは最小範囲（同一オリジン）に限定。

---

## 7. 文言・コンプライアンス

* 必須表記（/donate）:

  * 「本寄付は任意のご支援であり、**対価・特典は一切ありません**。」
  * 「**税控除はありません**。」
* メール運用: **独自送信なし**（Stripeレシートのみ）。
* 寄付者名掲示: **同意制**・表示名のみ・撤回いつでも可・序列や金額は非表示。
* 特商法ページ: **不要想定**（寄付のみ）。ただし問い合わせ先（メール等）は `footer` に明示。

---

## 8. SLO／監視

* **SLO**:

  * Webhook処理の**P50 < 2分 / P95 < 5分**（成功時に/thanks遷移は即時）。
* **監視**:

  * Workersのエラー率／Stripe署名検証エラー／Stripe API失敗率。
  * 運営Discordチャンネルにサマリ通知（内部向け）。

---

## 9. コスト方針（V1）

* **固定費**: Cloudflare Pages/Functions=¥0、カスタムドメイン=なし、メール送信=なし。
* **準固定**: なし。
* **変動**: Stripe 決済手数料（カード 3.6% 相当）。

---

## 10. テスト計画（抜粋）

* Stripe Testモード:

  * 単発: 成功／失敗
  * 定期: 初回／継続の成功、継続失敗（通知なしでログのみ）
* Webhook: 署名検証・リトライ・冪等（二重送信許容）。
* OAuth: 同意ON/OFF、撤回→/donorsから即時非表示。
* コピー確認: すべての画面に「対価なし／税控除なし」。

---

## 11. ロードマップ（将来）

* **V1.1**: 任意額寄付、Donorsページのキャッシュ、/donors の表示順最適化（ランダム or 時系列）。
* **V2**: 銀行振込／コンビニ／PayPay（単発）を選択式で追加、必要に応じて軽量キャッシュ層（D1/KV）導入。

---

## 12. リスクと回避

* **対価性の混入**: 文言・UIで徹底排除（レビュー必須）。
* **コールドスタート**: Workersは影響軽微。Webhook処理は早期200＋非同期化で安定。
* **PIIの過収集**: Stripeに委譲し、自前保存なしを堅持。

---

## 13. 変更履歴

* v1.0（2025-10-29）: Cloudflare Pages + Functions（TS）への集約、カスタムドメイン/独自メールなし、寄付のみ・対価ゼロの最終確定。

---
