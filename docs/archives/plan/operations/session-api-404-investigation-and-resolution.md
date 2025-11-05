---
title: 'セッションAPI 404エラー調査と解決計画'
domain: 'donation-portal'
status: 'active'
version: '1.0.0'
created: '2025-11-04'
updated: '2025-11-04'
related_issues: []
related_prs: []
references:
  - docs/guide/development/setup.md
  - docs/intent/donation-portal/mvp-architecture-and-phases.md
---

# セッションAPI 404エラー調査と解決計画

## 1. 問題の概要

### 1.1 現象

現在、ローカル環境・Cloudflare Pages（プレビュー・本番）の両方において、以下のエラーが発生している:

- **UI表示**: 「セッション情報の取得に失敗しました」というエラーメッセージ
- **ブラウザコンソール**:
  - `GET https://donation-portal.pages.dev/api/session 404 (Not Found)`
  - React hydration error #418 (Minified React error)

### 1.2 影響範囲

- `/donate` ページでセッション状態を取得できないため、ログイン状態の判定・表示名取得・同意状態の確認ができない
- OAuth後のリダイレクト先でもセッション情報が取得できず、ユーザー体験が損なわれる
- `/donors` ページなど、セッション情報を利用する全ての画面に影響

### 1.3 発生時期

- ローカル環境: `npm run dev` 実行時
- Cloudflare Pages: プレビュー・本番デプロイ後

## 2. 根本原因の分析

### 2.1 調査結果

#### 2.1.1 ファイル構造の確認

```
functions/
├── api/
│   ├── session.ts          ← エンドポイントは存在する
│   ├── consent.ts
│   ├── donors.ts
│   └── checkout/
│       └── session.ts
├── oauth/
│   ├── start.ts
│   ├── callback.ts
│   └── logout.ts
└── _middleware.ts
```

**確認**: `/api/session` に対応する `functions/api/session.ts` は存在し、正しく `onRequestGet` ハンドラーをエクスポートしている。

#### 2.1.2 ビルドプロセスの追跡

ビルドフローは以下の通り:

1. `npm run build` → `scripts/build.cjs`
2. → `scripts/run-next-on-pages.cjs` 
3. → `@cloudflare/next-on-pages` が Next.js をビルド
4. → **カスタム処理**: `functions/` ディレクトリを `.open-next/functions/` にコピー

**問題箇所**: `scripts/run-next-on-pages.cjs` の該当コード:

```javascript
const outputFunctionsDir = path.join(outputDir, 'functions');
const sourceFunctionsDir = path.resolve('functions');
try {
  if (fs.existsSync(sourceFunctionsDir)) {
    fs.rmSync(outputFunctionsDir, { recursive: true, force: true });
    fs.mkdirSync(outputFunctionsDir, { recursive: true });
    fs.cpSync(sourceFunctionsDir, outputFunctionsDir, { recursive: true });
  }
} catch (error) {
  console.warn(`[next-on-pages] 既存 Functions のコピーに失敗しました: ${error.message}`);
}
```

この処理は **TypeScriptソースファイルをそのままコピー** しているが、Cloudflare Pagesが実際に実行できるのはJavaScriptファイルまたはCloudflareがビルドするTypeScriptファイルである。

#### 2.1.3 Cloudflare Pages Functions の動作要件

Cloudflare Pages Functionsは以下のいずれかの形式を要求:

1. **JavaScript (.js)**: そのまま実行可能
2. **TypeScript (.ts)**: Cloudflareが自動でコンパイル（ただし、外部の `src/lib` などへの依存がある場合、それらも解決可能である必要がある）
3. **バンドルされたWorkerスクリプト**: `wrangler pages functions build` で生成

現在の問題:

- `functions/api/session.ts` は `../../src/lib/auth/session.js` からインポートしている
- コピーされたファイルには `src/` ディレクトリが含まれていないため、インポート解決に失敗
- 結果として、Cloudflare Pages Runtime が関数を正しく実行できず、404が返される

