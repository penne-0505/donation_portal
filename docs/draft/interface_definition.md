---
title: '寄附受付 I/F仕様'
domain: 'donation-portal'
status: 'superseded'
version: '1.0.0'
created: '2025-10-29'
updated: '2025-10-29'
related_issues: []
related_prs: []
references:
  - docs/draft/requirements_definition.md
  - docs/intent/donation-portal/mvp-architecture-and-phases.md
state: 'exploring'
hypothesis:
  - '主要エンドポイント構成が Phase 2 以降でも有効である'
options: []
open_questions:
  - 'Discord OAuth state 管理の具体的な検証ケース'
next_action_by: 'engineering-lead'
review_due: '2025-11-28'
ttl_days: 30
superseded_by: docs/intent/donation-portal/mvp-architecture-and-phases.md
---

# 本ドキュメントの位置付け

本仕様は intent ドキュメント `docs/intent/donation-portal/mvp-architecture-and-phases.md` に引き継がれました。詳細検討が必要な場合は intent を参照してください。

# I/F仕様 — 寄附受付（Cloudflare Pages＋Functions, TypeScript） v1.0

最終更新: 2025-10-29 (JST)

---

## 0. 概要 / スコープ

* **目的**: 任意の寄附（単発/定期）を Stripe Checkout 経由で受け付け、/thanks 表示と Donors（同意者の表示名のみ）を提供する。
* **非目的**: 寄附に対価・特典を付与しない（アクセス権/ロール/優遇等は実装しない）。
* **アーキテクチャ**: Cloudflare Pages（/donate, /thanks, /donors）+ Pages Functions（API, Webhook） / TypeScript。
* **データ**: 自前DBなし。**SSOT = Stripe** の Customer/Events/Metadata。
* **ドメイン**: `*.pages.dev`（カスタムドメインなし）。

---

## 1. ベース / バージョニング / CORS

* **Base URL**: `https://<project>.pages.dev`
* **API Prefix**: `/api` （例: `/api/checkout/session`）
* **Versioning**: ヘッダ `X-API-Version: 1`（将来用）。
* **CORS**: 同一オリジンのみ許可（外部公開APIにしない）。

---

## 2. セキュリティ / 認証

* **Public**: `/donate`, `/thanks`, `/donors` は公開。
* **OAuth**: Discord OAuth を用い、**署名付きCookie**で state/同意フラグを短期保持（HMAC-SHA256 / TTL=10分 / Secure / HttpOnly / SameSite=Lax）。
* **Webhook**: Stripe-Signature の署名検証必須。**早期200**を返し、副作用は非同期。
* **Idempotency**: Stripe Event の `id` を用い冪等化（重複イベントは no-op）。

---

## 3. Stripe メタデータ方針（SSOT）

**Stripe Customer metadata** に以下を保持：

* `display_name`: サイト掲示用の表示名（Discordの `global_name` 相当）
* `display_name_source`: 固定文字列 `discord`
* `discord_id`: OAuthで取得した Discord のユーザID（数値文字列）
* `consent_public`: `true` | `false`（掲示同意、既定は false）

> 備考: Donors掲示は `consent_public=true` の `display_name` のみを使用。金額や回数は参照・保存しない。

---

## 4. エンドポイント仕様（API）

### 4.1 `GET /oauth/start`

* **Purpose**: Discord OAuth 認可開始。UIからリンク。
* **Query**: `consent_public=true|false`（既定 false）
* **Behavior**: 署名付きCookieに state/consent を保存 → Discord 認可URLへ302リダイレクト。
* **Response**: 302（Location: Discord OAuth URL）

### 4.2 `GET /oauth/callback`

* **Purpose**: Discord からの戻り。
* **Input**: `code`, `state`（Discord規定）
* **Behavior**:

  1. state検証（Cookie/HMAC, TTL）。
  2. トークン交換→ユーザ情報取得（`id`, `global_name`）。
  3. 署名付きCookie `sess` に `{display_name, discord_id, consent_public, exp}` を保存（TTL=10分）。
  4. `/donate` に302で戻す。
* **Response**: 302

### 4.3 `POST /api/checkout/session`

* **Purpose**: Stripe Checkout Session を作成。
* **Auth**: 署名付きCookie `sess` が必須（存在しない場合 401）。
* **Request**: `Content-Type: application/json`

```json
{
  "mode": "payment" | "subscription",
  "interval": "monthly" | "yearly" | null,
  "variant": "fixed300" | "fixed3000"
}
```

* **Validation**:

  * `mode=payment` の場合 `interval` は `null`、`variant` は `fixed300` のみ（V1）。
  * `mode=subscription` の場合、`interval` は `monthly` または `yearly`、`variant` はそれぞれ `fixed300` / `fixed3000`。
* **Server behavior**:

  * `customer_creation=always` で Customer を作成/紐付け。
  * Customer metadata に `display_name`, `display_name_source=discord`, `discord_id`, `consent_public` を保存/更新。
  * `success_url=https://<project>.pages.dev/thanks` 、`cancel_url=https://<project>.pages.dev/donate`。
  * Price ID は環境変数から参照（下記 7 章）。
* **Response**: `200 OK`

```json
{
  "url": "https://checkout.stripe.com/c/session_..."
}
```

* **Errors**:

  * `400` 不正な組合せ / パラメータ
  * `401` セッション欠如（OAuth未了）
  * `500` 内部エラー

### 4.4 `POST /api/webhooks/stripe`

