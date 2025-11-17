---
title: Glass alignment drift remediation
domain: frontend
status: draft
version: 0.1.0
created: 2025-11-14
updated: 2025-11-14
related_issues: []
related_prs: []
references:
  - ../../../standards/documentation_guidelines.md
  - ../../../standards/documentation_operations.md
  - ../../survey/donation-portal/glass-alignment-drift-2025-11-14.md
  - ../../plan/frontend/glass-aesthetic-alignment/plan.md
  - ../../../app/globals.css
  - ../../../components/ui/button.tsx
  - ../../../components/ui/card.tsx
  - ../../../components/app-shell.tsx
  - ../../../components/donate/session-panel.tsx
  - https://developer.apple.com/design/human-interface-guidelines/materials
  - https://v3.tailwindcss.com/docs/box-shadow
owners:
  - "@design-system"
  - "@frontend-platform"
scope:
  - 既存 `.bg-root` / `.bg-gloss` / `--accent-ambient-*` トークンを macOS Liquid Glass の 6 原則（背景は白＋3-5% アクセント）と `glass-aesthetic-alignment` Plan の Phase 1 要件に沿って再設計し、濃いラジアルグラデーションを廃止する
  - `.glass*` / `.glow*` / `.hover*` ユーティリティと Card / Header / CTA 等の呼び出し側を刷新し、影 0-2px・光/透明度のみの演出・`data-accent="primary"` 1 箇所以外での濃色アクセント禁止を実現する
  - Button / Discord OAuth / 同意パネルなど主要コントロールでアクセント数を制御し、glow/ステータス表示・アニメーションも 200-300ms の淡い動きへ整理する
non_goals:
  - Stripe / Discord OAuth のビジネスロジックや API 挙動を変えること
  - Cloudflare Pages Functions やビルドパイプラインにおける設定変更
  - 新規 UI ライブラリ導入や既存 CSS の全面書き直し（段階移行とする）
requirements:
  functional:
    - `app/globals.css` の背景トークンをホワイト/ライトグレー中心＋3-5% のアクセント値へ置換し、`.bg-root` に含まれる濃いラジアルグラデーションは archive 用クラスへ退避する
    - `.glass-card` / `.glass-sm` / `.glass-md` / `.glass-lg` の box-shadow を 0-2px 以内に制限し、radial highlight を削除。境界線は 1px の淡い border-image へ差し替える
    - `components/ui/button.tsx` の variant を `data-accent` 制御へ寄せ、`primary` 以外は透明度とボーダー強度のみで差別化し hover/active で transform を禁止する
    - `components/app-shell.tsx` / `components/donate/session-panel.tsx` 等で使用する CTA / Discord ログイン / ステータス表示を新しい glow/hover ユーティリティへ移行し、1 ページ 1 箇所の濃色アクセント制限を担保する
    - `page-enter` / `fade-in-up` など 0.5-0.6s の translate 系アニメーションを 200-300ms の opacity/blur 変化へ刷新し、`prefers-reduced-motion` を尊重する
  non_functional:
    - 追加 CSS (gzip) は +3 KB 以内、JS 変更は 0。`will-change` の削減で GPU メモリ変動 ±0 を維持する
    - 既存コンポーネント API や props には破壊的変更を与えず、UI 変化のみで要件達成する
    - Light/Dark のコントラストを WCAG AA (4.5:1) 以上に保ち、アクセシビリティ監視を Playwright + Axe で継続する
constraints:
  - `docs/standards/documentation_guidelines.md` / `docs/standards/documentation_operations.md` の draft→plan→intent→guide フローを踏み、実装後は intent・guide/reference を同期する
  - CSS は既存 PostCSS / Tailwind 設定内で完結させ、新規ビルドツールや `git rm` を伴う削除は行わない
  - Cloudflare Pages のデプロイを止めないように Phase ごとの feature flag または CSS カスタムプロパティのトグルを用意する
api_changes: []
data_models: []
migrations: []
rollout_plan:
  - Phase 1 — 背景トークン整備: `bg-root` / `bg-gloss` / `--accent-ambient-*` を再定義し、`.bg-root-legacy` に既存グラデーションを退避。Hero + `/donate` から順に適用しスクリーンショットを更新
  - Phase 2 — Glass/Glow コンポーネント刷新: `.glass*` / `.glow*` / `.hover*` の CSS を差し替え、Card / AppShell / CTA に適用して shadow/hover の統一を確認
  - Phase 3 — CTA & motion ガバナンス: Button variant と Discord CTA、`page-enter` 系アニメーションを新仕様へ移行し、Playwright screenshot + Percy で回帰チェック。docs/reference/ui/style-tokens.md を更新
rollback:
  - 各 Phase を独立コミットとして保持し、問題発生時は該当コミットを revert して旧 CSS を即時復元する
  - アクセント不足で CTA が視認困難な場合は `data-accent="primary"` の旧 shadow/grandient を一時的に復活させ、配信停止を避ける
security_privacy:
  - 視覚スタイルのみを変更し Stripe customer metadata や OAuth スコープに触れないため追加リスクなし