#### 2.1.4 検証: wrangler pages functions build

`npm run cf:build` を実行すると、`wrangler pages functions build` が正常に完了し、`_worker.bundle` が生成される。これは:

- 全てのTypeScriptファイルをトランスパイル
- 依存関係を解決してバンドル
- 単一のWorkerスクリプトとして実行可能

しかし、**この成果物は `.open-next/` ビルドプロセスで使用されていない**。

### 2.2 根本原因の特定

**根本原因**: ビルドプロセスが、Cloudflare Pages Functionsを適切にコンパイル・バンドルせず、TypeScriptソースファイルをそのままコピーしているため、実行時にモジュール解決ができず404エラーとなる。

具体的には:

1. `run-next-on-pages.cjs` が raw TypeScript files を `.open-next/functions/` にコピー
2. `functions/api/session.ts` が `../../src/lib/` を参照しているが、その依存関係が解決されない
3. Cloudflare Pages Runtimeが関数を読み込めず、エンドポイントとして認識されない
4. 結果として `/api/session` が404を返す

## 3. 解決アプローチ

### 3.1 選択肢の比較

#### オプション A: Wrangler Pages Functions Build を統合

**アプローチ**:
- `run-next-on-pages.cjs` を修正し、`wrangler pages functions build` を実行
- 生成された `_worker.bundle` またはコンパイル済みJSファイルを `.open-next/functions/` に配置

**メリット**:
- Cloudflare公式ツールを使用し、確実に動作
- TypeScript + 依存関係の解決が保証される
- ローカル開発とデプロイの一貫性

**デメリット**:
- ビルド時間の増加（わずか）
- スクリプトの複雑化

**推奨度**: ⭐⭐⭐⭐⭐

#### オプション B: TypeScript ファイルを手動でトランスパイル

**アプローチ**:
- `tsc` を使って `functions/` と `src/` をまとめてコンパイル
- 出力JSファイルを `.open-next/functions/` にコピー

**メリット**:
- シンプルなツールチェーン
- カスタマイズ性が高い

**デメリット**:
- トランスパイル設定の管理が必要
- バンドル処理が別途必要になる可能性
- Cloudflare Pages特有の最適化が欠落

**推奨度**: ⭐⭐⭐

#### オプション C: Functions を JavaScript で書き直す

**アプローチ**:
- `functions/` 配下を全てJavaScriptで記述し直す
- `src/lib` もJavaScriptにマイグレーション

**メリット**:
- ビルドステップが不要

**デメリット**:
- 型安全性の喪失
- 大幅な書き直しが必要
- 長期的な保守性の低下

**推奨度**: ⭐（推奨しない）

### 3.2 推奨解決策: オプション A の実装

#### 3.2.1 修正内容

**ファイル**: `scripts/run-next-on-pages.cjs`

**変更点**:

1. `functions/` の raw コピーを削除
2. `wrangler pages functions build` を実行してコンパイル済みFunctionsを生成
3. コンパイル済みの成果物を `.open-next/functions/` に配置

#### 3.2.2 実装詳細

```javascript
// 既存のコピー処理を削除し、wranglerビルドを実行

function buildPagesFunctions() {
  const result = spawnSync(
    resolveNpxCommand(),
    ['wrangler', 'pages', 'functions', 'build', './functions'],
    { stdio: 'inherit' }
  );
  
  if (result.status !== 0) {
    throw new Error('Pages Functions のビルドに失敗しました');
  }
  
  // _worker.bundle と関連ファイルを適切な場所に配置
  const workerBundle = path.resolve('_worker.bundle');
  const targetPath = path.join(outputDir, 'functions');
  
  // ビルド成果物の配置処理
  // (詳細は実装時に精査)
}
```

#### 3.2.3 検証手順

1. **ローカルビルド検証**:
   ```bash
   npm run build
   ls -la .open-next/functions/  # コンパイル済みファイルの確認
   npm run dev
   curl http://localhost:8788/api/session  # 200 OKを期待
   ```

