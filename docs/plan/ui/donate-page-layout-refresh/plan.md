---
title: Donate page layout refresh
domain: ui
status: implemented
version: 0.1.0
created: 2025-11-12
updated: 2025-11-12
related_issues: []
related_prs: []
references:
  - ../../../standards/documentation_guidelines.md
  - ../../../standards/documentation_operations.md
  - ../../archives/plan/donate-page-new-ui-migration.md
  - ../../reference/ui/home-page-redesign.md
  - ../../../tmp/new_donate_layout_draft/app/donate/page.tsx
scope:
  - `/donate` の画面構造のみを `tmp/new_donate_layout_draft` を参考に刷新する（色・影・タイポ等のデザイン原則は現行 UI を踏襲）
  - 既存の `useSession` / `useConsentMutation` / `useCheckout` ロジックを保持したまま UI だけ置き換える
  - 金額指定ステップを廃止し、プラン選択＋単一CTA構成へ再定義する
non_goals:
  - Stripe プランや CheckoutPreset の価格テーブル変更
  - Discord OAuth / Webhook フローの仕様変更
  - Cloudflare Pages 以外のデプロイ方式検討
  - `tmp` ドラフトに含まれる独自カラーやフォント、アニメーションの導入
requirements:
  functional:
    - 寄付プランカード（単発 / 月額 / 年額）を `CHECKOUT_PRESETS` と1:1でレンダリングし、選択状態を `selectedPreset` に反映する
    - CTA ボタンは常に1つとし、選択中 preset と `useCheckout` を結び付ける（未選択/未ログイン時は disabled）
    - `DonationImpact` / 同意トグル / Discord 連携ステータスは新レイアウトでも表示位置が明確になるよう再配置する
    - これからの流れセクションをカード化し、特典表示ではなく既存コピー（対価なし）に準拠する
  non_functional:
    - 追加CSSは `app/globals.css` 既存 design token / ユーティリティを再利用し、ドラフト専用テーマは持ち込まない（バンドル増加は 5KB 以内）
    - Lighthouse LCP が 2.5s を超えないようコンポーネント分割とメモリ消費を管理する
constraints:
  - レイアウト以外のデザイン原則（配色、タイポ、ガラスの強度等）は現行 UI を踏襲する
  - App Router + Cloudflare Pages Functions 環境で SSR / CSR の双方を破綻させない
  - `git rm` / `rm` は行わず、`tmp` 配下のデザインは参照のみ
  - Tailwind v4（`@import 'tailwindcss'`）で利用可能なユーティリティに従う
api_changes: []
data_models: []
migrations: []
rollout_plan:
  - Phase 1: レイアウト骨格を差し替え、mock状態だった UI ステートを実データにマッピング
  - Phase 2: 既存 design token を活かしたスタイル整合と最小限のユーティリティ追加
  - Phase 3: `tests/donate/ui.test.ts` と関連ドキュメントを更新、プレビュー環境で目視確認
rollback:
  - `components/pages/donate-page.tsx` を直前のタグへ revert し、`globals.css` の追加クラスをコメントアウト
  - Cloudflare Pages プレビューを差し戻し、旧 UI を即時復旧
security_privacy:
  - セッションや consent API の振る舞いは変更しないため追加リスクなし
performance_budget:
  - 追加 CSS: ≤ 5KB
  - 追加 JS: 0（ロジックは既存フックを流用）
observability:
  - GA4 `donate_start` イベントが引き続き発火することを `handleCheckout` で確認
  - Cloudflare Pages preview で LCP / CLS を比較し regression を検知
test_plan:
  unit:
    - `npm run test donate` で UI テストケース（ログイン導線 / 同意トグル / Checkout / エラー表示）を更新
  integration:
    - `npm run dev` で `/donate` を開き、サインイン済み・未サインイン双方の DOM を確認
  manual:
    - Stripe/Discord サンドボックス経由でフローを一周し、CTA 1本化後も Checkout が開始されることを確認
i18n_a11y:
  - すべての新規要素に aria 属性を付与（特にプランカードの選択状態と CTA の `aria-live` 通知）
  - 文言は日本語で記述し、対価無し方針を明示
acceptance_criteria:
  - `/donate` が単一カード＋縦並びセクションで描画され、金額指定ステップが存在しない
  - プランカード選択後に CTA が有効化され、`handleCheckout` が既存と同じパラメータで呼び出される
  - ドキュメント（本計画＋ reference/intent 更新）が最新UIを説明している
---

## 背景
現行の `components/pages/donate-page.tsx` は左右2カラム構成で、右カラムに複数の Checkout ボタンを並べる旧 UI を維持している。一方、`tmp/new_donate_layout_draft/app/donate/page.tsx` には単一カラムの新しいレイアウトサンプルが存在するが、`useState` ベースのモック実装や金額選択ステップ、独自テーマが含まれており、そのままでは本番ロジックと整合しない。

今回の刷新では「レイアウトのみ採用し、金額指定ステップは不要」という前提に切り替わったため、ドラフト UI を参照しつつ `/donate` を単一 CTA に集約した体験へ更新する必要がある。

