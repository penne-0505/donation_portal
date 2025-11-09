---
title: '_routes.json API Routing Configuration Fix'
domain: 'operations'
status: 'superseded'
version: '1.0.1'
created: '2025-11-05'
updated: '2025-11-09'
related_issues: []
related_prs: []
references:
  - '../../draft/operations/session-api-session-fetch-investigation.md'
  - '../../archives/plan/operations/session-api-404-investigation-and-resolution.md'
  - '../../../scripts/run-next-on-pages.cjs'
  - './.open-next/_routes.json'
---

> **2025-11-09 更新**: 2025-11-09 時点の再調査で、`@cloudflare/next-on-pages` の出力が `include: ["/*"]` のみを含む `_routes.json` を生成し、Pages Functions へのフォールバックが無効化されていることが判明した。本ドキュメントは当時の結論を記録するために保存し、最新の対応内容は `docs/intent/operations/api-routing-regression-2025-resolution.md` を参照すること。

## 背景

Cloudflare Pages のローカル開発環境および本番環境において、`/api/session`、`/api/donors`、`/api/consent` 等の Pages Functions エンドポイントが 404 エラーを返す継続的な問題が発生していた。

ビルドプロセスが正常に機能し、依存関係のバンドルも完了しているにもかかわらず、リクエストが Pages Functions Worker に到達していないことが判明した。

詳細な調査結果は `docs/draft/operations/session-api-session-fetch-investigation.md` を参照。

## 問題の根本原因

`scripts/run-next-on-pages.cjs` の末尾に以下の処理が存在していた：

```javascript
const additionalExcludes = ['/api/*', '/oauth/*', '/health'];
const excludeSet = new Set([...(routes.exclude ?? []), ...additionalExcludes]);
routes.exclude = Array.from(excludeSet);
fs.writeFileSync(routesPath, JSON.stringify(routes));
```

この処理により、生成された `.open-next/_routes.json` の `exclude` 配列に `/api/*` が追加されていた。

### Cloudflare Pages ルーティング仕様

Cloudflare Pages では `_routes.json` の `exclude` パターンに該当するリクエストは：
1. Pages Worker (Next.js Worker) を経由しない
2. Pages Functions Worker にも到達しない
3. 静的ファイルとして処理されるため 404 を返す

この仕様により、`exclude` に `/api/*` が含まれると、すべての API リクエストが Pages Functions Worker へ到達できなくなっていた。

## 決定

**採用アプローチ**: `scripts/run-next-on-pages.cjs` から `/api/*` 等の exclude パターン追加処理を削除

### 実装内容

1. **修正対象ファイル**: `scripts/run-next-on-pages.cjs`
   - 行番号: ~121-130（末尾の exclude 追加処理）
   - 削除内容: `additionalExcludes` 定義、`excludeSet` 作成、`routes.exclude` への追加、`_routes.json` 書き込み処理

2. **修正後の結果**
   - `.open-next/_routes.json` の `exclude` には Next.js によるデフォルト値のみが含まれる
   - 現在のデフォルト値: `["/_next/static/*"]`
   - API リクエスト（`/api/*` など）は exclude 対象外となり、Pages Functions Worker に到達

3. **影響を受けるパターン**
   - `/api/*` → Pages Functions Worker へ到達 ✅
   - `/oauth/*` → Pages Functions Worker へ到達 ✅
   - `/health` → Pages Functions Worker へ到達 ✅
   - `/_next/static/*` → 継続して静的配信 ✅

## 検討した代替案

### オプションA: `_routes.json` から `/api/*` を除外（採用）
- メリット:
  - 最小限の変更（数行削除）
  - ルーティング機構を正常化し、設計通りの動作に復帰
  - 以降の API 追加時に追加の手順が不要
- デメリット: 特になし
- 採用理由: 直感的で、根本的な解決

### オプションB: `wrangler pages dev` に Functions ディレクトリを明示
```bash
wrangler pages dev .open-next/static --functions .open-next/functions
```
- メリット: `_routes.json` の設定を変えずに動作改善の可能性
- デメリット:
  - exclude 設定が残れば依然として 404 になる
  - Pages プラットフォームの本番環境での挙動と異なる可能性
- 不採用理由: 根本的な解決にならない

### オプションC: API Routes を Next.js App Router へ移行
- メリット: 統一された Next.js ビルドシステムで管理可能
- デメリット:
  - 大規模なコード変更
  - Pages Functions の実装パターン・Streaming/Edge コンテキストの互換性検討が必要
  - 短期的な解決策としては不適切
