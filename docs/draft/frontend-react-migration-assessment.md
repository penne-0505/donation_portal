---
title: "Frontend React Migration Feasibility"
domain: "frontend"
status: "proposed"
version: "0.1.0"
created: "2025-11-01"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/comprehensive-refactor-2025/plan.md
  - TODO.md
state: "exploring"
hypothesis:
  - "React へ移行することで UI 状態管理と再利用性が向上し、Phase 3 以降の拡張容易性を高められる。"
  - "Cloudflare Pages × Workers の現行構成でも、SSG/CSR 前提の React アプリならビルド体制を維持できる。"
options:
  - "現行の Vanilla JS + DOM API を維持し、ユーティリティの整理とテスト強化だけを行う。"
  - "軽量フレームワーク（Preact, Solid など）で段階的にコンポーネント化する。"
  - "React + ビルドツール（Vite）へ全面移行し、状態管理/ルーティングも統一する。"
open_questions:
  - "Pages Functions と静的アセット配信の構成で React ビルドをどこまで自動化できるか。"
  - "Donors 掲載ページの静的生成を継続する場合、React でのビルドパイプラインをどう分割するか。"
  - "アクセシビリティ要件(WCAG 2.1 AA)を React コンポーネントで確実に担保する運用は何か。"
next_action_by: "@donation-portal-frontend"
review_due: "2025-11-30"
ttl_days: 30
---

# フロントエンド React 移行案の現実性評価と要件ドラフト

## 背景
- `TODO.md` のメモ（「UIをreactにする？」）を起点に、包括的リファクタリング計画 Phase 3 の UI 刷新と連動して React 採用を検討している。
- 現行 UI は `public/` 配下で Vanilla JS による DOM 直接操作と fetch 呼び出しで構成され、Cloudflare Pages の静的ホスティングにそのまま配置している。
- Stripe Checkout・Discord OAuth といったワークフローはサーバ側 (Pages Functions) に依存し、フロントエンドは同意 UI／Donors 表示が中心。規模は小さいがアクセシビリティ・エラーハンドリング欠如が課題。

## 現状整理
- ビルドレス構成: `public/donate/app.js` などを直接配信。Bundler やトランスパイルを行っていない。
- 状態管理: Cookie/Session 状態を API 経由で確認し、UI 内では最低限の imperatively DOM 更新。
- テスト: ユニットテストは存在せず、Playwright などのブラウザテストも未導入。React 移行に伴いテスト戦略の刷新が必須。
- パフォーマンス要件: `docs/plan/donation-portal/comprehensive-refactor-2025/plan.md` で初回ロード 200KB gzipped 以下が明記されており、フレームワーク導入でのサイズ増は厳密に監視する必要がある。

## 実現可能性評価
### 技術的観点
- **ビルド環境**: Cloudflare Pages は Vite/Next 等のビルド出力をそのまま配信可能。Workers 連携も SPA/CSR 前提なら追加コストは小さい。
- **SSR の必要性**: Donors リストは `GET /api/donors` を呼び出して動的表示しており SSR は必須でない。React CSR (もしくは SSG) で現状要件を満たせる。
- **依存関係の整合性**: 現在の TypeScript 設定 (`tsconfig.json`) は `src/` および Workers 用に整備済み。React を導入する場合、別途フロント用 `tsconfig` とビルドディレクトリが必要。
- **CI 影響**: 既存の scripts (`scripts/run-*.cjs`) に Vite build や lint を追加する必要があるが、CI 全体 5 分以内の予算内で収まる規模が想定。

### 組織・運用観点
- **開発体験 (DX)**: React 採用によりコンポーネント単位の再利用や Storybook 等の導入が可能。ただし学習コストとコード規約の策定が必要。
- **アクセシビリティ**: React でも適切な ARIA 設計等が必要。現行の課題を放置すると移行メリットが薄れるため、デザインシステム整備を同時に行うべき。
- **ドキュメント整備**: 新しい UI 層のアーキテクチャを `docs/guide/` や `docs/reference/` に追加で記述するコストが発生。

