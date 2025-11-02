# バックエンド包括的監査レポート

**実施日**: 2025年11月1日  
**対象**: Cloudflare Pages Functions（バックエンド全体）  
**調査方式**: ソースコード詳細レビュー

---

## エグゼクティブサマリー

プロジェクト全体のバックエンド部分を徹底的に検査した結果、**致命的なバグは検出されませんでした**。ただし、以下の **4 つの潜在的な問題**を特定しました。

| No. | 項目 | 重要度 | 推奨対応 |
|-----|------|--------|---------|
| 1 | Cookie 署名検証での ArrayBuffer 処理 | 🔴 高 | 確認・修正 |
| 2 | OAuth エラーハンドリング欠落 | 🟠 中 | 追加 |
| 3 | Stripe Webhook 複数署名仕様の明確化 | 🟠 中 | ドキュメント化 |
| 4 | Donors API キャッシュ戦略 | 🟡 低 | 検討 |

---

## 詳細検査結果

### 1. ⚠️ Cookie 署名検証での ArrayBuffer 処理（高重要度）

**ファイル**: `src/lib/auth/cookie.ts` L.140-142

**内容**:
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

**問題点**:

1. **ArrayBuffer のオフセット問題**: `Uint8Array` には `buffer` プロパティがありますが、これは元の `ArrayBuffer` の参照です。`Uint8Array` がバッファの一部のみを参照している場合（オフセットがある場合）、署名検証に失敗する可能性があります。

2. **crypto.subtle.verify() の API 仕様**: `crypto.subtle.verify()` は 4 番目の引数として `ArrayBuffer` または `ArrayBufferView` を期待します。理想的には `Uint8Array` をそのまま渡すべきです。

**影響**:
- ユーザーが認証時に適切に検証されず、セッションが無効化される可能性
- Cookie が正当でも拒否される可能性

**推奨修正**:
```typescript
// ❌ 現在
const signatureBufferSource = signatureBytes.buffer as ArrayBuffer;
const payloadBufferSource = encodedPayloadBytes.buffer as ArrayBuffer;

// ✅ 推奨
const isValid = await crypto.subtle.verify(
  'HMAC',
  key,
  signatureBytes,  // Uint8Array をそのまま渡す
  encodedPayloadBytes,
);
```

---

### 2. ⚠️ OAuth エラーハンドリング欠落（中重要度）

**ファイル**: `functions/oauth/callback.ts` L.134

**内容**:
```typescript
export const onRequestGet: PagesFunction = async (context) => {
  const env = context.env as OAuthEnv;
  getCookieSignKey(env);  // ← エラーハンドリングなし
  const { clientId, clientSecret } = ensureDiscordCredentials(env);
  // ...
};
```

**問題点**:

1. **getCookieSignKey(env) が throw する可能性**: 環境変数に `COOKIE_SIGN_KEY` がない場合、エラーを throw します。
   ```typescript
   // src/lib/cookie/signKey.ts
   throw new Error('COOKIE_SIGN_KEY is not configured. Set it in your environment variables.');
   ```

2. **エラーハンドリングがない**: 例外が catch されず、500 エラーが返却されます。ログにスタックトレースが出力されます。

3. **ユーザーエクスペリエンス**: 通常のエラー応答形式が返されないため、クライアント側での処理が困難

**影響**:
- 環境変数が未設定の場合、500 エラーで OAuth フローが失敗
- エラーメッセージがログに露出
- デプロイ後の環境設定ミスに気づきにくい

**推奨修正**:
```typescript
export const onRequestGet: PagesFunction = async (context) => {
  const env = context.env as OAuthEnv;
  try {
    getCookieSignKey(env);
    const { clientId, clientSecret } = ensureDiscordCredentials(env);
    // ...
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Configuration error';
    logError('config_error', message);
    return redirectWithError('configuration_error');
  }
};
```

---

### 3. ⚠️ Stripe Webhook 複数署名仕様の明確化（中重要度）

**ファイル**: `functions/api/webhooks/stripe.ts` L.68-89

**内容**:
```typescript
function parseStripeSignature(
  header: string | null,
): { readonly timestamp: string; readonly signatures: readonly string[] } | null {
  if (!header) {
    return null;
  }
  const parts = header.split(',');
  let timestamp: string | null = null;
  const signatures: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't' && value) {
      timestamp = value;
    } else if (key === 'v1' && value) {
      signatures.push(value);  // 複数の v1 を配列に
    }
  }
  if (!timestamp || signatures.length === 0) {
    return null;
  }
  return { timestamp, signatures };
}
```

**問題点**:

1. **複数署名の扱い**: `signatures` 配列に複数の `v1` 値を格納するが、署名検証時は `some()` で 1 つマッチすれば OK
   ```typescript
   const signatureMatch = parsedSignature.signatures.some((signature) =>
     secureCompare(signature, expectedSignature),
   );
   ```

