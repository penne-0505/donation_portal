# よく使うコマンド
- `npm install` 依存インストール。
- `npm run dev` Cloudflare Pages Functions付きローカル開発サーバ (wrangler)。
- `npm run lint` ESLint 静的解析 (scripts/run-eslint.cjs)。
- `npm run format` Prettier チェック、`npm run format:write` で整形適用。
- `npm run typecheck` TypeScript 型チェック (scripts/run-tsc.cjs --noEmit)。
- `npm test` distを再生成しNode --testでユニットテスト実行。
- `npm run build` wrangler build ラッパーでビルド検証。