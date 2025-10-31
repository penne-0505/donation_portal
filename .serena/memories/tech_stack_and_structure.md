# 技術スタックとディレクトリ
- 言語: TypeScript (ESM)。Cloudflare Workers/Pages Functions、Stripe SDK、Discord OAuth。
- 主なディレクトリ:
  - `src/`: 共通ビジネスロジックやユーティリティ。
  - `functions/`: Cloudflare Pages Functions API (`/api/checkout/session`, `/api/webhooks/stripe` など)やOAuthエンドポイント。
  - `public/`: `/donate` `/thanks` `/donors` などの静的ページ。
  - `tests/`: Node標準テストランナー用のユニットテスト。
  - `docs/`: ガイド・標準・計画書など（`docs/standards/documentation_guidelines.md` に運用方針）。
  - `scripts/`: lint・typecheck・wrangler dev/build などのラッパースクリプト。