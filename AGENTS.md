# AGENTS.md

このファイルは、LLM/AIエージェントがリポジトリを扱う際の最小限のガイダンスです。

## 原則
- ユーザーとは**日本語**で会話する(思考は英語で行う)。
- 使用可能なツールをフル活用する。
- **入念に現状実装やドキュメントを参照、分析してから実装を行う。**
- **`git rm`や`rm`などのファイル削除は禁止**（ユーザーに提案し、実行は待つ）
- **[@docs/standards/documentation_guidelines.md](docs/standards/documentation_guidelines.md)と[@docs/standards/documentation_operations.md](docs/standards/documentation_operations.md)に従い、積極的にドキュメント運用・記述を行う**
- 日付確認には`date`コマンドを使用する。

## プロジェクト概要
- **名前**: Donation Portal（Discord寄付受付）  
- **目的**: Discordコミュニティ向けに、**対価（特典）を一切伴わない任意の寄付**を受け付ける。寄付者名は**同意者のみ**サイトに表示（額・回数・順位は非表示）。  
- **プラットフォーム**: **Cloudflare Pages**（/donate, /thanks, /donors）＋ **Pages Functions（Workers）**  
- **機能**:  
  - Stripe Checkout による **単発／定期**寄付  
  - 成功後 `/thanks` 表示（独自メール送信は無し、Stripeレシートのみ）  
  - **Donors** ページ（同意者の表示名のみ列挙／撤回可）  
  - Discord OAuth による表示名取得＆掲示同意の管理  
  - Stripe Webhook 受信（`payment_intent.succeeded` / `invoice.paid`）

## 技術仕様
- **スタック**: TypeScript, Cloudflare Workers (Pages Functions), Stripe SDK, Discord OAuth  
- **データ方針**: **SSOT = Stripe**（自前DBは持たない）。`Customer.metadata` に  
  `display_name`, `display_name_source=discord`, `discord_id`, `consent_public` を保存。  
- **アーキテクチャ**:  
  - 画面: `/donate`（寄付案内・同意UI）→ Checkout → `/thanks`  
  - API:  
    - `POST /api/checkout/session`（OAuthセッション必須・metadata設定）  
    - `POST /api/webhooks/stripe`（署名検証・早期200・冪等）  
    - `GET /api/donors`（`consent_public=true` の表示名配列）  
    - `GET /oauth/start` / `GET /oauth/callback`（stateはHMAC署名付きCookie）  
- **セキュリティ**: Stripe Webhook署名検証、HMAC署名付きCookie（TTL 10分, Secure/HttpOnly/SameSite）、同一オリジンCORS  
- **デプロイ**: `*.pages.dev`（**カスタムドメインなし**、固定費ゼロ想定）

## 開発ルール
- **Git**:  
  - コミットメッセージは英語、形式例: `feat: add analytics screen`  
  - ブランチ: `feature/`, `fix/`, `chore/`（ベースは`dev`）  
  - PRタイトルも同形式、説明に目的・影響を記載  

- **ドキュメンテーション**:
  - ドキュメントを基軸として開発・運用を行う
  - **すべての新機能・変更は関連ドキュメントを更新する**
  - draft | survey -> plan -> intent -> (guide | reference) の流れを遵守する