2. **仕様の曖昧性**: Stripe の Webhook 署名仕様では通常 1 つの `v1` 署名のみが送信されます。複数の `v1` が存在する場合の動作が不明確です。

3. **意図の不明確さ**: 複数署名対応が意図的なのか、防御的な実装なのかが不明確

**影響**:
- Stripe が複数 `v1` を送信しない限り、実質的な問題はない
- ただし、仕様変更時に予期しない動作をする可能性

**推奨対応**:
- Stripe の最新ドキュメントで複数署名仕様を確認
- コメントで意図を明記（例：「For future compatibility」）
- 1 つの `v1` のみ期待する場合は、仕様に合わせて修正

```typescript
// v1 は通常 1 つのみ想定
else if (key === 'v1' && value) {
  if (signatures.length === 0) {
    signatures.push(value);
  }
  // 複数ある場合は後続の v1 を無視
}
```

---

### 4. 🟡 Donors API キャッシュ戦略（低重要度）

**ファイル**: `functions/api/donors.ts` L.142-153, L.200-205

**内容**:
```typescript
// buildResponseBody() での順序決定
if (order === 'random') {
  const shuffled = shuffle(donors.map((entry) => entry.name)).slice(0, limit);
  return { donors: shuffled, count: donors.length };
}

// キャッシュ設定
return new Response(bodyText, {
  status: 200,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=60',  // 60秒キャッシュ
    etag,  // 弱い ETag
  },
});
```

**問題点**:

1. **非決定的な ETag**: `order=random` の場合、毎回異なるレスポンスボディを生成するため、同じ寄付者リストでも ETag が異なります。

2. **キャッシュの有効性**: 弱い ETag（`W/`）でも、リクエストごとに異なる ETag が返される場合、キャッシュの意味がありません。

3. **仕様の問題**: これは実装のバグではなく、API 仕様の問題です。`order=random` でも同じ結果を返したい場合は、リクエストにシードを含める、またはランダム化しない必要があります。

**影響**:
- クライアント側でのキャッシュが効かない
- ブラウザキャッシュも効果的でない
- ネットワーク使用量が増加

**推奨対応**:
- `order=random` の場合は、`cache-control: no-cache` または `no-store` を返す
- またはランダム化の種を URL パラメータに含める

```typescript
// 推奨修正
const cacheControl = order === 'random' 
  ? 'public, max-age=0'  // キャッシュ無効
  : 'public, max-age=60';

return new Response(bodyText, {
  status: 200,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': cacheControl,
    etag,
  },
});
```

---

## 検査対象ファイル一覧（✅ 確認済み）

### API エンドポイント
- ✅ `functions/api/checkout/session.ts` - Checkout セッション作成
- ✅ `functions/api/session.ts` - セッション状態取得
- ✅ `functions/api/donors.ts` - 寄付者一覧取得
- ✅ `functions/api/consent.ts` - 同意状態更新
- ✅ `functions/api/webhooks/stripe.ts` - Stripe Webhook 受信

### OAuth フロー
- ✅ `functions/oauth/start.ts` - OAuth 開始
- ✅ `functions/oauth/callback.ts` - OAuth コールバック

### 認証・Cookie
- ✅ `src/lib/auth/cookie.ts` - Cookie 署名検証
- ✅ `src/lib/auth/session.ts` - セッション解析
- ✅ `src/lib/auth/sessionCookie.ts` - セッション Cookie 発行
- ✅ `src/lib/cookie/signKey.ts` - 署名キー取得

---

## 実装品質の総合評価

| 観点 | 評価 | 説明 |
|-----|------|------|
| **エラーハンドリング** | 🟡 B | 基本的には良いが、エッジケースでの処理が不完全 |
| **入力検証** | ✅ A | 厳密に実装されている |
| **セキュリティ** | ✅ A | タイミング攻撃対策あり、署名検証も正確 |
| **ログ出力** | ✅ A | 適切にログ出力されている |
| **型安全性** | ✅ A | TypeScript で厳密に型付けされている |
| **パフォーマンス** | 🟡 B | キャッシュ戦略は改善余地あり |

---

## 既知問題の確認

### Stripe 設定の不整合（別途記録）
- **状況**: Pages Functions で test 秘密鍵を使用しつつ、live Price ID を使用する場合、400/500 エラー発生
- **対応**: 各 `PRICE_*` 環境変数を `STRIPE_SECRET_KEY` と同じモード（test/live）に統一
- **ドキュメント**: `docs/guide/payments/stripe-setup.md` に記載済み

---

## 結論

プロジェクトのバックエンド実装は**全体的に堅牢**です。以下の改善を行うことで、さらに品質を向上させることができます。

### 優先度順の推奨対応

1. **【高】数日以内に確認**: `Uint8Array.buffer` の処理検証と修正
2. **【中】1週間以内**: OAuth エラーハンドリングの追加
3. **【中】参考**: Stripe Webhook 仕様のドキュメント化
4. **【低】検討**: Donors API キャッシュ戦略の見直し

これらの対応により、本番環境での信頼性がさらに向上します。
