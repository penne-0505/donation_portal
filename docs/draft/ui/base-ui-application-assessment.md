---
title: "Base UI 適用可能性メモ"
domain: frontend
status: draft
version: 0.1.0
created: "2025-11-16"
updated: "2025-11-16"
related_issues: []
related_prs: []
references:
  - docs/reference/ui/style-tokens.md
  - components/ui/button.tsx
  - components/ui/card.tsx
  - https://base-ui.com/react/overview/releases
  - https://v5.mui.com/base-ui/getting-started/
  - https://sordyl.dev/observatory/base-ui-headless/
state: "exploring"
hypothesis: "Base UI を Donation Portal 全体の UI レイヤに広く適用する案は、Accessibility や高度なインタラクション面で恩恵が限定的な一方、マイグレーションコストとベータ版特有のブレイキング変更リスクが大きく、全面適用は妥当ではない。対話型コンポーネントを追加する局所用途なら再検討余地あり。"
options:
  - "Base UI を全画面の標準コンポーネント層として採用し、既存 `components/ui/*` を置き換える。"
  - "Base UI を Dialog / Combobox など未整備領域の個別コンポーネントに限定して導入する。"
  - "現状の Tailwind + カスタムコンポーネント構成を維持し、必要に応じて React Aria など別の headless ライブラリを併用する。"
open_questions:
  - "寄付フローの UX で中長期的に必要となる高難度コンポーネント（モーダル、オートコンプリート等）はどこまで想定されているか。"
  - "Cloudflare Pages でのバンドルサイズや edge runtime 制約をどこまで許容できるか。"
next_action_by: "@frontend-platform"
review_due: "2025-11-26"
ttl_days: 30
---

## 背景と目的
- Donation Portal の UI は Next.js 15 + Tailwind CSS 4 + カスタムガラストークンで構築され、`components/ui/button.tsx` `components/ui/card.tsx` など最小限のコンポーネントのみを内製している。
- Base UI（旧 MUI Base）は Material UI チームが提供する headless コンポーネント群で、アクセシビリティとフォーカス制御を包括的に提供することから、既存 UI を Base UI に寄せる案が挙がっている。
- 本メモでは Base UI を画面全域へ適用する案の現実性・正当性・リスクを整理し、次の意思決定に向けた下準備とする。

## Base UI の現状認識
- 2025年10月1日リリースの `v1.0.0-beta.4` 時点でもベータ版であり、Breaking Changes（イベントディテール型の変更など）が毎月発生している。citeturn0search0
- ライブラリの性質は「完全にunstyledな React コンポーネント + 低レベルフック」で、CSS/テーマは利用側で全て制御する前提。citeturn0search1
- 提供コンポーネントは約30種で、Dialog/Combobox/Autocomplete/ContextMenu など高度なインタラクション系が中心。カードやガラス背景など視覚的な構造物は含まれない。citeturn0search4

## Donation Portal の UI 現状
- `docs/reference/ui/style-tokens.md` によると、背景/境界/グロス効果まで細かいトークンを定義し、`.donate-cta-animated` 等でマクロな視覚統制を行っている。Tailwind の `@theme inline` とカスタムユーティリティがセットで設計されており、視覚トークンは既に社内 SSOT 化済み。
- `components/ui/button.tsx` は `variant` / `size` / `data-accent` 属性で表示ポリシーを制御し、リンク対応や `donate-cta-animated` などのラッパーと密結合している。
- `components/ui/card.tsx` は `surface`（glass/frosted/light）や `border`（gradient/soft）をオプション化しており、LP 全域で統一したガラス表現を提供している。
- つまり少数の UI コンポーネントで十分要件を満たせており、複雑なポップアップ/フォーム制御はまだ限定的（`role="radiogroup"` ボタンなど簡易実装）である。

## 適用評価

