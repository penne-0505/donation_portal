# コードスタイル・規約
- Prettier (.prettierrc): `singleQuote: true`, `trailingComma: all`, `printWidth: 100`, `semi: true`。
- ESLint (eslint.config.js): distを除外、JS/TSとも未使用変数をエラー扱い（`_`プレフィックスで除外）、`eqeqeq: smart`。
- TypeScript ESLintプラグインを利用し、`tsconfig.json` ベースで型情報を参照。
- ドキュメントは `docs/standards/documentation_guidelines.md` と `docs/standards/documentation_operations.md` に従う。目的に応じて guide/reference/plan/intent/survey/draft 等のディレクトリに配置する。