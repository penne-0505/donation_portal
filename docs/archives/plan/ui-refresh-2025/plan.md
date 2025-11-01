---
title: "Donation Portal UI 改善計画 2025"
domain: "donation-portal"
status: "draft"
version: "0.1.0"
created: "2025-11-01"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - public/donate/index.html
  - public/donate/app.js
  - public/donors/index.html
  - public/donors/app.js
  - public/styles/base.css
  - docs/intent/donation-portal/mvp-architecture-and-phases.md
scope:
  - "寄附導線 (/donate)・Donors ページ (/donors)・Thanks ページ (/thanks) の UI/UX をリリース品質へ引き上げる。"
  - "既存の DOM 構造とプレーン JavaScript 実装を維持したまま、スタイル体系とコンポーネントの再設計を行う。"
non_goals:
  - "Backend API や Stripe/Discord 連携仕様の拡張。"
  - "新規フレームワークの導入（React 等）や完全な SPA 化。"
requirements:
  functional:
    - "全ページで主要導線・状態（ログイン前後、同意オン/オフ、Checkout 実行）に対して視認性と操作フィードバックを改善する。"
    - "共通スタイルガイドを整備し、主要コンポーネント（ボタン、カード、通知、リスト）の再実装を完了する。"
    - "レスポンシブ対応（幅 320px〜）と Dark Mode の視認性を再検証し、必要な調整を反映する。"
  non_functional:
    - "CLS 0.05 未満、LCP 2.5s 未満（Stripe 以外）の軽量性を維持する。"
    - "CSS サイズを 30KB gzipped 以下に抑え、JS 追加は 2KB 未満とする。"
    - "アクセシビリティ観点で WCAG 2.1 AA 相当のコントラスト比を満たす。"
constraints:
  - "Cloudflare Pages の静的ホスティングで提供される単一 CSS/JS 構成を維持する。"
  - "既存の API コントラクト（/api/session 等）は変更しない。"
  - "Pages Functions 側にスタイル生成ロジックを追加しない。"
api_changes:
  new: []
  updates: []
  deprecated: []
data_models:
  - "なし（UI 層のみの変更）。"
migrations:
  - "なし。"
rollout_plan:
  - "Stage 0: 現状 UI のキャプチャ・計測を実施し、ベースラインを記録する。"
  - "Stage 1: デザイントークンと共通レイアウトの導入を `/styles/base.css` に反映。"
  - "Stage 2: ページ別のリファクタリング（/donate → /donors → /thanks）の順に適用。"
  - "Stage 3: 受け入れテストと回帰確認後に main ブランチへ統合。"
rollback:
  - "各ステージの変更をリリースブランチにまとめ、問題発生時は当該ブランチをリバートする。"
  - "CSS のみで不具合が再現する場合、旧バージョンの `base.css` を即時ロールバックする。"
test_plan:
  - "ユニット: 既存の DOM 操作ロジックのスナップショットテストを更新し、差分を検証する。"
  - "手動: キーボード操作、スクリーンリーダ簡易確認、主要デバイス幅（375px/768px/1280px）での UI チェック。"
  - "回帰: Checkout → Thanks → Donors のフローを Stripe Test モードで確認。"
observability:
  - "コンソール警告/エラーを `console.error` フックで集約し、QA 中にチェックする。"
  - "Pages Analytics の LCP/FCP をウォッチし、改善前後の差分を記録する。"
security_privacy:
  - "UI 改修による追加ログや Cookie 取り扱いの変更は行わない。"
  - "状態表示で個人情報（Discord ID 等）を露出しない。"
performance_budget:
  - "初回描画（FCP） < 1.5s（テスト環境 Chrome, 3G Fast 相当）。"
  - "インタラクション応答（button → fetch）遅延を 100ms 以内に保つ。"
i18n_a11y:
  - "文言はすべて日本語で統一し、必要に応じて読み仮名を追加しない。"
  - "aria-* 属性とロールの再点検を実施し、フォーカス可視性を確保する。"
acceptance_criteria:
  - "設計されたスタイルガイドに沿った UI コンポーネントカタログが Notion/Figma か docs に掲載されている。"
  - "`/donate`, `/donors`, `/thanks` の画面キャプチャ（Light/Dark, Mobile/Desktop）が QA レポートに添付されている。"
  - "アクセシビリティおよびレスポンシブ表示のチェックリストを満たしている。"
owners:
  - "@donation-portal-core"
---

# Donation Portal UI 改善計画 2025

## 1. 背景

Stripe Checkout と Discord OAuth の実装が整った現在の UI は、情報提示と視覚的なまとまりが限定的で、リリース前レビューで指摘された余白過多・階層の弱さ・状態フィードバック不足が残存している。Cloudflare Pages の静的配信とプレーン JavaScript 構成は維持する方針のため、既存コード（例: `public/donate/index.html`, `public/styles/base.css`）を出発点にデザイン体系を再設計し、実装と QA を段階的に進める計画を策定する。

## 2. 現状課題の整理

### 2.1 視覚階層と余白の最適化不足
- `public/styles/base.css` の `main` セレクタは上部余白 3.5rem と `h1` の `padding-top: 2.5rem` が重なり、ヒーロー領域が間延びしている。
- `section` + `section` の境界線が単一色で視覚的な区切りが弱く、コンテンツ固有のまとまりが伝わりにくい。

### 2.2 コンポーネントスタイルの一貫性欠如
- ボタンは `.button--primary` / `.button--secondary` の 2 種類のみで、エラーや無効化状態の視覚差分が限定的（`checkout-actions .button[disabled]` は透過のみ）。
- 通知系（`.auth-error`, `.checkout-error`, `.donors-error`）が同一色調で、用途別の階層が分離されていない。

