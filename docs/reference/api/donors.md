---
title: "GET /api/donors リファレンス"
domain: "donation-portal"
status: "active"
version: "1.0.0"
created: "2025-10-30"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - docs/draft/interface_definition.md
  - docs/plan/donation-portal/phase-04-donors/plan.md
  - functions/api/donors.ts
---

# GET /api/donors リファレンス

> 実装ステータス: ✅ 実装済み (2025-10 Phase 4)

Stripe 上で掲示同意 (`consent_public=true`) が設定された Customer の表示名を取得し、Donors ページで掲示するための情報を返します。

## エンドポイント概要

| 項目 | 値 |
| --- | --- |
| Method | `GET` |
| Path | `/api/donors` |
| 認証 | なし（公開 API） |
| Rate Limit (目安) | 60 req/min per IP |

## クエリパラメータ

| フィールド | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `limit` | `number` | `100` | 取得する Donor 件数。1〜200 の範囲で指定可能。 |
| `order` | `"desc"` \| `"asc"` \| `"random"` | `"desc"` | 表示順を制御。`random` の場合は取得結果をランダムシャッフルして返却。 |

- `limit` が範囲外または数値変換に失敗した場合は `400 Bad Request` を返します。
- `order` が想定以外の値だった場合も `400 Bad Request` です。

## レスポンス

### 200 OK

```json
{
  "donors": [
    "Alice",
    "Bob"
  ],
  "count": 2
}
```

- `donors`: 掲示対象の表示名（空白はトリム済み）。
- `count`: Stripe から取得した **全同意済み寄付者数**（limit に関わらず常に全体カウント）。
- ヘッダーには `Cache-Control` と計算済みの `ETag` (弱 ETag) を付与します。

### キャッシュ戦略

**`order=desc` または `order=asc` の場合：**
```
Cache-Control: public, max-age=60
ETag: W/"<SHA256_HASH>"
```
60秒間キャッシュ有効。この間は CDN とブラウザがキャッシュを活用します。

**`order=random` の場合：**
```
Cache-Control: public, max-age=0
ETag: W/"<SHA256_HASH>"
```
キャッシュを無効化（毎回新しいランダム順序を生成）。ただし ETag は弱 ETag として返却し、同一ランダム結果であれば `304 Not Modified` で帯域幅を節約できます。

### エラー応答

| ステータス | `error.code` | 例 | 説明 |
| --- | --- | --- | --- |
| `400` | `bad_request` | `limit は 1 以上 200 以下で指定してください。` | クエリパラメータが不正 |
| `500` | `internal` | `支援者情報の取得に失敗しました。時間をおいて再度お試しください。` | Stripe API エラー・設定不足 |

エラー時のレスポンスは `Cache-Control: no-store` で返却します。

## Stripe 連携仕様

1. `GET /v1/customers/search` に対し `metadata['consent_public']:'true'` をクエリパラメータとして送信。
2. 取得した `metadata.display_name` をトリムし、空文字列は除外。
3. 取得した Customer から `livemode=true` のレコードのみを掲示対象として扱い、テストモードの寄付者は除外。
4. `order` が `asc`/`desc` の場合は Stripe から受け取った `created` 値でアプリケーション側が並べ替え。
5. `order=random` のときはアプリケーション側でフィッシャー–イェーツ法によりシャッフルし、`limit` 件を返却。

## サンプル

```bash
curl "https://donation.example/api/donors?limit=20&order=random"
```

## 関連ドキュメント

- 同意管理 API: [`docs/reference/api/consent.md`](./consent.md)
- Donors ページ実装: [`public/donors/index.html`](../../public/donors/index.html)
