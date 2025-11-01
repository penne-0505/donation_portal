# タスク完了時のチェック
- 変更に応じて `npm run lint`、`npm run typecheck`、`npm test` を実行し、必要なら `npm run build` で Functions ビルドを確認。
- ドキュメント変更時は `docs/standards/documentation_guidelines.md` と `documentation_operations.md` に沿って関連文書を更新し、front-matterやリンク整合性を確認。
- Secrets・環境変数を扱う変更は `.env.example` と運用ガイドへの影響有無を確認。
- 変更内容を簡潔にまとめ、必要であれば TODO や docs にフォローアップを記載。