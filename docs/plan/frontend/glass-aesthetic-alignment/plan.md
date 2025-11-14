---
title: Glass aesthetic alignment
domain: frontend
status: active
version: 0.1.0
created: 2025-11-14
updated: 2025-11-14
related_issues: []
related_prs: []
references:
  - ../../../standards/documentation_guidelines.md
  - ../../../standards/documentation_operations.md
  - ../../survey/donation-portal/glass-aesthetic-audit-2025-11-14.md
  - ../../archives/plan/macos-ui-refinement-priority-1-6.md
  - ../../../app/globals.css
  - ../../../components/ui/button.tsx
  - ../../../components/consent-toggle.tsx
owners:
  - "@design-system"
  - "@frontend-platform"
scope:
  - `app/globals.css` の背景・glass・glow ユーティリティを audit 結果と macOS Liquid Glass の 6 原則（背景は極薄/影は1-2px/透明度段階/光によるホバー/200-300ms/精緻なボーダー）に沿って再定義する
  - Button / ConsentToggle / plan-card / CTA など主要コントロールへ新トークンを適用し、物理移動なしで光と透明度だけが変化するホバーへ統一する
  - グロー・アクセント系クラスの濃度を 3-5% に抑え、CTA 演出も 1 ページ 1 箇所に限定できるユーティリティ設計へ移行する
non_goals:
  - Stripe / Discord フローや Cloudflare Pages Functions の API 変更
  - `/donate` など画面レイアウト・文言の大幅改稿
  - 新規 UI ライブラリの導入や `git rm` を伴うクリーンアップ
requirements:
  functional:
    - `bg-root` / `bg-gloss` / `bg-panel` など背景トークンをデファクト 2 系統に整理し、ホワイト/グレー基調＋アクセント 3-5% のみで階調を作る。既存 `.bg-root` の濃いグラデーションは archive し、同等の透明度を CSS カスタムプロパティで提供する
    - `.glass*` ユーティリティは 3 段階透明度を保ったまま、box-shadow を 0-2px、border を `border-image` ベースの縦グラデーションへ刷新し、`plan-card` から `translateY` を撤廃する
    - `.hover-glow` / `.glow-accent-*` / `.donate-cta-animated` を白〜グレー主体の微弱 glow へ揃え、アニメーション duration を 200-300ms に統一する（例外的な濃い CTA は `data-accent=\"primary\"` を持つ 1 要素のみ）
    - `components/ui/button.tsx` と `components/consent-toggle.tsx` が新トークンを読み、variant ごとの差分は色相ではなく透明度・境界線の強さで表現される。hover や active でも transform 系は使わず、`prefers-reduced-motion` を尊重
  non_functional:
    - CSS の追加は gzip +3 KB 以内、JS 追記は 0。`will-change` の削減で GPU メモリを現状 ±0 に保つ
    - 既存コンポーネント API は不変で、`glass-*` を使う要素に破壊的変更を与えない
    - 色コントラストは WCAG AA を維持し、Light/Dark いずれでも 4.5:1 以上を確保
constraints:
  - `docs/standards/documentation_guidelines.md` / `docs/standards/documentation_operations.md` の plan→intent→guide 更新フローを厳守し、リリース後に reference/guide を同期する
  - `git rm` / `rm` は使用せず、既存クラスは置換か再利用で対応する
  - Tailwind v4 の inline theme 内で完結し、Pages Functions バンドルサイズを増やさない
api_changes: []
data_models: []
migrations: []
rollout_plan:
  - Phase 1: 背景トークンと CSS 変数を再設計し、`bg-root` と主要セクション背景を極薄パレットへ置換。Lighthouse で LCP を再計測し影響を把握
  - Phase 2: `.glass*`/`.glow*`/`.hover*` ユーティリティを刷新し、plan-card / CTA に適用して transform 削除と 200-300ms 統一を完了
  - Phase 3: Button / ConsentToggle / 共通 CTA を移行、`tests/ui` を更新し docs/reference/ui/style-tokens.md・intent を同期、プレビューで回帰確認