performance_budget:
  - 追加 CSS: ≤ 3 KB (gzip)
  - Transition duration: 200-300ms へ統一、`will-change` は hover 数箇所まで
  - LCP / CLS を Lighthouse で ±3% 以内に抑える
observability:
  - Lighthouse CI で `/donate` `/donors` `/thanks` の before/after を記録し CSS bytes と LCP の変動を追跡
  - Playwright screenshot + Percy を併用し、hover/active 状態の退行を検出
  - Chrome Performance Profile で hover/animation duration を測定し 300ms 超を検知したら自動テストを fail させる
test_plan:
  unit:
    - `npm run test donate` の snapshot を更新し、Button / Card / session-panel が transform を含まないことを検証
  integration:
    - `npm run test:ui`（Playwright）で `/donate` `/donors` `/thanks` の hover/CTA 表示を比較しアクセント数を確認
    - `npm run lint:css` で `box-shadow` / `drop-shadow` の閾値をチェックするカスタムルールを追加し CI で実行
  manual:
    - Percy / ブラウザで Before/After スクリーンショットを確認し、macOS HIG の淡い層表現と乖離がないかデザイナーが承認
    - Chrome DevTools で `prefers-reduced-motion` を有効化し、アニメーションが適切に無効化されることを確認
i18n_a11y:
  - 文言やローカリゼーションには触れないが、配色コントラストとフォーカスリングの視認性を再測定し、必要な場合は `:focus-visible` スタイルを補強する
acceptance_criteria:
  - `.bg-root` / `.glass*` / `.glow*` の CSS から 3-5% を超える彩度・7% 以上の不透明グラデーションが排除されている
  - Button / CTA / Discord ログインはいずれも transform 無しで hover を完了し、濃色アクセントは `data-accent="primary"` を持つ 1 要素のみ
  - `page-enter` / `fade-in-up` などのキーフレームが 200-300ms の opacity/blur 変化へ置換され、`prefers-reduced-motion` 時はアニメーションが skip される
  - Lighthouse CI / Playwright / Percy の自動化結果がすべて緑で、docs/reference/ui/style-tokens.md に新トークンが記録されている
---

## 背景
`docs/survey/donation-portal/glass-alignment-drift-2025-11-14.md` で、最新スクリーンショットのガラス表現が macOS Liquid Glass の 6 原則と `glass-aesthetic-alignment` Plan の要件から乖離していることが確認された。具体的には、濃いラジアルグラデーションを持つ `.bg-root`、`0 2px 6px` を超える影とハイライト、複数の CTA アクセント、強い赤/緑の glow、0.5-0.6s の translate 系アニメーションが主な逸脱要因である。

既存 plan はガイドラインの提示に留まり、どのファイル・ユーティリティをどの順序で直すかまでは分解できていない。本書では drift を是正するための具体的な実装計画とテスト方針を定義し、Phase ごとのリスクコントロールを明確にする。

## 目的
- 背景・ガラス・アクセント表現を macOS Liquid Glass の 6 原則と plan 要件（背景は白 + 3-5% アクセント／影は 0-2px／光と透明度でホバー／200-300ms／精緻なボーダー）へ引き戻す
- CTA と glow を 1 ページ 1 箇所の濃色アクセントへ抑制し、Discord ボタンなどブランド色にも統一的な制御手段を提供する
- アニメーションや hover が transform 依存から脱却し、`prefers-reduced-motion` と WCAG AA を満たした状態で回帰テストを自動化する

## 課題整理
1. **背景トークンの彩度過多** — `.bg-root` に常時 2 本のラジアルグラデーションが敷かれ、`--accent-ambient-strong` が 7% の Discord ブルーを放っているため、ガラスより背景が主張している。
2. **Glass/Card の厚い影とハイライト** — `.glass-card` が 0 2px 6px の shadow と 0.55 の radial highlight を重ね、macOS HIG が推奨する 1-2px のさりげない層表現から逸脱。
3. **CTA/ボタンのアクセント散逸** — Header、Hero、Discord ログインがそれぞれ異なる濃色グラデーションと drop-shadow を持ち、「1 ページ 1 箇所」ルールを守れない。
4. **Glow/ステータス演出の彩度過多** — `glow-status-success/error` が 20-30px の緑/赤グローを放ち同意パネルや支援者リストが警告色に支配される。
5. **アニメーション duration と translate** — `page-enter` / `fade-in-up` / `bounceIn` が 0.5-0.6s + translate で物理移動を伴い、macOS 美学に適合しない。

## 施策概要
### 1. 背景トークン再設計
- `--surface-base`, `--surface-muted`, `--accent-ambient-light/strong` を再定義してホワイト/グレー中心に寄せ、彩度 3-5% のカスタムプロパティのみ許可する。
- `.bg-root` のグラデーションを `bg-root-legacy` へ退避し、既存レイアウトには CSS 変数フラグで opt-in させる。
- `/donate` と `/thanks` の hero パネルから順に適用し、Percy で before/after を添付して承認を得る。

