---
title: "Build & Runtime Scripts Survey"
domain: "operations"
status: "proposed"
version: 1
created: "2025-11-05"
updated: "2025-11-05"
related_issues: []
related_prs: []
references:
  - scripts/build.cjs
  - scripts/run-next-on-pages.cjs
  - scripts/run-wrangler-dev.cjs
  - scripts/run-wrangler-build.cjs
  - scripts/run-tsc.cjs
  - docs/guide/development/setup.md
---

# Build & Runtime Scripts Survey

## 背景

Cloudflare Pages へのデプロイとローカル検証を確実に行うためには、Next.js ビルドや Pages Functions のバンドル、`wrangler` によるローカルサーバ起動といった一連のスクリプトが安定して動作する必要がある。これらの処理に失敗すると、ビルド済みアーティファクトの欠落やサーバ起動失敗に気付きづらく、デプロイ前に不具合を検知できないリスクが高まる。本調査では、現行スクリプトが期待どおりの失敗検出と終了コードを返すか、クロスプラットフォームで安定して実行できるかを重点的に確認した。

## 目的

- `npm run build` / `npm run ui:build` / `npm run dev` / `npm run cf:build` / `npm run typecheck` の実行経路を把握する。
- ビルド・サーバ実行関連スクリプトで、失敗を見逃す、もしくは再現性に欠ける挙動を洗い出す。
- 発見した不具合に対する修正方針を整理する。

## 調査対象と範囲

- `scripts/build.cjs`（`npm run build` のエントリポイント）
- `scripts/run-next-on-pages.cjs`（Next on Pages CLI ラッパー）
- `scripts/run-wrangler-dev.cjs`（`npm run dev`）
- `scripts/run-wrangler-build.cjs`（`npm run cf:build`）
- `scripts/run-tsc.cjs`（`npm run typecheck` / `npm test` 前段）
- `docs/guide/development/setup.md`（使用想定の確認）

## 調査手法

1. `package.json` から対象 npm script を抽出し、それぞれがどのラッパースクリプトを呼び出すかを紐付けた。
2. 各スクリプトの終了コード処理、依存コマンドの解決方法、プラットフォーム依存箇所を静的解析した。
3. 既存ドキュメントを確認し、開発者が想定する利用フローとスクリプト実装の整合性を点検した。
4. 調査中に判明した挙動をもとに、再現手順と影響範囲を整理した。

## 主な所見

### 1. `npm run dev` 中断時に常に終了コード 1 を返す（重大）

- 該当箇所: `scripts/run-wrangler-dev.cjs` の `process.exit(result.status ?? 1);`。
- `wrangler pages dev` プロセスは開発者が `Ctrl+C` で終了するのが通常フローだが、`spawnSync` が `SIGINT` で終了した場合 `result.status` は `null`。現行実装では `null ?? 1` により終了コード 1 を返す。
- その結果、`npm run dev` を終了するたびに npm が失敗扱い (`npm ERR! code 1`) となり、自動化ツールや並列ターミナルで「エラー」と誤検知される。
- **推奨修正**: `result.signal === 'SIGINT'`（および `'SIGTERM'`）を成功扱いにし、`process.exit(0)` を返すガードを挿入する。

### 2. `wrangler` 未導入でも成功終了してしまう（重大）

- 該当箇所:
  - `scripts/run-wrangler-dev.cjs` の `catch` 節で `process.exit(0);`。
  - `scripts/run-wrangler-build.cjs` の `catch` 節で `process.exit(0);`。
- `wrangler` がローカル/グローバルどちらにも存在しない場合や `npm root -g` が失敗した場合、警告ログを出すだけで終了コード 0 を返す。
- `docs/guide/development/setup.md` では「未インストールの場合はエラーになる」と明記されているが、CI や prepublish の自動実行ではこのバグにより失敗が検知できない。
- **推奨修正**: `catch` 節で `process.exit(1)` など非ゼロを返し、上位に確実に伝播させる。併せてログに `command` / `cwd` を含めると原因解析が容易になる。

### 3. TypeScript CLI 未解決時も成功扱い + Windows 非対応（重大）

- 該当箇所: `scripts/run-tsc.cjs`。
- `typescript` が依存に入っていない、もしくはローカル解決に失敗した場合でも `catch` 節で `process.exit(0);` を返すため、`npm run typecheck`・`npm test` が「成功」扱いで終了する。
- さらに `resolveLocalBin('typescript', 'tsc')` が返すパスは `node_modules/typescript/bin/tsc`。Windows では拡張子なし実行ファイルを `spawnSync` できないため、実際には `ENOENT` が発生して `catch` に落ちる。この状態でも終了コード 0 のため、Windows 環境で型チェックが常にスキップされる。
- **推奨修正**: 例外時に非ゼロ終了へ変更し、Windows では `spawnSync('node', [tscBin, ...])` もしくは `npx` 経由に切り替える。

### 4. 現状大きな問題が見つからなかった領域

- `scripts/build.cjs` と `scripts/run-next-on-pages.cjs` は、`NEXT_ON_PAGES_BUILD` のループ防止や `.open-next` の初期化、Pages Functions のバンドルなど期待通りに制御している。
- ビルド成功後に `public` ディレクトリを `static` 配下へコピーする処理も冪等に設計されており、現時点で大きなリスクは確認できなかった。

## 推奨アクション

1. `scripts/run-wrangler-dev.cjs` に `SIGINT` / `SIGTERM` を成功扱いとする分岐を追加し、`catch` 節の終了コードを非ゼロに修正する。
2. `scripts/run-wrangler-build.cjs` の `catch` 節を同様に非ゼロ終了へ変更する。
3. `scripts/run-tsc.cjs` をクロスプラットフォーム対応へ修正し、TypeScript 未導入時に確実に失敗を返す。
4. 上記修正後、`npm run dev`・`npm run cf:build`・`npm run typecheck` を Linux / macOS / Windows（WSL 含む）で回帰確認する。
5. ドキュメント（例: `docs/guide/development/setup.md`）で修正点に触れ、終了コード挙動が改善された旨を共有する。

## 参考メモ

- `wrangler` 解決では `npm root -g` に依存しているため、npm が存在しない環境（例: corepack + pnpm-only）の利用者には別途インストール手順を案内する必要がある。
- `npm run dev` は `.open-next/` の静的アセットがない場合に `public/` を配信するフォールバックを持つが、SSR/Edge Runtime を利用する場合は事前に `npm run ui:build` を実行する運用を継続する。