rollback:
  - Phase ごとに `app/globals.css` と対象コンポーネントの変更を別コミット化し、問題時は該当コミットを revert して旧トークンへ即戻す
  - CTA やボタンが可視性を失った場合は `.glow-*` 新定義だけを無効化し、旧 shadow/graident を一時的に再適用して画面崩壊を防ぐ
security_privacy:
  - 視覚層のみの変更で Stripe/Discord/PII には触れないため追加リスクなし
performance_budget:
  - 追加 CSS: ≤ 3 KB (gzip)
  - すべての transition duration: 200-300ms
  - GPU 負荷となる `will-change` や `translate3d` の削減で初回描画メモリ増 0
observability:
  - Lighthouse CI（Performance + Accessibility）で before/after を記録し、LCP/CSS bytes の変化を 5% 以内に抑える
  - Percy もしくは既存 Playwright screenshot テストで `/donate` `/donors` `/thanks` の hover 状態を比較
  - Chrome DevTools Performance panel で hover/transitions が 200-300ms に収束していることをプロファイル
test_plan:
  unit:
    - `npm run test donate` で Button / ConsentToggle / plan-card の snapshot を更新し、hover/active クラスが transform を含まないことを検証
    - CSS 変数ユーティリティの `@testing-library/dom` 経由 snapshot を追加し、`glass-*` の box-shadow / border-image 値を固定
  integration:
    - Playwright で `/donate` の hover 動作（CTA/plan-card/consent toggle）を録画し、`prefers-reduced-motion`=reduce でも演出が無効化されることを確認
    - `npm run dev` + Safari/Chrome で背景のコントラスト/透明度を目視確認、Lighthouse で LCP 回帰を測定
  manual:
    - デザインレビューで macOS 液体ガラス要件（アクセント 3-5%・影1-2px・200-300ms）をチェックリスト化しプロダクトオーナー承認を得る
    - Discord コミュニティからのスクリーンショット比較を Notion に貼付してステークホルダー周知
i18n_a11y:
  - 色彩変更後も WCAG AA のコントラストレシオを計測し、アクセント色は `prefers-contrast: more` 時に彩度を 1.2 倍まで引き上げる
  - `prefers-reduced-motion` を尊重し、CTA アニメーションは reduce 指定時に完全停止
  - hover/active 状態を `aria-live` ではなく `aria-pressed` 等の既存属性で伝え、視覚依存にしない
acceptance_criteria:
  - ルート背景とセクション背景が白/グレー主体となり、アクセントカラーの露出は CTA/primary 1 箇所に制限されている
  - `.glass*` ユーティリティの box-shadow が 0-2px、border が縦グラデーション化され、`plan-card`・Button・ConsentToggle から `translate` 系 hover が排除されている
  - `.glow-*` `.hover-*` `.donate-cta-animated` の duration が 200-300ms に揃い、`prefers-reduced-motion` で停止する
  - docs/reference/ui/style-tokens.md および該当 intent が新トークンを説明し、関連 PR / テストが green で完了している
---

## 背景
`docs/survey/donation-portal/glass-aesthetic-audit-2025-11-14.md` では、macOS Liquid Glass を目指す既存方針に対して以下の逸脱が指摘された。  
- 背景（`bg-root`）が青紫ラジアルを多用しアクセント 3-5% の制限を超過している  
- `.glass*` ユーティリティが 10-48px 級の強い shadow と単色 border に依存し、ホバーには `translateY` が残っている  
- CTA / glow / hover クラスが彩度の高いグラデーションと長秒のアニメーションに頼っている  
- Button / ConsentToggle などの主要コントロールも Discord カラー・大きな陰影のままで、macOS 流の静的演出に反している  

これらは `docs/archives/plan/macos-ui-refinement-priority-1-6.md` が掲げる 6 原則を継続的に満たすための前提条件であり、UI 全体のガラス感を司る `app/globals.css` の刷新なしには着地しない。調査結果を踏まえ、設計・実装を伴う計画を本ドキュメントで確定させる。