### 2.3 状態フィードバックとローディング表示の弱さ
- `/donate` のチェックアウト準備（`#checkout-loading`）はテキスト表示のみで視覚的手掛かりが不足。
- `/donors` のリストはロード前・空状態・エラー状態の差分がテキスト中心で、カードレベルのフィードバックが無い。

### 2.4 レスポンシブとダークモードの細部不足
- @media (max-width: 640px) ではボタンを縦並びにするだけで、カード余白や見出し行間の調整が不足。
- ダークモードでは背景 (#1e293b) とボーダー (#334155) のコントラストが低く、リスト項目の視認性が落ちる。

### 2.5 実装保守性
- 単一ファイルにベーススタイルとページ固有スタイルが混在し、セクション単位の拡張が難しい。
- CSS カスタムプロパティは `color-scheme` 程度に留まっており、テーマ変更時の差分管理が困難。

## 3. 改善方針
- **デザイントークン化**: 色・余白・タイポグラフィを `:root` カスタムプロパティとして整理し、Light/Dark のテーマスイッチを簡易化する。
- **レイアウト階層の再設計**: カードコンポーネントとセクションヘッダを再定義し、情報のまとまりと操作導線を強調する。
- **状態/フィードバックの明確化**: Loading/Empty/Error/Success の視覚言語を統一し、ARIA 属性と連動する。
- **レスポンシブ最適化**: スモールデバイスでの余白・フォントサイズ・ボタン幅を最適化し、タップターゲット 48px を確保する。
- **保守性向上**: CSS をトークン → ユーティリティ → ページ固有の順に整理し、将来の追加セクションに備える。

## 4. フェーズ計画

| フェーズ | 目的 | 主なアウトプット |
| --- | --- | --- |
| Stage 0 | 現状把握・計測 | Before キャプチャ、PageSpeed 計測、既存コンポーネント棚卸し |
| Stage 1 | デザイントークン/共通コンポーネント | `base.css` にトークン・タイポスケール・カード/ボタン/タグ等の再実装 |
| Stage 2 | ページ別リファイン | `/donate`, `/donors`, `/thanks` の HTML/CSS 微調整、状態表示改善 |
| Stage 3 | QA・ドキュメント更新 | スクリーンショット、チェックリスト、docs/guide 更新、リリース準備 |

## 5. 作業詳細

### 5.1 デザイントークンとスタイルガイド
- `:root` にカラー (Primary/Accent/Neutral/Error)、スペーシングスケール (4px 基準)、タイポサイズ (14/16/18/24px) を定義。
- フォントスタックを整理し、見出しと本文のウェイト階層を設定。
- `.card`, `.section-header`, `.status-badge`, `.button`, `.button--ghost`, `.alert--error/success/info` などをパターン化。

### 5.2 共通レイアウトの刷新
- `main` の余白・角丸・シャドウを調整し、デバイス幅ごとに最適化。
- グリッドユーティリティ (`.grid`, `.stack`, `.cluster`) を追加し、手作業の flex 設定を削減。
- ヒーローヘッダとセクションヘッダにサブタイトル/補助説明のスタイルを導入。

### 5.3 ページ別タスク
- `/donate`: ログインステータスと同意カードを 2 カラムレイアウト（>=768px）に再構成し、CTA の視線誘導を最適化。`checkout-actions` に金額タグや補助説明を追加し、ローディング表示をスピナー+テキストに変更。
- `/donors`: Donor リストをカード化（アイコン/表示名/タイムスタンプ領域）し、空状態カードを定義。`consent-section` に説明用の info バナーを追加。
- `/thanks`: ヒーローイラスト用のプレースホルダとサブ CTA（コミュニティ案内）を追加し、コピーを整理。

### 5.4 実装・レビュー手順
- 各ステージごとに PR を分割し、スクリーンショット（Light/Dark, Mobile/Desktop）を添付。
- `docs/guide/development/setup.md` に UI 開発で利用する npm scripts を追記（例: `npm run dev` の確認手順）。
- 変更点に合わせて `public/styles/base.css` のコメントを更新し、パターンの用途を明記。

## 6. QA とドキュメント
- QA チェックリストを `docs/guide/operations/phase-06-qa-release.md` に追記し、UI 項目を追加。
- デザイン決定とトークン表を `docs/reference/ui/style-tokens.md`（新規）に整理する想定。
- 改修完了後に `docs/intent/donation-portal/mvp-architecture-and-phases.md` から参照されるようリンクを更新。

## 7. リスクと対応策

| リスク | 影響 | 軽減策 |
| --- | --- | --- |
| CSS 再構成による予期せぬ崩れ | 主要導線が利用不能 | Storybook 代替として DOM テストのスクリーンショット比較を導入し、段階的に適用 |
| パフォーマンス悪化（レンダリングコスト増） | LCP 上昇 | CSS のレイヤ分割を避け、未使用スタイルを lint で検出 (`stylelint --report-descriptionless-disables`) |
| ダークモードのコントラスト低下 | アクセシビリティ違反 | Contrast チェッカーで検証し、`--color-surface-dark` 等を調整 |

## 8. コミュニケーションと依存関係
- 週次進捗を Discord #donation-portal-dev チャンネルで共有し、キャプチャと差分を報告。
- Stripe/Discord 側の仕様変更が入った場合は本計画を見直す。
- 最終リリース前にコミュニティ運営チームへ UI デモを実施し、フィードバックを取り込む。

---

本計画に基づき、UI 改善を段階的に進める。各ステージ完了時点で成果物をレビューし、Intent/Guide ドキュメントへの反映を忘れずに行うこと。