### 技術的適合性
1. **コンポーネント提供範囲のギャップ**: Base UI には Button/Card/Badge といった視覚構造は存在せず、既存 `components/ui/*` の大半は引き続き自前実装が必要。採用してもレイアウト層は置き換えられないため、全面移行の効果は限定的。
2. **スタイリング負荷**: Base UI は data attribute ベースの状態露出を提供するが、当プロジェクトは Tailwind + CSS カスタムプロパティによる静的クラス設計が確立している。Base UI の `slotProps` などを使って同等のガラス表現を復元するには、現行 CSS をほぼ書き直す必要がある。
3. **Next.js 15 / Cloudflare Pages 互換性**: Base UI は React Client Components 前提の API が多く、`'use client'` セクションを増やす可能性がある。現状は pages 単位でクライアント化しているため重大な阻害要因ではないが、Edge Functions での bundle budget（Cloudflare Pages Functions 1MB 目安）には注意が必要。
4. **Accessibility 向上の余地**: Dialog/Combobox/ContextMenu など未実装パターンに関しては Base UI の A11y 実装を流用できる余地があるが、ラジオボタン程度なら現行実装でも WAI-ARIA 対応済みで、即時の品質向上幅は小さい。

### 運用・保守コスト
1. **ベータ版による API 変動**: リリースノート通り、9〜10月にも Breaking Change が頻発。全面採用すると、毎月 `beta.x` に追従するメンテナンスが不可欠で、Stripe/Discord 連携の優先度と競合する。
2. **依存ライフサイクルリスク**: Base UI は Material UI チームが公式に投資しているが、`v1` 安定版のターゲットタイムラインは未公開。安定前に API を前提とした自社ガイド/意図ドキュメントを更新すると、短期で陳腐化する恐れがある。
3. **デザイントークンとの乖離**: 現行トークンは CSS レイヤに直書きされているため、Base UI 導入で component-level tokens を導入するとSSOTが二重化する懸念がある。

### 効果とトレードオフ
| 観点 | Base UI 全面適用 | 局所適用 (Dialog 等) |
| --- | --- | --- |
| 初期工数 | Buttons/Card/Badge の移植 + CSS再構築が必要で大 | 未整備パターンの実装に限定されるため中 |
| 維持コスト | Beta 更新フォローが UI 全体へ波及 | 影響範囲を限定できる |
| A11y 恩恵 | 既存コンポーネントでは限定的 | モーダル系で効果大 |
| デザイン整合性 | 既存ガラストークンを再適用する必要 | 同一 CSS をラップするだけで済む |

## 結論と提案
1. **全面適用は現時点で非推奨**: 現行 UI が少数コンポーネントで完結しているため、Base UI を導入しても視覚トークンや `data-accent` 設計は書き直しになり、得られるメリット（A11y, keyboard handling）は小さい。
2. **局所導入の PoC 検討**: 2026年に予定している OAuth 同意 UI 拡張や将来の「支援プラン詳細モーダル」等で、Dialog/Combobox/ContextMenu が必要になったタイミングで Base UI をスポット導入する案は保持する。PoC では bundle size と `'use client'` 範囲のインパクトを計測する。
3. **代替候補の比較**: Headless UI や React Aria のように、既に Tailwind 連携ノウハウが豊富なライブラリも選択肢として残しておく（本件では詳細比較未実施）。

## 次のアクション候補
1. `frontend-platform` で Base UI を使った Dialog プロトタイプ（支援者表示モーダル仮）を作成し、`bundlephobia` 相当と Lighthouse の a11y を測定。
2. 2026 Q1 の UI 改修計画に「高度インタラクションのライブラリ選定 (Base UI vs React Aria)」を追加し、`docs/survey/ui/headless-libraries`（未作成）として整理する。
3. 現行カスタムコンポーネントに ARIA 属性チェックリストを追記し、Base UI を使わなくても最低限の A11y 水準を保てる状態を維持する。

## 未解決事項
- Base UI の安定版公開時期と、Cloudflare Pages での edge bundle サイズ制限との相性を引き続きモニタリングする。
- Donors ページに想定される「撤回フロー」の UI モーダル要件が固まり次第、Base UI の AlertDialog を比較検証する。

## 参考
1. Base UI Releases — `v1.0.0-beta.4` (2025-10-01) citeturn0search0
2. Base UI Overview — headless React components by MUI citeturn0search1
3. Base UI Headless Components Library summary (component数・適用指針) citeturn0search4