## 現状課題
1. **背景とアクセントの過剰演出** — `.bg-root` が多層グラデーションで Discord ブランドが勝ち、macOS らしい極薄背景ではなくなっている。
2. **Glass ユーティリティの肥大化** — `.glass*` が大きな drop-shadow と単色 border を持ち、hover 時に transform を併用しているため、Liquid Glass が要求する光表現と乖離。
3. **CTA / glow / hover の統制不足** — `.donate-cta-animated` の 6 秒アニメーションや `.glow-accent-*` の濃色 drop-shadow が macOS 規範に反し、ページごとに duration がばらついている。
4. **主要コントロールのブランド依存** — `components/ui/button.tsx` と `components/consent-toggle.tsx` が Discord ブルーと 6-32px の shadow を保持しており、新トークンでも再現できない。

## 目的
- 6 原則（背景/影/透明度/ボーダー/ホバー/遷移）の遵守を、ユーティリティ + トークン + コンポーネントの三層で担保する
- 背景・ガラス・グローの再設計を「Pages 全体で使い回せる CSS API」へ落とし込み、後続ページ改修のコストを下げる
- 各種コンポーネント・テスト・ドキュメントを同時に更新し、意図と挙動の差異が発生しない状態を構築する

## 実装方針

### 1. 背景・アクセントトークンの再定義
- `--color-accent` は 3-5% の香りのみで使う想定とし、CTA 以外の surface に直接使わない。`--color-accent-strong` を CTA 専用で分離
- `.bg-root`・`.bg-gloss` に白〜グレー基調のラジアル/線形グラデーションを定義し、濃色は line highlight のみに留める
- Tailwind `@theme inline` に `bg-tones.glass.base` などのカスタムトークンを追加し、ページ側ではユーティリティクラスの差し替えだけで移行できるようにする

### 2. Glass / glow ユーティリティの階層整理
- `.glass-sm/md/lg/strong` それぞれに透明度・blur・noise の組み合わせを定義し shadow は 1-2px 内に収める。`border-image` で縦グラデーションを表現
- `.hover-glass` / `.hover-glow` は `opacity` と `filter: drop-shadow` のみで演出し、`translate` / `scale` を排除
- `.glow-accent-*` は白～グレー中心の multi-stop gradient に変更し、CTA 以外の DOM では `accent-muted` を標準にする

### 3. CTA / ボタン / トグルの適用
- `components/ui/button.tsx` では `variant="primary"` を glass surface + inner border で組み立て、Discord ブルーは `accent-cta` として 1 箇所に限定
- ConsentToggle のチェック時は背景の透明度が上がる + border-glow が点灯するスタイルに変更し、shadow 値は 1-2px へ
- plan-card / CTA など `hover` で elevate していた箇所は `.hover-glass` を呼び出して translate を完全削除

### 4. テストとドキュメント
- CSS 値の変更点を Jest/Vitest snapshot に落とし込み、トークン名の後方互換をテストで保証
- `docs/reference/ui/style-tokens.md` と関連 intent を更新し、新トークン導入の背景（macOS 6 原則）を記載
- プレビュー環境のスクリーンショットを保管し、差分レビューを docs/archives/survey と連携

## リスクと軽減策
- **アクセント不足による CTA 視認性の低下**: CTA 専用 `accent-cta` を設け、例外的に彩度を 10% まで許容する。ただし 1 ページ 1 箇所に制限するガードを lint ルール案として issue 化する。
- **旧クラス利用箇所の取りこぼし**: `rg "glass-" app -g\"*.tsx\"` で参照一覧を抽出し、移行チェックリストを作成。CI で `glass-lg` など旧 shadow 値を検知する stylelint ルールを追加検討。
- **パフォーマンス退行**: コードレビューで `will-change` の削除と shadow 低減を確認し、Lighthouse + Chrome Performance で before/after を比較して 5% 以内を保証。

## ドキュメントとフォローアップ
- 本 plan 実施後に intent（UI macOS alignment）を更新し、guide/reference を最終状態へ同期する
- Survey の引用元（glass aesthetic audit）へ実装完了コメントを追加し、調査→plan→intent のトレースを明文化
- 主要成果物（新 CSS 変数 diff、before/after スクリーンショット、Lighthouse メトリクス）を Notion へまとめて関係者共有する
