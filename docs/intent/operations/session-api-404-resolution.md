---
title: 'セッションAPI 404エラー解決のための Pages Functions ビルド統合'
domain: 'operations'
status: 'active'
version: '1.0.0'
created: '2025-11-05'
updated: '2025-11-05'
related_issues: []
related_prs: []
references:
  - ../../archives/plan/operations/session-api-404-investigation-and-resolution.md
  - ../../../scripts/run-next-on-pages.cjs
---

## 背景

Cloudflare Pages の本番・プレビュー環境およびローカル開発環境において、`/api/session` を含む全ての Pages Functions エンドポイントが 404 エラーを返す問題が発生していた。

調査の結果、根本原因は以下と特定された:
- ビルドプロセスが TypeScript ソースファイルをそのまま `.open-next/functions/` にコピーしていた
- これらのファイルは `../../src/lib/` などの外部依存を import していたが、依存関係がデプロイに含まれていなかった
- Cloudflare Pages Runtime がモジュール解決に失敗し、関数を読み込めず 404 を返していた

詳細な調査結果と問題分析は `docs/archives/plan/operations/session-api-404-investigation-and-resolution.md` を参照。

## 決定

**採用アプローチ**: `docs/archives/plan/operations/session-api-404-investigation-and-resolution.md` の「オプションA: Wrangler Pages Functions Build を統合」

### 実装内容

1. **ビルドスクリプトの修正** (`scripts/run-next-on-pages.cjs`)
   - 従来の raw TypeScript ファイルコピー処理を削除
   - `wrangler pages functions build --outdir` を実行し、依存関係をバンドルした単一の JavaScript ファイルを生成
   - 生成された `index.js` を `.open-next/functions/_worker.js` として配置

2. **ビルド手順**
   ```javascript
   // 1. wrangler pages functions build を実行
   npx wrangler pages functions build ./functions --outdir <temp-dir>
   
   // 2. コンパイル済み worker を配置
   cp <temp-dir>/index.js .open-next/functions/_worker.js
   ```

3. **成果物の構造**
   ```
   .open-next/
   ├── functions/
   │   └── _worker.js  (全依存関係を含むバンドル済み JavaScript)
   ├── _worker.js/     (Next.js 用の worker)
   └── ...
   ```

### 検討した代替案

- **オプションB**: `tsc` による手動トランスパイル
  - メリット: シンプルなツールチェーン
  - デメリット: バンドル処理が別途必要、Cloudflare 最適化の欠落
  - 不採用理由: 公式ツールを使う方が確実性が高い

- **オプションC**: JavaScript への書き直し
  - メリット: ビルドステップ不要
  - デメリット: 型安全性の喪失、大幅な書き直し
  - 不採用理由: 長期的な保守性が低下する

## 影響

### 解決される問題
- ✅ `/api/session` および全ての Pages Functions エンドポイントが 200 レスポンスを返す
- ✅ ローカル開発環境での動作確認が可能
- ✅ Cloudflare Pages デプロイ環境での正常動作

### 技術的影響
- **ビルド時間**: wrangler build の実行により約 2-3 秒増加（許容範囲内）
- **成果物サイズ**: バンドル済みのため若干増加するが、圧縮により実質的な影響は最小限
- **開発体験**: ビルドプロセスは自動化されており、開発者への影響なし

### 検証結果
- ローカル環境で `npm run dev` 実行後、`curl http://localhost:8788/api/session` が `{"status":"signed-out"}` を返すことを確認
- ビルド成功: `npm run build` が正常に完了し、`.open-next/functions/_worker.js` が生成されることを確認

## 今後の対応

### 短期 (この PR で対応)
- [x] ビルドスクリプトの修正実装
- [x] ローカル環境での動作確認
- [x] Intent ドキュメント作成
- [ ] Cloudflare Pages プレビュー環境での動作確認（PR マージ後）
- [ ] Plan ドキュメントの archive への移動

### 中長期 (今後検討)
- フォント読み込みの恒久的対応（現在は一時的にコメントアウト）
- CI での Pages Functions の自動テスト追加
- ビルド成果物の検証テスト追加

## 残課題

1. **Google Fonts の読み込み**
   - 現状: CI 環境でのビルド成功のため、`app/layout.tsx` のフォント読み込みを一時的に無効化
   - 対応: ネットワークアクセス可能な環境でビルドする、またはローカルフォントファイルを使用する方向で検討

2. **デプロイ環境での最終確認**
   - ローカル環境では動作確認済み
   - Cloudflare Pages プレビュー/本番環境での動作確認が必要

## 参考情報

- [Cloudflare Pages Functions - Build configuration](https://developers.cloudflare.com/pages/functions/build-configuration/)
- [Wrangler CLI - pages functions build](https://developers.cloudflare.com/workers/wrangler/commands/#pages-functions-build)
