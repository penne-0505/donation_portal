---
title: "React UI Cutover 2025"
domain: "donation-portal"
status: "active"
version: "1.0.0"
created: "2025-11-02"
updated: "2025-11-02"
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/react-ui-integration-2025/plan.md
  - docs/reference/ui/react-app-preview.md
  - app/(app-shell)/page.tsx
  - scripts/run-next-on-pages.cjs
---

# React UI Cutover 2025

## 1. 背景

Phase 3 までで `/new/*` プレフィックス配下に React UI を段階公開し、Stripe Checkout と Discord OAuth の統合検証を完了した。Phase 4 では旧静的 UI を本番導線から外し、Next.js ベースの UI を `/`, `/donate`, `/donors`, `/thanks` の正式ルートへ移行する。旧ルートからのリダイレクトとドキュメント更新を行い、Cloudflare Pages Functions との互換性を維持したまま完全切替を実施する。

## 2. スコープ

- `/new/*` ルートを公式導線へリダイレクトし、React UI を `/`, `/donate`, `/donors`, `/thanks` で提供する。
- Next.js App Router のレイアウト構成を本番導線に合わせて整理し、ページロジックを再利用可能なコンポーネントへ集約する。
- Cloudflare Pages 向けビルド (`scripts/run-next-on-pages.cjs`) を更新し、React UI のルートが Functions に奪われないよう調整する。
- 開発者ドキュメントと README を更新し、React UI が正式導線であることを周知する。

### 非対象

- Stripe / Discord API の仕様変更。
- 旧静的ファイル (`public/`) の削除。後方互換目的で保持する。
- Cloudflare Pages Functions の API 実装変更。

## 3. 実施事項

1. **ルーティング切替**
   - `app/(app-shell)/` ルートグループを作成し、`/`, `/donate`, `/donors`, `/thanks` のページを配置。
   - `app/new/*` は Next.js の `redirect` を用いて恒久的に新ルートへ転送。
   - 共通レイアウト (`AppShell`) を新ルートグループで共有。

2. **ページ分割**
   - `components/pages/` に `HomePage`/`DonatePage`/`DonorsPage`/`ThanksPage` を作成し、App Router ページから再利用。
   - `DonatePage` と `DonorsPage` は `use client` 指定を維持し、既存 hooks (`useSession`, `useConsentMutation`, `useCheckout`, `useDonors`) を活用。

3. **ビルド調整**
   - `scripts/run-next-on-pages.cjs` から `/`, `/donate`, `/donors`, `/thanks` の除外設定を削除し、Next.js 出力がそのまま本番導線へ配置されるよう更新。
   - API (`/api/*`) と OAuth (`/oauth/*`) への除外設定は維持。

4. **ドキュメント更新**
   - `README.md` と `docs/guide/development/setup.md` を更新し、React UI が本番導線であること、`npm run ui:dev` の確認手順を最新化。
   - `docs/reference/ui/react-app-preview.md` を刷新し、ルート表や参照先を新構成へ変更。Cutover Plan への参照を追加。

## 4. テスト計画

- `npm run lint` および `npm run typecheck` を実行し、App Router の再配置による静的解析エラーを検出。
- `npm run ui:dev` で `/donate`、`/donors`、`/thanks` を手動確認し、OAuth 未ログイン時の状態と Checkout ボタンの有効/無効が従来どおりであることを検証。
- `npm run ui:build` → `npm run dev` の順でローカルプレビューを起動し、Cloudflare Pages dev (`http://localhost:8788`) で React UI が提供されることを確認。

## 5. ロールアウト

1. Cutover ブランチを Preview 環境へデプロイし、Discord OAuth/Stripe Test モードでの動作確認を実施。
2. `/new/*` へのアクセスが 30x で新ルートへ転送されることをモニタリング。
3. main へマージ後、Cloudflare Pages の本番デプロイを実施し、Analytics で LCP/FID の回帰がないか確認。

## 6. ロールバック

- 問題発生時は Cloudflare Pages のデプロイ履歴から直前のバージョンへロールバックする。
- 必要に応じて `_routes.json` の除外設定を元に戻し、旧 `/new/*` ルートを暫定公開する（Next.js 側でリダイレクトを解除する）。
- React UI 側でクリティカルな不具合が発生した場合は旧静的 UI (`public/*`) を一時的に案内し、Issue を作成して対応を記録。

## 7. 観測

- `/new/*` リダイレクトに対する Cloudflare Analytics のアクセス数とエラー率を監視し、残存ブックマークからのアクセス状況を把握。
- Stripe Checkout 成功率と Discord OAuth コールバックのエラー率を `wrangler tail` で確認。
- Lighthouse / Pages Analytics で LCP・CLS の変動を記録し、移行前後の数値を比較する。

## 8. コミュニケーション

- Cutover 完了後に Discord #donation-portal-dev でアナウンスし、旧 `/new/*` ブックマーク更新を通知。
- Docs Platform WG と共有し、関連ドキュメントのリンク更新状況を報告。
- Stripe/Discord テストモードでの確認ログを Notion または docs/reference に追記し、QA チェックリストを更新。
