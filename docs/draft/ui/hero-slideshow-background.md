---
title: "Hero Background Slideshow Exploration"
domain: "donation-portal/ui"
status: "proposed"
version: "0.1.0"
created: "2025-11-02"
updated: "2025-11-02"
state: "idea"
hypothesis: "LPヒーローに複数画像のスライドショーを導入すると、プロジェクトの世界観を視覚的に訴求しつつガラスUIの価値を高められる。"
options:
  - "CSSのみ（@keyframes + animation-delay）で3〜4枚の静的ループを実装する"
  - "React + useEffectで画像配列を制御し、将来的にCMS連携できる柔軟な仕組みを構築する"
  - "既存のノイズ背景のみで継続し、画像スライドショーは導入しない"
open_questions:
  - "画像の選定基準（ライセンス、世界観、一貫性）はどうするか？"
  - "初期LCPへの影響をどの程度許容できるか？"
  - "スライドショーは常時再生か、ヒーローがビューポート内にある時のみ再生するべきか？"
next_action_by: "@penne-0505"
review_due: "2025-12-01"
ttl_days: 45
references:
  - "components/pages/home-page.tsx"
  - "app/globals.css"
  - "docs/plan/macos-ui-refinement-priority-1-6.md"
---

## 背景

GlassスタイルのLPでは背景がガラスレイヤーの魅力を支える要素になっており、現状は静的グラデーションとノイズテクスチャで落ち着いた質感を出している。将来的にコミュニティの世界観をより直接的に表現するため、複数のビジュアルをスライドショー形式で背景に流す案を検討する。

## 目的

- LPヒーローでプロジェクトの雰囲気や活動実績を視覚的に伝える
- ガラスカードの「透明レイヤー越しに背景が変化する」魅力を高める
- 動きを付けても落ち着いたmacOSライクなトーンを守る

## 技術的アプローチの検討

### 1. CSSオンリーのループ
- `::before` や専用ラッパー内に `img` を複数配置
- `@keyframes` で `opacity` を交互に上げ下げ（例: 30秒周期）
- 長所: 実装が軽い、JS不要でパフォーマンス安定
- 課題: 画像数が増えるとCSSが煩雑になる、動的な切り替えが難しい

### 2. React + useEffect 制御
- 画像配列を用意し、一定間隔でインデックスを更新
- `transition` でフェード、`prefers-reduced-motion` で停止
- `next/image` を利用して最適化
- 長所: 枚数や切り替え順を柔軟に設定、将来的なCMS連携が容易
- 課題: 初期実装のコスト、ステート管理が必要

### 3. Intersection Observer + 遅延開始
- ヒーローがビューポート内に入ったタイミングで再生開始
- 離れた場合は一時停止し、リソース消費を抑える
- 2のアプローチと組み合わせると良さそう

## パフォーマンスとUX配慮

- 初期描画で1枚目のみ表示 → 残りは `requestIdleCallback` や `setTimeout` で遅延ロード
- 画像は `public/images/hero-slideshow/` に配置し、WebP/JPEGで最適化
- ヒーローのガラスカードとのコントラストを維持するため、スライドの上に薄いフェードオーバーレイを重ねる
- `prefers-reduced-motion` ではアニメーションを無効化し、最初の1枚を固定表示

## 次のステップ

- 採用したい画像の候補を収集しライセンスを確認
- CSSオンリー版のラフ実装を試し、パフォーマンス計測
- 結果に応じてReact制御版のPoCを行う
- 適宜 `docs/plan/macos-ui-refinement-priority-1-6.md` や intent 文書へ反映
