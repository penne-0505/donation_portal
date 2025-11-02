---
title: "Landing Background Depth Enhancement Plan"
domain: "donation-portal/ui"
status: "implemented"
version: "1.0.0"
created: "2025-11-02"
updated: "2025-11-03"
related_issues: []
related_prs: []
references:
  - "docs/plan/macos-ui-refinement-priority-1-6.md"
  - "docs/draft/ui/hero-slideshow-background.md"
  - "app/globals.css"
  - "components/app-shell.tsx"
  - "components/pages/home-page.tsx"
  - "components/pages/donate-page.tsx"
owners:
  - "@penne-0505"
scope:
  - "LP背景に方向性のある多層グラデーションを導入し、光源と陰影を表現する"
  - "ヒーロー主要コンポーネントの背後にフォーカスグローを追加し、視線誘導と奥行きを強化する"
  - "ノイズテクスチャを二層構成に刷新し、素材感とガラス表現の調和を高める"
non_goals:
  - "ヒーロー画像スライドショー等の新規コンテンツ導入"
  - "ガラスカード自体のコンポーネント構造変更"
  - "色テーマの大幅刷新（ブランドカラーの再定義など）"
requirements:
  functional:
    - "Directional gradient: 左上光源／右下影となる複数の放射・線形グラデーションを背景に重ねる。"
    - "Hero focus glow: ヒーローセクションのメインカード・CTA背後に薄いリング状ハイライトを配置する。"
    - "Dual-layer noise: 粗め・細かめのノイズテクスチャを重ね合わせ、奥行きと素材感を付与する。"
    - "`prefers-reduced-motion` ユーザーでも視覚品質を維持できる静的実装とする。"
  non_functional:
    - "背景更新によるLCP劣化は +100ms 以内に抑える。"
    - "全アートワークはSVGまたはbase64埋め込みで扱い、追加HTTPリクエストを発生させない。"
    - "アクセント色は既存配色 (accent purple, lime, mint) の範囲内で調整する。"
constraints:
  - "現行Theme変数（`app/globals.css`）を拡張しつつ既存クラスを破壊しない。"
  - "導入するCSSはTailwindレイヤーまたはCSS変数で再利用可能にする。"
  - "Cloudflare Pagesでのビルドサイズ増を1KB以内（gzip後）に抑える。"
rollout_plan:
  phases:
    - name: "Phase 1: Lighting Gradient Foundation"
      duration: "0.5日"
      tasks:
        - "光源方向（左上）・影方向（右下）を定義した背景グラデーションレイヤー設計"
        - "CSS変数またはユーティリティクラスとして`background-gradient-layer`を実装"
        - "既存`bg-root`に順次適用し、ヒーロー以外セクションとの整合を確認"
      exit_criteria:
        - "背景に最大3枚のグラデーションレイヤーが重なり、光源方向が視認できる"
        - "ヒーロー・フッター等で不自然な色段差がない"
    - name: "Phase 2: Hero Focus Highlight"
      duration: "0.5日"
      tasks:
        - "ヒーローセクションのカード背後にフォーカスグロー用疑似要素を実装"
        - "レスポンシブ（sm/md/lg）で過度に主張しないよう半径・不透明度を調整"
        - "`prefers-reduced-motion` 時は静的なまま表示されることを確認"
      exit_criteria:
        - "ヒーロー中央コンポーネント背後に淡いリンググローが常時表示されている"
        - "CTAボタンが背景に埋もれず視線が自然に中心へ誘導される"
    - name: "Phase 3: Dual Noise & Fine Tuning"
      duration: "0.5日"
      tasks:
        - "粗・細2種類のノイズテクスチャを生成（SVGまたはデータURI）"
        - "グラデーションレイヤーとのブレンドモードを調整（soft-light, overlay等）"
        - "全体の色温度・コントラストを確認し、必要に応じてグローバル変数を微調整"
      exit_criteria:
        - "ノイズが過度に主張せず、ガラス面の素材感が向上している"
        - "背景変更によるLighthouseスコア悪化がない（±5%以内）"
rollback:
  strategy: "背景CSSを段階的にコミットし、問題発生時は直前のコミットへリバートする。"
  steps:
    - "Phase毎に `git tag` (例: `bg-depth-phase1`) を作成"
    - "不具合発生時は当該フェーズ前のタグへ `git revert`"
  rollback_time: "10分以内"
test_plan:
  visual:
    - "主要画面（/home, /donate, /thanks, /donors）で背景の光源方向とグローを目視確認"
    - "sm/md/lg/xlの4ブレークポイントでヒーローグローのサイズ・位置を確認"
    - "`prefers-reduced-motion` 設定時の表示が意図通り静的であることを確認"
  performance:
    - "LighthouseでLCP/CLS/TTIを測定し、±5%以内を維持"
    - "CSSバンドルサイズが+1KB (gzip) 以内であることを確認"
observability:
  metrics:
    - "Lighthouse LCP, CLS, FID, TTI"
    - "CSSバンドルサイズ"
  monitoring:
    - "Cloudflare Pages Deploy Previewsでビジュアル差分を確認"
security_privacy: []
performance_budget:
  css_bundle_size: "+1KB (gzip) 以内"
  lcp_impact: "+100ms以内"
  cls_impact: "0.01以内"
i18n_a11y:
  - "動的アニメーションを追加しないため翻訳・アクセシビリティへの影響は最小限"
  - "`prefers-reduced-motion` による配慮を継続"
acceptance_criteria:
  - "背景に方向性のある多層グラデーションが導入され、ヒーロー周辺で光源が感じられる"
  - "ヒーロー中央コンポーネント背後にフォーカスグローが常時表示され、CTAが浮き立つ"
  - "ノイズが二層構成となり、ガラスカードが背景と調和した素材感を得ている"
  - "Lighthouse計測でLCP/CLS/TTIの悪化が±5%以内に収まる"
  - "CSSバンドルサイズ増加が1KB(gzip)以内"
---

## 背景と意図

現状のLP背景は単一グラデーションと単層ノイズで構成されており、ガラスカードが十分に引き立たず“のっぺり”とした印象を与えている。本計画では方向性のある光・フォーカスグロー・素材感を組み合わせ、macOSライクな静謐さを保ちながら奥行きと視線誘導を強化する。

## リスクと対策

- **光の強さが過剰で可読性が損なわれるリスク**  
  → ライト／ダーク値を段階的に調整し、デザインチェックを入れる
- **ノイズが乗りすぎて圧縮アーティファクトが目立つリスク**  
  → 2枚のノイズの不透明度を徹底的に調整し、Lighthouseで視覚的回帰確認
- **レスポンシブでグローが切れるリスク**  
  → ブレークポイント毎の半径・ぼかしを変数化し、`clamp` を用いて滑らかに調整

## 今後の検討事項

- 画像スライドショー導入案 (draft参照) との両立方法
- ダークテーマ実装時の色調整ポリシー

## 実装結果

- `app/globals.css` に方向性のある多層グラデーション変数と二層ノイズテクスチャを追加し、`hero-focus` ユーティリティでフォーカスグローを再利用可能にした。
- `components/pages/home-page.tsx` のヒーローセクションへ `hero-focus` レイヤーを導入し、CTA とバッジ背後にリング状ハイライトを常時表示。
- `components/pages/donate-page.tsx` のヒーロー導入文を同ユーティリティで包み、寄附導線の視線誘導と奥行きを強化した。
---
