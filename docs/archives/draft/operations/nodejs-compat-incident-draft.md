---
title: 'Cloudflare Pages nodejs_compat 不適用の原因調査メモ'
domain: 'operations'
status: 'superseded'
version: '0.1.1'
created: '2025-11-02'
updated: '2025-11-02'
related_issues: []
related_prs: []
references:
  - ../../_temp_logs/donation-portal.fc84d07a-d942-48c1-a9a0-3e8dfe7b1404.log
state: 'paused'
hypothesis: |
  Cloudflare Pages 側で `nodejs_compat` が有効化されていない、もしくはビルド成果物に含めた互換性メタデータが取り込まれていない、という初期仮説の記録（意図文書 `docs/intent/operations/nodejs-compat-resolution.md` に統合済み）。
options:
  - Cloudflare Pages のプロジェクト設定で Compatibility Flags として `nodejs_compat` を明示する
  - `.open-next/_worker.js/metadata.json` に互換情報を保持し、Cloudflare へ正しくアップロードされているか検証する
  - `wrangler.toml` を修正し、Pages Build が互換フラグを解釈できる形式にする
open_questions:
  - Cloudflare Pages が Direct Upload 時に `metadata.json` 内の互換フラグを読み取っているかを確認する方法はあるか？
  - `wrangler` が出力する Node.js 互換性警告はデプロイ後にも継続して発生するのか、それとも設定反映後に解消されるのか？
next_action_by: 'ops-team'
review_due: '2025-11-09'
ttl_days: 30
---

## 観測ログから読み取れる事象

- Cloudflare Pages の本番ビルドログで `wrangler.toml` が無効と判断され、`pages_build_output_dir` が未定義のためスキップされている。
  - `_temp_logs/donation-portal.fc84d07a-d942-48c1-a9a0-3e8dfe7b1404.log` 2025-11-02T01:43:43Z および 2025-11-02T01:44:35Z にて、Wrangler が設定ファイルを読み込めず `Skipping file and continuing.` と出力。
- Wrangler のバンドル処理で `node:buffer` と `node:async_hooks` が「ファイルシステム上に存在せず Node.js に内蔵」と警告され、`nodejs_compat` フラグの有効化が求められている。
  - 同ログ 2025-11-02T01:44:36Z の WARNING にて、互換フラグ未設定を示唆。
- 当方スクリプトで生成した `.open-next/_worker.js/metadata.json` には `compatibility_flags: ["nodejs_compat"]` が含まれているものの、Wrangler 警告は解消されていない。
  - ログ 2025-11-02T01:44:33Z のデバッグ出力にてメタデータ生成を確認。

## 原因となり得る実装・設定箇所

1. **`wrangler.toml` 設定不備**
   - Pages Build は `wrangler.toml` に `pages_build_output_dir` が存在しないと判断し、互換フラグ等の設定を読み込んでいない。
   - プロジェクトレベルで `compatibility_flags = ["nodejs_compat"]` を設定していても、ファイルが無効扱いになることで反映されていない可能性。

2. **`metadata.json` 形式・配置の不整合**
   - `metadata.json` に `compatibility_date` と `compatibility_flags` のみを記述しているが、Cloudflare の Direct Upload では `main_module` や `bindings` を同梱する形式が前提のため無視されている懸念がある。
   - その結果、Wrangler 警告通り `nodejs_compat` が適用されず、本番で `Node.JS Compatibility Error` が発生。

3. **Cloudflare Pages ダッシュボード側の互換フラグ未設定**
   - 過去に Preview では設定済みでも Production 側が未設定であるとの報告があり、再発の可能性。
   - Wrangler の警告は Pages 側設定が欠落している場合にも発生する。

## 次のステップ案

- `wrangler.toml` を見直し、`pages_build_output_dir = ".open-next"` を含めた正式フォーマットへ更新する。
- Cloudflare Pages Dashboard の Production/Preview 両方で `nodejs_compat` が有効になっているか、再度スクリーンショット取得や設定確認を実施する。
- `metadata.json` を公式サンプルと比較し、必要なキーが不足していないかを検証する（例: `main_module`, `compatibility_date` の形式）。
- Wrangler 警告が解消されるまで、本番デプロイ前に `wrangler pages functions build` をローカルで実行し、互換警告の有無をチェックする運用を検討する。