2. **ブラウザ確認**:
   - `http://localhost:8788/donate` にアクセス
   - 「セッション情報の取得に失敗しました」が表示されないことを確認
   - DevToolsで `/api/session` が 200 を返すことを確認

3. **Cloudflare Pages プレビュー**:
   - PRを作成し、プレビューデプロイを待機
   - プレビューURLで同様の確認

4. **テスト実行**:
   ```bash
   npm test  # 既存のテストが全て通過することを確認
   ```

### 3.3 代替案: Next.js App Router API Routes の使用

もし上記アプローチが複雑すぎる場合の代替策として、Next.js 15 の App Router API Routes (`app/api/session/route.ts`) を使用する方法もある。

**メリット**:
- Next.jsの標準的なパターン
- `next-on-pages` が自動的にCloudflare Pages Functions に変換

**デメリット**:
- 既存の `functions/` ベースのアーキテクチャから大幅に逸脱
- OAuth/Webhookなど他のFunctionsも移行が必要
- プロジェクトの設計方針との不整合

**推奨**: 現時点では採用しない（将来的な選択肢として保留）

## 4. 実装計画

### 4.1 タスク分解

- [ ] `run-next-on-pages.cjs` の修正実装
- [ ] ローカルビルドとdev環境での動作確認
- [ ] 既存テストの実行と成功確認
- [ ] ブラウザでの動作検証（ローカル）
- [ ] PRマージとプレビューデプロイ
- [ ] プレビュー環境での動作確認
- [ ] 本番デプロイと最終検証
- [ ] ドキュメント更新（setup.md, README.mdなど）

### 4.2 リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| wrangler build が環境変数を必要とする | 中 | ビルド時に必要な環境変数を `.env.example` に明示 |
| ビルド成果物の構造が想定と異なる | 高 | 事前に `npm run cf:build` で出力構造を確認 |
| Next.js と Pages Functions の統合に問題 | 中 | `_routes.json` の除外設定を再確認 |
| 既存テストの破損 | 低 | テストは `functions/` の .ts ファイルを直接参照しているため影響なし |

### 4.3 ロールバック戦略

もし本アプローチが失敗した場合:

1. **即時**: PRをrevertし、既存の動作状態に戻す（ただし404問題は残る）
2. **短期**: オプションBに切り替え、`tsc` による手動トランスパイルを実装
3. **長期**: Next.js API Routesへの移行を検討

## 5. 成功基準

以下が全て満たされた場合、本計画は成功とする:

- [x] 根本原因が特定され、文書化されている
- [ ] ローカル環境で `/api/session` が 200 を返す
- [ ] Cloudflare Pages プレビュー環境で `/api/session` が 200 を返す
- [ ] UI で「セッション情報の取得に失敗しました」エラーが表示されない
- [ ] 既存の全テスト（52件）が成功する
- [ ] OAuth, Checkout, Webhook など他のFunctionsも正常動作する
- [ ] ビルドプロセスのドキュメントが更新されている

## 6. 参考情報

### 6.1 Cloudflare Pages Functions ドキュメント

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Functions routing](https://developers.cloudflare.com/pages/functions/routing/)
- [TypeScript support](https://developers.cloudflare.com/pages/functions/typescript/)

### 6.2 関連コード

- `functions/api/session.ts`: セッションAPIエンドポイント実装
- `lib/ui/hooks/use-session.ts`: フロントエンドのセッションHook
- `scripts/run-next-on-pages.cjs`: ビルドスクリプト（修正対象）
- `scripts/run-wrangler-build.cjs`: Wranglerビルド実行スクリプト

### 6.3 関連Issue・PR

（このドキュメント作成後に追記）

## 7. 次のステップ

1. このドキュメントをレビューし、アプローチに合意
2. `run-next-on-pages.cjs` の修正実装
3. 段階的なテストと検証
4. 必要に応じてアプローチの調整
5. 成功後、運用ガイドへの知見の反映

---

**更新履歴**:
- 2025-11-04: 初版作成（調査結果と解決計画）
