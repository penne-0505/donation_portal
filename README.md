# Donation Portal

Donation Portal プロジェクトは Discord コミュニティ向けの寄附ポータルを Cloudflare Pages 上に構築するためのリポジトリです。Phase 1 では開発・CI/CD の土台づくりにフォーカスしています。

## ディレクトリ構成

- `src/` — 共通で再利用する TypeScript モジュール群。ビジネスロジックやユーティリティを配置します。
- `functions/` — Cloudflare Pages Functions のエンドポイントを配置します。`functions/api` 以下に API ルートを追加します。
- `public/` — 静的アセットやスタブページを配置します。Pages へのデプロイ時に配信対象となります。
- `scripts/` — 開発支援用の Node.js スクリプト（lint/typecheck などのラッパー）を配置します。
- `docs/` — ドキュメント群。標準・ガイドライン・計画書などは `docs/standards` や `docs/plan` に配置されています。

## 開発環境セットアップ

セットアップ手順やローカル開発の流れは `docs/guide/development/setup.md` を参照してください。

## ライセンス

本リポジトリのライセンスは未定義です（後続フェーズで決定します）。