## 現状と課題
- **レイアウト不一致**: 現在は旧 UI の名残で 2 カラム構成だが、デザインシステムではヒーロー + 単一カードが標準になりつつある。
- **モック特有のステップ**: ドラフト UI には金額選択の追加ステップが含まれるが、`CHECKOUT_PRESETS` は固定金額であり、実際には Stripe 画面で金額を確定する。余分な UI は認知負荷になる。
- **テストの陳腐化**: `tests/donate/ui.test.ts` は旧 DOM を前提としており、新レイアウト導入時に破綻する。
- **ドキュメントの遅延**: 既存の `docs/archives/plan/donate-page-new-ui-migration.md` は deprecated 扱いで最新の意思決定（単一CTA化）をカバーしていない。

## ゴール
1. `/donate` の視覚レイアウトをドラフト参考の単一カラムへ刷新する（スタイル原則は現行 UI を維持）。
2. プラン選択→同意確認→CTA→フローステップの体験に一本化し、金額指定 UI を完全に排除する。
3. UI テストとドキュメントを最新状態へ更新し、将来の仕様変更にも耐えられるフレームを整備する。

## 実装方針
### Phase 1: レイアウト刷新
- `components/pages/donate-page.tsx` を単一カラム構成に変更し、Discord 連携 / 掲示同意 / プランカード / CTA / フロー説明の順にセクションを配置。
- `CHECKOUT_PRESETS` から UI 表示用の `plans` 配列を組み立て、選択状態は `selectedPreset` に保持。CTA 文言には `selectedPreset.amount` を利用する。
- `DonationImpact` はプラン選択直後に表示し、CTA の下に配置してユーザーへ即時フィードバックを与える。

### Phase 2: スタイル整合
- `tmp` のクラス構造を参考にしつつ、色・影・フォントは `app/globals.css` 既存トークン（`glass-*`, `glow-*`, `bg-root` 等）で組み直す。
- 追加ユーティリティはレイアウト実現に不可欠なものに限定し、導入時にコメントで再利用意図を記載する。

### Phase 3: 検証と文書化
- `tests/donate/ui.test.ts` を新DOM構造に合わせて更新（プランカード選択、CTA有効化、DonationImpact描画、エラー表示など）。
- `docs/reference/ui/home-page-redesign.md` と本プランから参照する intent/guide をアップデートし、「金額指定ステップ廃止」「単一CTA化」の背景を説明。
- Cloudflare Pages Preview で UI を確認し、GA4 `donate_start` が引き続き送信されることを Network/Console ログで確認する。

## 作業計画
| 順番 | タスク | 詳細 | Owner |
| --- | --- | --- | --- |
| 1 | レイアウト実装 | `components/pages/donate-page.tsx` の DOM を新構成へ移行。`selectedPlan` など不要 state を削除し、`selectedPreset` へ統一。 | FE |
| 2 | CSS 整理 | 既存 design token を優先しつつ、必要最小限のユーティリティのみ `app/globals.css` に追加。新色や独自フォントは持ち込まない。 | FE |
| 3 | ロジック検証 | `npm run test donate`・`npm run typecheck` を実行し、エラーが無いことを確認。 | FE |
| 4 | Docs 更新 | 本プランの参照を `docs/reference/ui/home-page-redesign.md` などからリンクし、計画内容を反映。 | FE |
| 5 | プレビュー確認 | Cloudflare Pages preview でデスクトップ / モバイル表示、サインイン状態を手動確認。 | FE |

## リスクと対策
- **UI 回帰リスク**: DOM 大幅変更により想定外のスタイル崩れが起きる可能性 → Storybook 代替として `npm run dev` + Percy (手動) でスクリーンショット比較を行う。
- **テスト破綻**: UI テストのセレクタが大きく変わる → data-* 属性やロール/名前を明示的に付与し、将来的な変更に耐えられるようにする。
- **パフォーマンス低下**: グラデーション/ガラス効果で描画コストが上がる → `prefers-reduced-motion` への分岐と CSS 変数の再利用でコストを抑える。

## 成功指標
- `/donate` で表示される CTA が常に 1 つであり、金額指定 UI が存在しないこと。
- レイアウトはドラフトに近いが、色・影・アニメーションは現行 UI のルールに沿っていること。
- `npm run test donate` がグリーンで、凝視すべき UI テストケース（ログイン導線 / consent / checkout / error）の DOM セレクタが安定していること。
- ドキュメントに今回の設計意図が明記され、後続メンバーが旧 UI との差異を把握できること。

## 実装結果 (2025-11-12)
- `components/pages/donate-page.tsx` を単一カラム構成へ刷新し、プランカード（radio UI）と単一 CTA（`donate-cta-animated` ボタン）を実装。`DonationImpact` は選択中 preset の直下へ移設し、`aria-live` で CTA 状態を通知するようにした。
- `tests/donate/ui.test.ts` を新 DOM/挙動（プラン選択→CTA 起動）に合わせて更新し、`CHECKOUT_PRESETS` を利用した選択テストを維持した上で `npm run test donate` / `npm run typecheck` を実行しグリーンを確認。
- `docs/reference/ui/home-page-redesign.md` の DonatePage 節をレイアウト刷新内容と新 `handleCheckout` フローで更新し、本計画ドキュメントと相互参照できるよう整備した。
- 本 plan を `status: implemented` へ更新し、フェーズ完了ログ（本節）を追記。後続 intent 化の際は本節を根拠として参照する。