- 不採用理由: 中長期のアーキテクチャ検討を要するため、現時点では不推奨

## 検証結果

### ローカル開発環境での動作確認

修正後に以下のコマンドを実行し、動作を確認：

```bash
npm run ui:build
npx wrangler pages dev .open-next/static --local true --port 8788
```

#### テスト結果

| エンドポイント | 修正前 | 修正後 | ステータス |
|---|---|---|---|
| `/api/session` | 404 Not Found | 200 OK | ✅ |
| `/api/session` 応答 | - | `{"status":"signed-out"}` | ✅ |
| `/api/donors` | 404 Not Found | 200 (API 応答) | ✅ |
| `/_next/static/*` | 200 OK | 200 OK | ✅ |

#### `_routes.json` の確認

修正前：
```json
{
  "version": 1,
  "description": "...",
  "include": ["/*"],
  "exclude": ["/_next/static/*", "/api/*", "/oauth/*", "/health"]
}
```

修正後：
```json
{
  "version": 1,
  "description": "...",
  "include": ["/*"],
  "exclude": ["/_next/static/*"]
}
```

## 影響範囲

### システム影響
- **API エンドポイント**: すべての Pages Functions ルート（`/api/`、`/oauth/` など）
- **ローカル開発**: `npm run dev` 実行時の動作確認が正常化
- **本番環境**: Cloudflare Pages デプロイ後の API 可用性が向上

### パフォーマンス影響
- **ビルド時間**: 変更なし（exclude 処理削除により微細な短縮）
- **実行時パフォーマンス**: 変更なし（ルーティング効率が改善される可能性あり）

### セキュリティ・運用への影響
- **セキュリティ**: 特に負の影響なし
- **運用**: 今後 API エンドポイント追加時に `_routes.json` の手動編集が不要に

## 設計上の考慮事項

### exclude パターン削除の正当性

当初、`_routes.json` に `/api/*` を追加した意図は明確ではないが、仮説として以下が考えられる：

1. API リクエストが Next.js Worker に到達しないようにする
   - ただし、Pages Functions Worker は別の worker であり、この目的では達成されていない
2. 静的ファイル配信を優先させる
   - `/_next/static/*` パターンで十分に実現可能

いずれにせよ、現在のアーキテクチャでは不要な設定である。

### 将来のアーキテクチャ検討

`/api/*` を Next.js App Router へ統合する検討が進む場合、その時点で `_routes.json` の設定を見直すことが妥当。

## 実装チェックリスト

- [x] `scripts/run-next-on-pages.cjs` から exclude 追加処理を削除
- [x] `npm run ui:build` で新しい `.open-next/_routes.json` を生成
- [x] ローカル環境で `/api/session` が 200 OK を返すことを確認
- [x] ローカル環境で他の API エンドポイントが正常に動作することを確認
- [x] 本ドキュメント（intent）を作成

## 今後の対応

### 短期（このコミット・PR で対応）
- [x] ビルドスクリプト修正実装
- [x] ローカル環境での動作確認
- [x] Intent ドキュメント作成

### 中期（PR マージ後）
- [ ] Cloudflare Pages プレビュー環境での動作確認
- [ ] Cloudflare Pages 本番環境での動作確認
- [ ] draft ドキュメント（`session-api-session-fetch-investigation.md`）を archives へ移行

### 長期（アーキテクチャ検討）
- [ ] API Routes を Next.js App Router へ統合する場合のロードマップ検討
- [ ] `_routes.json` のルーティング設定ポリシーを明文化し、`docs/guide/operations/` に記録

## 参考資料

- [Cloudflare Pages - Routing with _routes.json](https://developers.cloudflare.com/pages/configuration/routing/)
- [Cloudflare Pages Functions - Overview](https://developers.cloudflare.com/pages/functions/)
- `docs/draft/operations/session-api-session-fetch-investigation.md`: 詳細な調査レポート

---

## コミットメッセージ例

```
fix: remove /api/* exclude pattern from _routes.json to fix API routing

The build script was adding `/api/*`, `/oauth/*`, and `/health` to the
exclude patterns in _routes.json, which prevented API requests from
reaching the Pages Functions Worker.

According to Cloudflare Pages routing specification, the exclude pattern
means "do not run through any worker", which resulted in all API
requests receiving 404 errors.

Removing these exclude patterns allows API requests to reach the Pages
Functions Worker as intended.

Verified:
- /api/session returns 200 OK with {"status":"signed-out"}
- /api/donors endpoint is accessible
- /_next/static/* continues to be served statically

Closes #XXX
References: docs/draft/operations/session-api-session-fetch-investigation.md
```
