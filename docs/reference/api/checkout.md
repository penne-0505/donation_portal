---
title: "POST /api/checkout/session リファレンス"
domain: "donation-portal"
status: "draft"
version: "0.1.0"
created: "2025-10-30"
updated: "2025-10-30"
related_issues: []
related_prs: []
references:
  - docs/draft/interface_definition.md
  - docs/guide/payments/stripe-setup.md
---

# POST /api/checkout/session リファレンス

> 実装ステータス: ✅ 実装済み (2025-10 Phase 3)

Stripe Checkout セッションを生成し、寄付者の Discord 情報を Stripe Customer metadata に保存します。単発寄付（¥300）と定期寄付（¥300/月・¥3,000/年）をサポートします。

## エンドポイント概要

| 項目 | 値 |
| --- | --- |
| Method | `POST` |
| Path | `/api/checkout/session` |
| 認証 | Discord OAuth セッション Cookie `sess`（署名付き） |
| Rate Limit (目安) | 10 req/min per IP |

## リクエスト

```http
POST /api/checkout/session
Content-Type: application/json
Cookie: sess=<signed>
```

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `mode` | `"payment"` \| `"subscription"` | ✅ | Checkout モード |
| `interval` | `"monthly"` \| `"yearly"` \| `null` | ✅ | 定期寄付の場合は課金間隔、単発時は `null` |
| `variant` | `"fixed300"` \| `"fixed3000"` | ✅ | 寄付メニューを識別するキー |

### バリデーション

- `mode=payment` のとき: `interval` は必ず `null`、`variant` は `fixed300`。
- `mode=subscription` のとき:
  - `interval=monthly` なら `variant=fixed300` を要求し `PRICE_SUB_MONTHLY_300` を利用。
  - `interval=yearly` なら `variant=fixed3000` を要求し `PRICE_SUB_YEARLY_3000` を利用。
- 上記以外の組合せは `400 Bad Request`。

## レスポンス

### 200 OK

```json
{
  "url": "https://checkout.stripe.com/c/session_XXXXXXXX"
}
```

- 生成された Stripe Checkout URL を返します。
- 成功時は Customer metadata が以下の値で更新されます。
  - `display_name`: Discord の表示名
  - `display_name_source`: 固定値 `discord`
  - `discord_id`: Discord ユーザー ID
  - `consent_public`: `true`/`false`（Donors 掲載同意）

### エラー応答

| ステータス | `error.code` | 例 | 説明 |
| --- | --- | --- | --- |
| `400` | `bad_request` | `variant must be "fixed300" for monthly subscriptions` | リクエストの形式または組合せが不正 |
| `401` | `unauthorized` | `Discord ログインが必要です。再度ログインしてください。` | `sess` Cookie が無効/期限切れ |
| `500` | `internal` | `Stripe との連携に失敗しました。時間をおいて再試行してください。` | Stripe API エラー・設定不足 |

すべてのレスポンスは `Content-Type: application/json; charset=utf-8`、`Cache-Control: no-store` を付与します。

## Stripe 連携仕様

1. `metadata['discord_id']` で Customer を検索。
2. 存在すれば `POST /v1/customers/{id}` で metadata を上書き。存在しなければ新規作成。
3. `POST /v1/checkout/sessions` で Checkout セッションを生成。
4. `success_url` = `APP_BASE_URL/thanks`、`cancel_url` = `APP_BASE_URL/donate`。

## サンプル

```bash
curl -X POST https://donation.example/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Cookie: sess=<signed>" \
  -d '{"mode":"subscription","interval":"monthly","variant":"fixed300"}'
```

## 関連ドキュメント

- 設定手順: [`docs/guide/payments/stripe-setup.md`](../../guide/payments/stripe-setup.md)
- OAuth セッション: [`docs/guide/auth/discord-oauth.md`](../../guide/auth/discord-oauth.md)
