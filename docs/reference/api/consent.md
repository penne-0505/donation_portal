---
title: "POST /api/consent リファレンス"
domain: "donation-portal"
status: "draft"
version: "0.1.0"
created: "2025-10-30"
updated: "2025-10-30"
related_issues: []
related_prs: []
references:
  - docs/draft/interface_definition.md
  - docs/plan/donation-portal/phase-04-donors/plan.md
---

# POST /api/consent リファレンス

> 実装ステータス: ✅ 実装済み (2025-10 Phase 4)

Donors 掲載の同意・撤回を管理する API です。Discord OAuth で発行されたセッション Cookie `sess` を用いて、Stripe Customer metadata の `consent_public` を更新します。

## エンドポイント概要

| 項目 | 値 |
| --- | --- |
| Method | `POST` |
| Path | `/api/consent` |
| 認証 | Discord OAuth セッション Cookie `sess` |
| Rate Limit (目安) | 5 req/min perユーザー |

## リクエスト

```http
POST /api/consent
Content-Type: application/json
Cookie: sess=<signed>
```

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `consent_public` | `boolean` | ✅ | `true` で Donors 掲載に同意、`false` で撤回 |

- `consent_public` が真偽値以外の場合は `400 Bad Request` を返します。
- Discord セッションが存在しない／検証に失敗した場合は `401 Unauthorized` です。

## レスポンス

### 204 No Content

- Stripe Customer metadata の `consent_public` が更新されました。
- レスポンスボディはありません。ヘッダーには `Cache-Control: no-store` を付与します。

### エラー応答

| ステータス | `error.code` | 例 | 説明 |
| --- | --- | --- | --- |
| `400` | `bad_request` | `consent_public は true または false を指定してください。` | リクエストボディが不正 |
| `401` | `unauthorized` | `セッション情報の検証に失敗しました。Discord で再ログインしてください。` | `sess` Cookie 不在または署名不正 |
| `404` | `not_found` | `該当する寄附者情報が見つかりませんでした。寄附後に再度お試しください。` | Stripe 上に該当 Customer が存在しない |
| `500` | `internal` | `同意状態の更新に失敗しました。時間をおいて再実行してください。` | Stripe API エラー・設定不足 |

## Stripe 連携仕様

1. `GET /v1/customers/search` で `metadata['discord_id']` が一致する Customer を検索。
2. 見つかった Customer の `metadata[consent_public]` を `true`/`false` で更新。同時に `metadata[display_name]` と `metadata[display_name_source]` も Discord 情報で上書き。
3. Customer が存在しない場合は `404 Not Found` を返却。

## サンプル

```bash
curl -X POST https://donation.example/api/consent \
  -H "Content-Type: application/json" \
  -H "Cookie: sess=<signed>" \
  -d '{"consent_public":false}'
```

## 関連ドキュメント

- Donors API: [`docs/reference/api/donors.md`](./donors.md)
- OAuth セッション仕様: [`docs/guide/auth/discord-oauth.md`](../../guide/auth/discord-oauth.md)