## 想定メリット・コスト
- メリット
  - コンポーネント化による UI 再利用性向上、ロジックと表示の分離。
  - React Query 等と連携したデータ取得パターン確立で API エラーハンドリングを統一可能。
  - 将来的な UI 拡張（寄附額カスタム入力、プレビューなど）を行う際の開発速度向上。
- コスト
  - ビルド設定（Vite/ESLint/Prettier/Testing Library）の導入とメンテナンス。
  - バンドルサイズ増加。最小構成でも React + ReactDOM で ≈45KB gzipped。追加ライブラリに注意。
  - CSR 前提のため、初回レンダリングまでの遅延が現行より増えるリスク。Skeleton 表示や Prefetch が必要。

## リスクと緩和策
| リスク | 概要 | 緩和策 |
| --- | --- | --- |
| ビルドパイプライン複雑化 | Workers と Pages のビルド順序管理が必要 | `wrangler.toml` に CI 用スクリプトを追加し、`scripts/run-wrangler-build.cjs` にフロントビルド統合 |
| バンドルサイズ超過 | Performance Budget を超え初回表示が遅延 | `analyze` ジョブで bundle サイズ CI チェック、Preact 置き換え検討 |
| CSR での SEO/OG 対応不足 | `/donors` のシェア時にメタ情報が不足 | 必要最低限のメタタグを Workers で補完、または SSG 対応を別途検討 |
| コンポーネント設計の属人化 | ガイドライン無しで保守性低下 | Design Token/Storybook 整備と CODEOWNERS によるレビュー強化 |

## React 移行時の初期要件ドラフト
### 機能要件 (Functional)
- `/donate` `/thanks` `/donors` で現行フローを維持しつつ React コンポーネントへ置き換える。
- Stripe Checkout セッション作成・同意 API 呼び出しをフック化し、ローディング・リトライ・エラー表示を標準化する。
- Donors リスト表示は `consent_public=true` のみを表示し、非同期取得中の Skeleton/空表示を実装する。
- 同意撤回導線など、既存 DOM 操作で隠れていた操作をコンポーネントとして明示化する。

### 非機能要件 (Non-functional)
- 初回ロード時の gzipped バンドルサイズ 200KB 以下、`Largest Contentful Paint` 2.0s 以下を CI + プレビューで検証。
- ESLint (React 推奨設定 + import/no-cycle) と TypeScript 型チェックを CI に組み込み、既存バックエンド処理と同列に扱う。
- React Testing Library + Playwright で主要シナリオ（寄附同意、OAuth 後の thanks、Donors 表示）を自動テスト化。
- WCAG 2.1 AA に準拠したアクセシビリティチェックリストを更新し、React コンポーネントで aria 属性とフォーカス管理を実装。
- Cloudflare Pages ビルドで Vite を使用し、`npm run build` で backend/ frontend 双方が成功すること。

## 推奨ステップ
1. 小規模プロトタイプ: `/thanks` ページを React で再実装し、ビルド/デプロイの可否とサイズを検証。
2. ビルド環境整備: `frontend/` ディレクトリ等を新設し、Vite + TypeScript + ESLint + Prettier を設定。CI に統合。
3. コンポーネント/フック設計: Checkout, Consent, Donors データ取得を共通化し、アクセシビリティ対応を盛り込む。
4. Playwright/E2E 準備: React 化に合わせてテストを更新し、リグレッションを防止。
5. 移行ロードマップ確定: `docs/plan/donation-portal/comprehensive-refactor-2025/plan.md` Phase 3 の詳細計画を React 前提で再定義。

## 未解決事項
- React 採用時に Storybook やデザインシステムを同時導入するかは要検討。
- Donors ページの静的ビルド/ISR 需要に応じて、Pre-render やキャッシュ層をどう整備するか。
- TypeScript 設定を Workers/React で分割するか、モノレポ的に `paths` を共有するかの設計判断が未決定。
