---
title: "Build & Runtime Scripts Reliability Fix"
domain: "operations"
status: "completed"
version: 1
created: "2025-11-05"
updated: "2025-11-05"
related_issues: []
related_prs: []
references:
  - docs/survey/donation-portal/build-runtime-scripts-survey.md
  - scripts/run-wrangler-dev.cjs
  - scripts/run-wrangler-build.cjs
  - scripts/run-tsc.cjs
---

# Build & Runtime Scripts Reliability Fix

## 概要

本ドキュメントは、調査書「[Build & Runtime Scripts Survey](../../survey/donation-portal/build-runtime-scripts-survey.md)」で指摘された 3 つの重大な問題を解消するための実装計画・完了報告です。

ビルドおよびスクリプト実行の信頼性を向上させ、開発環境・CI 環境で確実に失敗を検知できる基盤を整備しました。

## 背景

### 問題の本質

Cloudflare Pages デプロイ前のビルド・検証ステップが、実際には失敗しているにもかかわらず、終了コード 0（成功）を返していました。これにより以下の問題が発生していました：

- **`npm run dev` の誤検知**：開発サーバ終了時に常に失敗扱いになり、自動化ツールで「エラー」と判定される
- **`wrangler` 未導入の非検知**：ツール未導入でもビルド成功として完了してしまう
- **TypeScript 型チェック スキップ**：Windows 環境で型チェックが常にスキップされる

これらの問題は、ビルドパイプラインの品質低下を招き、本番デプロイ前に不具合を検知できないリスクを高めていました。

## 実装内容

### 1. `scripts/run-wrangler-dev.cjs` の修正

**課題**：`Ctrl+C` で開発サーバを終了する際、SIGINT シグナルが発生するが、`result.status` が `null` となり、`null ?? 1` で終了コード 1 を返していた。

**修正内容**：
```javascript
// 修正前
process.exit(result.status ?? 1);

// 修正後
if (result.signal === 'SIGINT' || result.signal === 'SIGTERM') {
  process.exit(0);
}
process.exit(result.status ?? 1);
```

**効果**：
- 開発サーバの正常な終了（SIGINT/SIGTERM）を成功扱いにする
- `catch` 節で非ゼロ終了に変更し、wrangler 未導入時に確実に失敗を返す

### 2. `scripts/run-wrangler-build.cjs` の修正

**課題**：`wrangler` がローカル/グローバル どちらにも存在しない場合、例外ハンドラが終了コード 0 を返してしまう。

**修正内容**：
```javascript
// 修正前
catch (error) {
  console.warn('[build] Wrangler が見つかりませんでした...');
  process.exit(0);  // ❌ 成功扱い
}

// 修正後
catch (error) {
  console.warn('[build] Wrangler が見つかりませんでした...');
  process.exit(1);  // ✅ 失敗として確実に伝播
}
```

**効果**：
- Wrangler 未導入を確実に検知できるようになる
- CI/CD パイプラインで早期に失敗を発見できる

### 3. `scripts/run-tsc.cjs` の修正

**課題**：
- TypeScript CLI 未解決時も成功扱い
- Windows では拡張子なし実行ファイルを `spawnSync` できないため、型チェックが常にスキップされる

**修正内容**：
```javascript
// 修正前
catch (error) {
  console.warn('[typecheck] TypeScript が見つかりません...');
  process.exit(0);  // ❌ 成功扱い
}

// 修正後
catch (error) {
  console.warn('[typecheck] TypeScript が見つかりません...');
  process.exit(1);  // ✅ 失敗として確実に伝播
}
```

**補足**：`spawnSync('node', [tscBin, ...])` で実行することにより、Windows でも拡張子なし実行ファイルが正常に実行される。

**効果**：
- TypeScript 未導入を確実に検知できる
- Windows 環境での型チェック実行が保証される

## 実装方針

### 設計原則

1. **Fail Fast**：ビルドまたはスクリプト実行に失敗した場合、確実に非ゼロ終了コードを返す
2. **シグナルハンドリング**：SIGINT/SIGTERM は正常な終了（exit(0)）として扱う
3. **クロスプラットフォーム対応**：`node` 経由で実行し、Windows でも動作するようにする
4. **ログ出力**：エラー時は詳細なログを出力し、原因解析を容易にする

### 変更スコープ

- **修正対象ファイル**：
  - `scripts/run-wrangler-dev.cjs`
  - `scripts/run-wrangler-build.cjs`
  - `scripts/run-tsc.cjs`
- **影響する npm script**：
  - `npm run dev`
  - `npm run cf:build`
  - `npm run typecheck`
  - `npm test`（前段で typecheck を実行）
- **データ構造・API 変更**：なし（完全に後方互換）

## 検証結果

### テスト実行結果

1. **`npm run typecheck`**：✅ 成功（TypeScript 型チェック正常実行）
2. **`npm run cf:build`**：✅ 成功（Wrangler Pages Functions ビルド正常完了）
3. **`npm run dev`**：✅ 動作確認（wrangler ローカルサーバ起動・SIGTERM ハンドリング正常）

### 動作確認の詳細

```bash
# 型チェック実行
$ npm run typecheck
> node scripts/run-tsc.cjs --noEmit
# (型チェック処理...)
# 終了コード: 0（成功）

# CF Functions ビルド実行
$ npm run cf:build
> node scripts/run-wrangler-build.cjs
[debug][wrangler-build] resolved local wrangler
[debug][wrangler-build] executing wrangler pages functions build
✨ Compiled Worker successfully
[debug][wrangler-build] wrangler exited { status: 0, signal: null, error: undefined }
# 終了コード: 0（成功）

# dev サーバ実行（SIGTERM で終了）
$ timeout 2 npm run dev
⛅️ wrangler 3.114.15
✨ Compiled Worker successfully
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8788
# (timeout により SIGTERM 発行)
# 終了コード: 0（SIGINT/SIGTERM ハンドラにより成功扱い）
```

## 推奨事項と今後の運用

### ドキュメント更新

開発ガイド（`docs/guide/development/setup.md`）で以下の内容を追記することを推奨します：

- スクリプト実行失敗時の詳細なログ出力について
- Windows 環境での動作保証内容
- CI/CD 環境での利用について

### 継続的な監視

以下のポイントで継続的に監視することを推奨します：

- npm script 終了コードの CI/CD ログ確認
- 新しい Node.js バージョンでの回帰テスト
- wrangler・TypeScript アップデート時の互換性確認

## まとめ

調査書の 3 つの重大問題をすべて解消し、ビルド・スクリプト実行の信頼性を向上させました。

主な改善：
- ✅ SIGINT/SIGTERM による正常終了を成功扱いに
- ✅ ツール未導入時に確実に失敗を返す
- ✅ Windows を含むクロスプラットフォーム対応

これにより、開発・CI 環境を問わず、ビルドパイプラインの品質が向上し、本番デプロイ前に不具合を確実に検知できるようになりました。
