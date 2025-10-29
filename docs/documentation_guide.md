# Documentation Guide

> **必読:** ドキュメントのアーカイブ運用・承認フローに関する最新ルールは、常に `docs/standards/documentation_operations.md` を参照し
> て遵守してください。

## このガイドの位置づけ
- プロジェクト内でドキュメントを作成・更新する際の入口となる案内板です。
- 迷ったときは、まず本ファイルから関連ドキュメントを辿り、必須ポリシーを確認してください。
- 詳細な執筆・レビュー手順は `docs/standards/documentation_guidelines.md`、アーカイブ運用や承認プロセスは `docs/standards/documentati
on_operations.md` を必ず確認します。

## 参照すべき中核ドキュメント
1. **`docs/standards/documentation_operations.md`**
   - 一時ドキュメント (`draft`/`plan`/`survey`) から `intent` への移行、`docs/archives/` へのアーカイブ手順、違反時の対処までを規定し
   ています。
   - `intent` 承認前のアーカイブ禁止など、レビュープロセスで必須となるルールが整理されています。
2. **`docs/standards/documentation_guidelines.md`**
   - ドキュメント体系、各ディレクトリの役割、front-matter の必須項目をまとめた実務ガイドラインです。
   - 執筆時のテンプレートやレビュー観点を確認する際に参照してください。
3. **`docs/plan/docs/documentation-operations-policy/plan.md`**
   - ドキュメント運用刷新に関する中長期的な計画書です。
   - 標準やガイドラインの改訂背景、段階的な自動化ロードマップを確認できます。

## 利用者へのお願い
- 新しいドキュメントを追加するときは、上記 3 文書を読み、運用・レビューの前提条件に矛盾がないかを確認してください。
- `intent` 承認後にアーカイブを行う場合は、PR の説明欄で対象ドキュメントと移行先を明示し、レビュワーにも周知してください。
- ガイドラインに改善点を見つけた場合は、`docs/draft/` で議論を開始し、合意形成後に標準ドキュメントを更新してください。

## 最終更新の扱い
- 本ファイルを更新した場合は、`docs/standards/documentation_operations.md` と `docs/standards/documentation_guidelines.md` の整合性
  を確認してください。
- 重要な改訂を行った際は、`CHANGELOG.md` への記載とチーム内共有を推奨します。
