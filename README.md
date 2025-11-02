# Donation Portal

Discord コミュニティ向けの寄付ポータルを Cloudflare Pages 上に構築するプロジェクトです。Stripe による単発・定期寄付を受け付け、寄付者の同意のもとで表示名を公開します。

## 概要

- **プラットフォーム**: Cloudflare Pages（Next.js React UI）/ Pages Functions（バックエンド）
- **技術スタック**: TypeScript, Next.js (App Router), Stripe SDK, Discord OAuth
- **データ管理**: Stripe Customer metadata が Single Source of Truth
- **主要機能**:
  - `/donate` - 寄付案内ページ、同意フォーム
  - Stripe Checkout による決済処理
  - `/thanks` - 寄付完了画面
  - `/donors` - 同意者の表示名一覧
  - Discord OAuth 連携

## セットアップ

### 前提条件

- Node.js 18.x 以上
- npm 10 以上
- Stripeのセットアップが完了していること
- Discord Applicationの作成が完了していること

### 初期セットアップ

```bash
# リポジトリをクローン
git clone <repo-url>
cd donation_portal

# Node.js バージョンを合わせる（nvm を使用）
nvm install
nvm use

# 依存パッケージをインストール
npm install
```

詳細なセットアップ手順は `docs/guide/development/setup.md` を参照してください。

## ディレクトリ構成

- `app/` - Next.js (App Router) ベースの React UI
- `components/` - UI コンポーネントとページ共有ロジック
- `lib/` - 共通 TypeScript モジュール（認証、ユーティリティなど）
- `functions/` - Cloudflare Pages Functions エンドポイント
- `public/` - 旧来の静的ページ（後方互換のため保持）
- `scripts/` - 開発支援スクリプト（lint、typecheck、build など）
- `docs/` - プロジェクトドキュメント（ガイドライン、計画書、参考資料）
