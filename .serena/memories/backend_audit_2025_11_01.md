# バックエンド検査レポート (2025-11-01)

## 検査対象
- Cloudflare Pages Functions (API エンドポイント)
- OAuth 認証フロー
- Stripe Webhook 処理
- Cookie 署名・検証ロジック
- エラーハンドリングと入力検証

## 検査結果：**潜在的な問題を 4 件特定**

### 1. Webhook 署名検証の実装上の懸念（中程度）

**ファイル**: `functions/api/webhooks/stripe.ts`

**問題**:
- `parseStripeSignature()` で複数の `v1` 署名を収集しているが、`some()` で 1 つでもマッチすれば成功
- 実装的には正しいが、Stripe webhook の複数署名仕様が明確でない場合、予期しない動作をする可能性
- `secureCompare()` の実装は基本的に正しいが、古い実装方式である（タイミング攻撃対策として良いが）

**詳細**:
```typescript
// parseStripeSignature() は複数の v1 値を配列に集める
const signatures: string[] = [];
for (const part of parts) {
  const [key, value] = part.split('=');
  if (key === 'v1' && value) {
    signatures.push(value); // 複数可
  }
}

// markProcessed() では some() で 1 つマッチすれば OK
const signatureMatch = parsedSignature.signatures.some((signature) =>
  secureCompare(signature, expectedSignature),
);
```

**リスク**: Stripe 仕様では通常 1 つの `v1` 署名のみだが、複数存在した場合の動作が不明確


### 2. HMAC 署名検証での暗号操作の副作用（低程度）

**ファイル**: `functions/api/webhooks/stripe.ts`, `src/lib/auth/cookie.ts`

**問題**:
- `crypto.subtle.verify()` と `crypto.subtle.sign()` で署名検証を実施
- `signatureBufferSource` と `payloadBufferSource` を `buffer as ArrayBuffer` でキャストしているが、`Uint8Array.buffer` の処理が正確か不明
- Node.js/Cloudflare Workers 環境で `buffer` 属性の実装が異なる可能性

**詳細** (`src/lib/auth/cookie.ts` の `verifySignedCookie()`):
```typescript
const signatureBytes = fromBase64Url(signaturePart);
const encodedPayloadBytes = encoder.encode(encodedPayload);
const signatureBufferSource = signatureBytes.buffer as ArrayBuffer;
const payloadBufferSource = encodedPayloadBytes.buffer as ArrayBuffer;
const isValid = await crypto.subtle.verify(
  'HMAC',
  key,
  signatureBufferSource,
  payloadBufferSource,
);
```

**リスク**: `Uint8Array.buffer` の開始位置がオフセットを持つ場合、検証失敗のリスク


### 3. Donors API の ETag 実装で弱い一貫性保証（低程度）

**ファイル**: `functions/api/donors.ts`

**問題**:
- `buildResponseBody()` で同じリクエストに対し、結果の順序が不確定（`random` オプション時）
- レスポンスボディが同じでも、`order=random` の場合、毎回異なる結果を返す
- `createWeakEtag()` で弱い ETag を生成するが、キャッシュを無効化する問題ではなく、仕様の問題

**詳細**:
```typescript
if (order === 'random') {
  const shuffled = shuffle(donors.map((entry) => entry.name)).slice(0, limit);
  return { donors: shuffled, count: donors.length };
}
```

**リスク**: クライアント側で ETag をキャッシュキーにする場合、同じ寄附者リストでも異なる ETag を受け取る


### 4. Cookie 署名キー取得時のエラーメッセージ露出（低程度）

**ファイル**: `src/lib/cookie/signKey.ts`, `functions/oauth/callback.ts`

**問題**:
- `getCookieSignKey()` が throw した場合、エラーメッセージが外部に露出
- `functions/oauth/callback.ts` の `onRequestGet()` で `getCookieSignKey(env)` が呼ばれるが、エラーハンドリングがない
- エラーが console.error に出力される可能性

**詳細** (`functions/oauth/callback.ts` 行番号 134):
```typescript
const env = context.env as OAuthEnv;
getCookieSignKey(env);  // ← エラー処理なし
const { clientId, clientSecret } = ensureDiscordCredentials(env);
```

**リスク**: 例外が throw された場合、500 エラーが発生し、スタックトレースがログに出力される可能性


## 既知問題の確認
- Stripe 設定の不整合（PRICE_* 環境変数と STRIPE_SECRET_KEY のモード（test/live）の不一致）
  → docs/guide/payments/stripe-setup.md で既に文書化済み


## 修正推奨度
1. **問題 2**: 高 - `Uint8Array.buffer` の正確性を確認し、必要に応じて修正
2. **問題 1**: 中 - Stripe 仕様の複数署名時の挙動を明確化
3. **問題 4**: 中 - エラーハンドリングを追加
4. **問題 3**: 低 - 仕様レベルの問題で、キャッシュ戦略を見直すなら対応


## 検査対象ファイル（確認済み）
✅ functions/api/checkout/session.ts
✅ functions/api/session.ts
✅ functions/api/donors.ts
✅ functions/api/consent.ts
✅ functions/api/webhooks/stripe.ts
✅ functions/oauth/start.ts
✅ functions/oauth/callback.ts
✅ src/lib/auth/cookie.ts
✅ src/lib/auth/session.ts
✅ src/lib/auth/sessionCookie.ts
✅ src/lib/cookie/signKey.ts

## 検査結論
バックエンド部分に**致命的なバグはない**が、以下の改善が推奨：
- Uint8Array.buffer 処理の正確性確認
- Cookie 署名キー取得時のエラーハンドリング追加
- Stripe Webhook 署名検証の複数署名仕様の明確化