### 2. Glass / Card / Header システム刷新
- `.glass-card` / `.glass-sm` / `.glass-md` / `.glass-lg` の shadow を 0-2px へ統一し、`shadow-inner` など Tailwind ベースの淡い影へ置換。【Tailwind box-shadow docs】
- Radial highlight を削除し、境界線を `border-image` で 1px の subtle gradient へ変更。Card / AppShell / Footer でユーティリティ差し替えを実施。
- `plan-card` やセッション警告など translate で浮かせている箇所から `transform` を削除し、opacity/blur で hover を実現する。

### 3. CTA / Button アクセントガバナンス
- `components/ui/button.tsx` で variant 毎の色定義を `data-accent` 属性＋トークン読み取りへ寄せ、`primary` のみ濃色背景を許可。他 variant は透明度 + 1px ボーダー差で表現。
- Discord OAuth ボタンにはブランド色を輪郭としてのみ残し、塗り潰しを 3-5% レベルの glow で抑える。ヘッダー CTA・Hero CTA が同時に濃色化しないよう 1 箇所が `primary` を占有するバリデーションを追加。
- `donate-cta-animated` の gradient/shadow を撤廃し、`data-accent` 駆動の token で演出する。

### 4. Glow / ステータス演出の再定義
- `glow-status-success/error` をライトグレー中心の外枠 + 2px blur へ縮退させ、強い緑/赤は `:focus-visible` やアイコンのみへ限定。
- セッション同意パネルや donors エラー表示を `glow-accent-subtle` に差し替え、常時発光を禁止。必要に応じて inline alert component を新設する。

### 5. Motion & Accessibility
- `page-enter` / `fade-in-up` / `bounceIn` を 200-300ms の opacity + backdrop-filter 変化へ書き換え、`@media (prefers-reduced-motion: reduce)` で `animation: none` を適用。
- Hover/Focus の動きは CSS 変数経由で `transition-property: opacity, box-shadow, filter` のみに制限し、AppShell ナビゲーションへも適用する。

## 実装詳細
1. **Token & CSS 変数整理**
   - `app/globals.css` の `:root` ブロックに新トークンセットを定義し、旧値と並走するため `--surface-legacy-*` を暫定追加。
   - `.bg-root` を新トークン参照に置換し、`bg-root-legacy` ユーティリティを追加して実験的に切り替えられるようにする。
2. **Glass ユーティリティ更新**
   - `.glass-card` ファミリーの shadow/higlight を差し替え、`@layer utilities` で `box-shadow: 0 1px 2px rgba(15,23,42,0.08)` など 3 種類に制限。
   - Card/AppShell/Button など呼び出し側のクラスネーミングを一括検索し、`glass-md` → `glass-md` (new) への migration checklist を作成。
3. **CTA / Button 再設計**
   - `components/ui/button.tsx` で variant と `data-accent` mapping を再実装し、hover/active の transform を削除。Discord variant は brand color outline + subtle fill に留める。
   - `components/app-shell.tsx` / `components/donate/session-panel.tsx` から drop-shadow / gradient を排除し、新 glow utility を import。
4. **Glow/Status & Motion**
   - `glow-status-*` / `donate-cta-animated` / `bounceIn` などの CSS を削除し、新定義へ置換。prefers-reduced-motion で無効化する SCSS/CSS を追加。
   - Playwright で hover/animation を録画し、200-300ms へ収束しているか動的に検証する。
5. **ドキュメント更新**
   - 本 plan 完了後に `docs/intent/ui/glass-alignment-restoration.md`（仮）を起草し、`docs/reference/ui/style-tokens.md` と `docs/guide/frontend/glass-patterns.md`（存在する場合）を更新。

## テストと運用
- CI に `npm run lint:css` を追加し、`box-shadow` の最大値・`transform` 利用を検出するカスタムルールを導入。
- Playwright/Percy に新しいビューポート（Light/Dark + hover）を追加し、`data-accent` が 1 要素のみ濃色になっているかをスクリーンショット差分で監視。
- Lighthouse CI のレポートへ CSS bytes / animation count / LCP を追加メトリクスとして添付し、Phase ごとにコメントアウト。

## リスクと軽減策
- **アクセント不足による CTA の視認性低下** — Phase 1 適用時は `bg-root` のみ置換し、CTA トークン適用前に手動 QA を行う。必要であれば一時的に `outline`/`border` を強化する。
- **CSS 回帰の検出漏れ** — Playwright screenshot に hover/active 状態を追加し、Percy で diff 閾値を厳しく設定する。
- **ドキュメント同期遅延** — plan 実装時に intent/guide/reference の更新ブランチを同時に作成し、レビューでセットにする運用を owners が担保する。

## フォローアップ
- Phase 3 完了後に `glass-aesthetic-alignment` Plan の進捗を参照し、必要であれば supersedes を更新して重複を整理する。
- 変更後のスタイルトークンを Figma / デザインシステムへ共有し、今後の UI 作成時に drift が再発しないルールを周知する。
- Stripe / Discord など SaaS 連携はノータッチだが、UI 変更によりサポートドキュメント（FAQ 等）のスクリーンショットを差し替えるため、コミュニティ告知を準備する。