* **Purpose**: Stripe Webhook 受信。
* **Headers**: `Stripe-Signature`
* **Body**: Raw（署名検証のため）
* **Handle events**:

  * **単発**: `payment_intent.succeeded` → 受領ログのみ
  * **定期**: `invoice.paid` → 受領ログのみ
  * その他: 署名検証済みなら 200 でACK（no-op）
* **Idempotency**: `event.id` をキーに重複を無視（Workers実装では同イベントの短時間重複をno-op）。
* **Response**: `200 {"received": true}` / 検証失敗は `400`。

### 4.5 `GET /api/donors`

* **Purpose**: 公開用 Donors（同意者）の表示名一覧。
* **Query**: `limit`（1..200, 既定100）, `order`（`desc`|`asc`|`random`, 既定`desc`）
* **Server behavior**: Stripe API から `consent_public=true` の Customer を集計し、`display_name` の配列を返す。金額/回数は返さない。
* **Response**: `200 OK`

```json
{
  "donors": ["Alice", "Bob", "..."],
  "count": 42
}
```

* **Caching**: `Cache-Control: public, max-age=60`（弱いキャッシュ）

### 4.6 `POST /api/consent`

* **Purpose**: 掲示同意の更新（同意/撤回）。
* **Auth**: 署名付きCookie `sess` 必須。
* **Request**:

```json
{
  "consent_public": true
}
```

* **Server behavior**: `discord_id` で該当 Customer を検索し、metadata の `consent_public` を更新。
* **Response**: `204 No Content`
* **Errors**: `401` セッション欠如、`404` 該当なし、`500` 内部エラー

### 4.7 `GET /health`

* **Purpose**: ライブネス確認（監視用）
* **Response**: `200 OK` , body=`ok`

---

## 5. 画面仕様（抜粋）

### `/donate`

* 表示: 「任意の寄附／対価・特典なし／税控除なし」を明記。
* フロー: 「Discordで表示名取得」→「掲示同意のチェック（既定OFF）」→「寄附ボタン（単発/定期）」

### `/thanks`

* 表示: 感謝の定型文。

### `/donors`

* 表示: `GET /api/donors` の結果を表示名だけで列挙。撤回導線（`POST /api/consent`）を明記。

---

## 6. エラーモデル（共通）

* 形式: `application/json`

```json
{
  "error": {
    "code": "bad_request | unauthorized | not_found | invalid_state | internal",
    "message": "Human readable message"
  }
}
```

---

## 7. 環境変数 / Bindings（Cloudflare Pages Functions）

* `STRIPE_SECRET_KEY` … Stripe Secret Key（live/test）
* `STRIPE_WEBHOOK_SECRET` … Webhook署名検証用
* `PRICE_ONE_TIME_300` … 単発¥300 の Price ID
* `PRICE_SUB_MONTHLY_300` … 月額¥300 の Price ID
* `PRICE_SUB_YEARLY_3000` … 年額¥3000 の Price ID
* `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` … OAuth用
* `APP_BASE_URL` … `https://<project>.pages.dev`
* `COOKIE_SIGN_KEY` … HMAC用の秘密鍵

---

## 8. レート制限（推奨）

* `POST /api/checkout/session`: **IPあたり 10 req/min**
* `POST /api/consent`: **IPあたり 5 req/min**
* `GET /api/donors`: **IPあたり 60 req/min**（Cloudflareキャッシュで吸収）
* `POST /api/webhooks/stripe`: Stripe の送信元に限定（IP制限は目安、署名検証が主）

---

## 9. 監視 / SLO

* **SLO**: Webhook処理 P50<2分 / P95<5分（早期200）
* **メトリクス**: 署名検証エラー率、Stripe API失敗率、/donors の 5xx 率
* **通知**: 運営Discordの #ops へ要約を送信（将来拡張）

---

## 10. シーケンス（要約）

```
ユーザ → /donate → /oauth/start → Discord → /oauth/callback
      → POST /api/checkout/session → (Stripe Checkout) → /thanks
Stripe → POST /api/webhooks/stripe (payment_intent.succeeded | invoice.paid)
閲覧者 → GET /api/donors → /donors表示
```

---

## 11. テスト項目（API観点）

* `/oauth` state改ざんで `invalid_state` となること
* `POST /api/checkout/session` に OAuth セッションなし → 401
* 価格組合せの妥当性（単発/定期の整合）
* Webhook 署名/MAC検証 不一致 → 400
* `consent_public` 更新の往復（ON→OFF→ON）
* `GET /api/donors` の order/limit 反映

---

## 12. 将来拡張（非互換に注意）

* 任意額寄附（`variant: custom_amount` + サーバ側バリデーション）
* 支払い手段の追加（銀行振込/コンビニ/PayPay単発）
* 軽量キャッシュ層（KV/D1）導入（公開負荷が上がった場合）

---

## 13. 付録：TypeScript 型（参考）

```ts
export type CreateCheckoutBody = {
  mode: 'payment' | 'subscription';
  interval: 'monthly' | 'yearly' | null;
  variant: 'fixed300' | 'fixed3000';
};

export type CreateCheckoutRes = { url: string };

export type ErrorBody = {
  error: { code: 'bad_request'|'unauthorized'|'not_found'|'invalid_state'|'internal'; message: string };
};

export type DonorsRes = { donors: string[]; count: number };

export type ConsentBody = { consent_public: boolean };
```

---
