---
title: Stripe Webhook Signature Verification
domain: payments
status: active
version: 1
created: 2025-11-01
updated: 2025-11-01
references:
  - https://stripe.com/docs/webhooks/signatures
  - functions/api/webhooks/stripe.ts
---

# Stripe Webhook 署名検証仕様

## 概要

Donation Portal の Webhook エンドポイント（`POST /api/webhooks/stripe`）では、Stripe からのリクエスト認証を **署名検証** で実現しています。

## Webhook-Signature ヘッダーの構造

Stripe が送信する `Stripe-Signature` ヘッダーは、以下の形式を採用しています：

```
Stripe-Signature: t=<TIMESTAMP>,v1=<SIGNATURE>[,v1=<SIGNATURE_2>]...
```

**要素の説明：**

| 要素 | 説明 |
|-----|------|
| `t` | UNIX タイムスタンプ（リクエスト生成時刻） |
| `v1` | HMAC-SHA256 署名（HEX エンコード）。通常は1つですが、複数の場合もあります |

**複数 `v1` 署名の用途：**

- 通常、Stripe は1つの `v1` 署名のみ送信します
- 鍵のローテーション時期には、新旧両キーで署名した複数の `v1` が送信される可能性があります
- クライアント側は複数署名のいずれかが検証可能なら受理します

## 署名検証プロセス

### 1. ヘッダーの解析

`Stripe-Signature` ヘッダーを解析し、タイムスタンプと署名配列を抽出します。

```typescript
function parseStripeSignature(header: string | null): { timestamp: string; signatures: string[] } | null {
  // コンマで分割し、t= と v1= をパース
  // 複数の v1 が存在する場合は配列に含める
}
```

**検証ルール：**

- ヘッダーが欠落または形式が不正な場合 → 400 Bad Request
- `t` が欠落している場合 → 400 Bad Request
- `v1` が1つ以上存在しない場合 → 400 Bad Request

### 2. 署名計算

リクエストボディとタイムスタンプから期待される署名を計算します：

```typescript
const signedPayload = `${timestamp}.${rawBody}`;
const expectedSignature = await computeSignature(
  STRIPE_WEBHOOK_SECRET,
  signedPayload
);
```

**使用暗号化方式：** HMAC-SHA256

### 3. 署名検証

受信した署名のいずれかが期待値と一致するかをタイミング攻撃耐性を備えた比較で検証：

```typescript
const signatureMatch = signatures.some((signature) =>
  secureCompare(signature, expectedSignature)
);
```

**重要な点：**

- `secureCompare`：タイミング攻撃を防ぐため、全バイト比較を行う**定時間比較関数** を使用
- 複数署名のいずれかが一致すれば真 → **鍵ローテーション時対応**
- すべての署名が不一致の場合 → 400 Bad Request（ログに詳細を記録）

## 実装上の考慮事項

### セキュリティ

1. **秘密鍵の管理**
   - `STRIPE_WEBHOOK_SECRET` は環境変数で管理、コードに埋め込まない
   - 本番環境では Cloudflare Pages のシークレット機能で管理

2. **タイミング攻撃対策**
   - 字句列比較にはタイミング攻撃耐性を備えた `secureCompare` を必須使用

3. **リクエストボディの取扱い**
   - 署名検証前にボディを改変しない（JSON 整形など）
   - `arrayBuffer()` → `UTF-8 デコード` の順序は固定

### タイムスタンプ検証（フューチャープルーフ）

現在の実装ではタイムスタンプ検証を行っていません。以下の場合に追加検討できます：

- リプレイ攻撃への対策が必要な場合
- イベント時刻とサーバー時刻のズレ許容値設定

**推奨値：** 5分（300秒）以内のタイムスタンプ差を許可

## テスト

単体テスト（`tests/api/webhooks/stripe.test.ts`）で以下をカバー：

- ✔ 有効な署名付きイベント → 200 受理
- ✔ 不正な署名 → 400 拒否
- ✔ 重複イベント → 冪等的処理（200 OK、内部でスキップ）
- ✔ 署名ヘッダー欠落 → 400 拒否
- ✔ 秘密鍵未設定 → 500 エラー

## 参考文献

- [Stripe 公式 Webhook 署名ドキュメント](https://stripe.com/docs/webhooks/signatures)
- [HMAC-SHA256 について](https://en.wikipedia.org/wiki/HMAC)
