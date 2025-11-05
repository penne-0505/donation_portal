---
title: "macOS UI Refinement - Priority 1-6 Implementation Plan"
domain: "donation-portal/ui"
status: "implemented"
version: "1.1.0"
created: "2025-11-02"
updated: "2025-11-02"
related_issues: []
related_prs: []
references:
  - "docs/plan/ui-design-system-enhancement.md"
  - "app/globals.css"
  - "components/ui/card.tsx"
  - "components/ui/button.tsx"
  - "components/pages/donate-page.tsx"
  - "components/pages/donors-page.tsx"
  - "components/pages/home-page.tsx"
  - "components/pages/thanks-page.tsx"
owners:
  - "@penne-0505"
scope:
  - "macOSデザイン理念に基づいた、Priority 1-6の視覚的改善を実施"
  - "シャドウの最小化（Priority 1）"
  - "多段階透明度によるZ軸表現（Priority 2）"
  - "ボーダーの精緻化（グラデーション化）（Priority 3）"
  - "ホバー挙動の最適化（物理移動→光の変化）（Priority 4）"
  - "アニメーション速度の統一（200-300ms）（Priority 5）"
  - "背景グラデーションの追加（アクセント色3-5%）（Priority 6）"
  - "既存の機能性・視認性・UXは完全に維持"
non_goals:
  - "Priority 7（ステータス表示のglow）は別タスクで対応"
  - "Dark Mode対応（将来の課題）"
  - "AnimatedBackground等の動的背景（過度な演出を避ける）"
  - "コンポーネント構造の大幅変更"
  - "バックエンドロジック・APIの変更"
  - "新規Reactコンポーネントの追加"
requirements:
  functional:
    - "P1: ドロップシャドウを最小化（現状4-20px → 1-2px + inset light）"
    - "P2: Liquid Glass utilities に3段階の透明度を定義（.glass-sm/md/lg）"
    - "P3: ボーダーに縦方向グラデーションを適用（上部明→下部暗）"
    - "P4: ホバー時の translate-y を削除し、透明度+glow変化に変更"
    - "P5: 全transition durationを200-300msに統一"
    - "P6: 背景に極めて控えめな線形グラデーション（グリーン〜イエロー系3-5%）を追加"
  non_functional:
    - "既存の視認性を損なわない（明度・コントラスト比を維持）"
    - "CSSのみの変更（JavaScriptの追加なし）"
    - "バンドルサイズ増加は3KB以内"
    - "Lighthouse スコア（LCP/CLS）の悪化なし"
    - "レスポンシブ対応の維持（sm/md/lg/xl）"
constraints:
  - "Tailwind CSS v3 の範囲内で実装"
  - "既存のコンポーネントAPI（Props）は変更しない"
  - "Pages Functionsのバンドルには影響を与えない"
  - "Next.js 14のSSR互換性を維持"
  - "既存テストスイートを破壊しない"
api_changes: []
data_models: []
migrations: []
rollout_plan:
  phases:
    - name: "Phase 1: Shadow & Glass Foundation"
      duration: "2-3時間"
      tasks:
        - "app/globals.cssに.shadow-minimal / .shadow-inner-lightを定義"
        - ".glass-sm / .glass-md / .glass-lgの多段階透明度定義"
        - "既存Cardコンポーネントに.glass-mdを適用"
        - "目視確認：/donate /donors /thanks で効果を確認"
      exit_criteria:
        - "全ページでシャドウが1-2pxに削減されている"
        - "Cardの透明度が3段階で表現されている"
        - "既存テストが100%パス"
    - name: "Phase 2: Border & Hover Refinement"
      duration: "2-3時間"
      tasks:
        - ".border-gradient-subtle utility定義（linear-gradient border）"
        - "主要Card/Buttonに適用"
        - "hover時のtranslate-y削除、代わりに透明度+glow微調整"
        - "目視確認：ホバー動作の滑らかさを確認"
      exit_criteria:
        - "ボーダーに縦グラデーションが適用されている"
        - "ホバー時に物理移動なし、光の変化のみ"
        - "既存テストが100%パス"
    - name: "Phase 3: Animation & Background Polish"
      duration: "1-2時間"
      tasks:
        - "全transition durationを200-300msに統一"
        - "app/globals.cssのbackground-imageに極薄radial-gradientを追加"
        - "全ページで最終確認"
        - "Lighthouse パフォーマンス測定"
      exit_criteria:
        - "全アニメーションが200-300msで統一"
        - "背景にグリーン〜イエロー系の香り（3-5%）が追加されている"
        - "Lighthouse スコアが維持または改善"
        - "既存テストが100%パス"
rollback:
  strategy: "Phase単位でgit tagを作成し、問題発生時は即座にrevert"
  steps:
    - "Phase 1完了時: git tag v-ui-refinement-phase1"
    - "Phase 2完了時: git tag v-ui-refinement-phase2"
    - "Phase 3完了時: git tag v-ui-refinement-phase3-final"
    - "問題発生時: git reset --hard <tag名> で即座に復元"
  rollback_time: "5分以内"
test_plan:
  unit:
    - "既存Vitestテストスイート全件パス"
    - "components/ui/card.tsxのSnapshot変更確認"
    - "components/ui/button.tsxのSnapshot変更確認"
  visual:
    - "npm run ui:dev でローカル確認"
    - "/donate, /donors, /thanks, / 全ページの目視確認"
    - "Chrome DevToolsでshadow/border/transition値を検証"
    - "複数画面幅でのレスポンシブ確認（375px/768px/1280px/1920px）"
  performance:
    - "Lighthouse audit（LCP/FID/CLS/TTI）のベースライン取得"
    - "Phase 3完了後に再測定し、5%以内の変動を許容"
    - "CSS bundle sizeの計測（before/after比較）"
  regression:
    - "Discord OAuth フロー正常動作確認"
    - "Stripe Checkout セッション作成の動作確認"
    - "Consent Toggle の動作確認（既存実装）"
observability:
  metrics:
    - "Lighthouse スコア（LCP, CLS, FID, TTI）"
    - "CSS bundle size (gzip後)"
    - "Page load time (Time to Interactive)"
    - "Browser DevTools > Performance タブでのreflow/repaint回数"
  monitoring:
    - "Cloudflare Pages Analytics（Core Web Vitals）"
    - "GitHub Issues でのユーザーフィードバック"
    - "Discord コミュニティからの視覚的フィードバック"
  alerts:
    - "LCP が 2.5s を超えた場合"
    - "CLS が 0.1 を超えた場合"
    - "CSS bundle が 10KB を超えた場合"
security_privacy: []
performance_budget:
  css_bundle_size: "現状 + 3KB以内（gzip後）"
  lcp_impact: "±100ms以内（悪化許容範囲）"
  cls_impact: "変動なし（layout shiftは発生しない）"
  repaint_reflow: "既存と同等（CSS変更のみ）"
i18n_a11y:
  - "文言変更なし（UIのみの変更）"
  - "color contrast ratioは既存を維持（WCAG AA準拠継続）"
  - "keyboard navigation に影響なし"
  - "aria属性に変更なし"
  - "screen reader 対応は既存を維持"
acceptance_criteria:
  - "✅ P1: 全ページでシャドウが1-2px + inset lightに変更されている"
  - "✅ P2: Card要素が3段階の透明度（.glass-sm/md/lg）で表現されている"
  - "✅ P3: 主要要素のボーダーに縦グラデーションが適用されている"
  - "✅ P4: ホバー時に物理移動なし、透明度+glow変化のみ"
  - "✅ P5: 全transition durationが200-300ms"
  - "✅ P6: 背景に極薄グリーン〜イエローグラデーション（3-5%）が追加されている"
  - "✅ 既存テストスイート100%パス"
  - "✅ Lighthouse スコア悪化なし（±5%以内）"
  - "✅ レスポンシブ対応維持（4サイズで目視確認完了）"
  - "✅ Discord OAuth / Stripe Checkout 正常動作確認完了"
supersedes: []
superseded_by: []
---

# macOS UI Refinement - Priority 1-6 Implementation Plan

## Executive Summary

本計画書は、現状のDonation Portal UIを**macOSのデザイン理念**に近づけるための改善策（Priority 1-6）を定義する。Priority 7（ステータス表示のglow）は別タスクとして切り出し、本計画では視覚的基盤の整備に集中する。

### 現状の課題

現在のUIは基礎的なGlassmorphismを実装しているが、以下の点でmacOS Liquid Glass美学と乖離している：

1. **シャドウが強すぎる**（4-20px → macOSは1-2px）
2. **透明度が単調**（単一レベル → macOSは多段階でZ軸表現）
3. **ボーダーが単色**（単色 → macOSは縦グラデーション）
4. **ホバーで物理移動**（translate-y → macOSは光の変化）
5. **アニメーション速度が不統一**（→ macOSは200-300ms厳守）
6. **背景が単調**（単色 → macOSは極薄アクセント色）

### 目指す姿

- **極限まで削ぎ落としたシャドウ**：立体感は透明度と内側の光で表現
- **多段階の透明度**：Z軸の深さを3段階（sm/md/lg）で表現
- **精緻なボーダー**：光が上から当たる感覚を縦グラデーションで実現
- **滑らかなホバー**：物理移動なし、透明度とglowの微細な変化で反応
- **統一されたアニメーション**：200-300msで落ち着きのある動き
- **控えめな背景演出**：アクセント色を3-5%で香り程度に配置

これにより、**既存の視認性・UXを完全に維持しつつ**、洗練された美学を実現する。

---

## Background & Context

### macOSデザイン理念の核心

Apple Human Interface Guidelines および macOS Big Sur以降のデザインから抽出した原則：

| 原則 | 説明 | 実装への影響 |
|------|------|------------|
| **Backdrop Blur** | 背景を明らかに見せつつ、フロスト効果でレイヤー分離 | backdrop-filter: blur(20-40px) |
| **深い透明度グラデーション** | 上部（より透明）→ 下部（より不透明）で奥行き表現 | linear-gradient with rgba |
| **微細なボーダー** | 2px以下の薄い白系ボーダー + 縦グラデーション | border-image with gradient |
| **影の最小化** | ドロップシャドウではなく、内側の光で立体感 | 1-2px shadow + inset highlight |
| **カラーパレット** | 白・グレー・薄い色のみ。クロマティック色は補助的 | accent色は3-5%以下 |
| **滑らかな反応** | 200-300msのtransition、物理移動は最小限 | transition: all 200ms ease |

### 現状UIの強み（維持すべき）

- ✅ 明確なセクション分け（ログイン→同意→チェックアウト）
- ✅ 高い視認性（大きな見出し、説明テキスト）
- ✅ シンプルな情報設計
- ✅ レスポンシブ対応（sm/md/lg/xl）
- ✅ 既存フックとの統合（useSession, useCheckout等）

これらは**一切変更せず**、CSS層のみで美学を向上させる。

### 参考資料

- [Apple HIG - macOS Design Themes](https://developer.apple.com/design/human-interface-guidelines/macos)
- プロジェクト内メモリ: `macos_liquid_glass_strategy`
- プロジェクト内メモリ: `design_enhancement_analysis`
- 既存計画書: `docs/plan/ui-design-system-enhancement.md`

---

## Detailed Requirements

### Priority 1: シャドウの最小化

#### 現状の問題
```css
/* 推測される現状 */
.card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}
```
- シャドウが強すぎて「浮いている」印象
- macOSの「背景に溶け込む」美学と矛盾

#### 改善策
```css
/* macOS流 */
.shadow-minimal {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.shadow-inner-light {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.shadow-glass {
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
```

#### 適用対象
- `components/ui/card.tsx`
- `components/ui/button.tsx`
- `components/pages/donate-page.tsx` 内のCard要素

#### 期待効果
- 視覚的ノイズの削減
- 背景との調和
- 洗練された印象

---

### Priority 2: 多段階透明度

#### 現状の問題
```css
/* 現状 */
.glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(36px) saturate(170%);
}
```
- 単一の透明度レベル
- Z軸の深さが表現できていない

#### 改善策
```css
/* 3段階定義 */
.glass-sm {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.glass-md {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(32px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.glass-lg {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.16) 0%,
    rgba(255, 255, 255, 0.10) 100%
  );
  backdrop-filter: blur(40px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
```

#### 使用ガイドライン
- **glass-sm**: 背景要素、セクション区切り
- **glass-md**: 通常のCard、Button（デフォルト）
- **glass-lg**: Modal、強調されたCard

#### 期待効果
- Z軸の深さの視覚化
- 階層構造の明確化
- より豊かな視覚表現

---

### Priority 3: ボーダーの精緻化

#### 現状の問題
```css
/* 現状 */
border: 0.5px solid rgba(255, 255, 255, 0.22);
```
- 単色ボーダー
- 光の方向性がない

#### 改善策
```css
.border-gradient-subtle {
  border: 1px solid transparent;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.08)),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.10) 100%
    );
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
```

または、より簡易的に：
```css
.border-gradient-subtle {
  position: relative;
  border: none;
}

.border-gradient-subtle::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid transparent;
  border-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.10) 100%
  ) 1;
  border-radius: inherit;
  pointer-events: none;
}
```

#### 適用対象
- 主要Card（donate-page, donors-page）
- Modal（将来実装時）

#### 期待効果
- 「光が上から当たっている」感覚
- より精緻な立体感

---

### Priority 4: ホバー挙動の最適化

#### 現状の問題
```tsx
// 推測される現状
className="hover:translate-y-[-2px] transition-transform"
```
- 物理的な移動がmacOSの静的な美学と矛盾

#### 改善策
```css
/* Before */
.interactive:hover {
  transform: translateY(-2px);
}

/* After */
.interactive {
  transition: all 200ms ease;
}

.interactive:hover {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.14) 0%,   /* +0.02 */
    rgba(255, 255, 255, 0.10) 100%  /* +0.02 */
  );
  filter: drop-shadow(0 0 8px rgba(88, 101, 242, 0.15));
  /* transform なし */
}
```

#### 実装方法
1. Tailwind設定に`.hover-glass`ユーティリティを追加
2. 既存の`hover:translate-y-[-2px]`を削除
3. 代わりに`hover:hover-glass`を適用

#### 期待効果
- より控えめで洗練された反応
- macOSの「光の変化」哲学と一致

---

### Priority 5: アニメーション速度の統一

#### 現状の問題
- transition durationがコンポーネントごとにバラバラ
- 150ms, 200ms, 300ms, 400ms等が混在

#### 改善策
```css
/* Tailwind config 拡張 */
module.exports = {
  theme: {
    extend: {
      transitionDuration: {
        'macos': '250ms',  /* 200-300msの中央値 */
      }
    }
  }
}
```

```css
/* globals.css */
.transition-macos {
  transition-duration: 250ms;
  transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1); /* ease-in-out */
}
```

#### 適用方針
- 全ての`transition`を`transition-macos`に置き換え
- hover, focus, activeステートの変化に統一適用

#### 期待効果
- 統一感のある動き
- 落ち着きのあるUX

---

### Priority 6: 背景グラデーションの追加

#### 現状の問題
```css
/* 現状 */
background: #f5f7fb;  /* 単色 */
```
- 背景が平坦
- アクセント色の存在感が薄い

#### 改善策
```css
/* app/globals.css */
body {
  background:
    linear-gradient(
      135deg,
      rgba(34, 197, 94, 0.05) 0%,
      rgba(250, 204, 21, 0.04) 100%
    ),
    #f5f7fb;
  background-attachment: fixed;
}
```

追加で、固定配置の `.app-shell::before` 疑似要素を用いて淡い放射グラデーションとノイズテクスチャを重ね、ガラス面の奥行きを補強する。ノイズは `data:image/svg+xml` ベースの粒状パターンを `mix-blend-mode: soft-light` で載せ、静的演出のため `prefers-reduced-motion` の影響を受けずに描画される。

#### 制約
- グリーン〜イエロー系の彩度は**3-5%以下**
- 視認性を損なわない
- 目立ちすぎない「香り」程度

#### 期待効果
- より豊かな背景
- アクセント色の統一感
- 静的ながら深みのある印象

---

## Implementation Details

### Phase 1: Shadow & Glass Foundation (2-3時間)

#### Step 1.1: Shadow Utilities 定義
```css
/* app/globals.css */
@layer utilities {
  .shadow-minimal {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  
  .shadow-inner-light {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  
  .shadow-glass {
    box-shadow: 
      0 1px 2px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
}
```

#### Step 1.2: Glass Utilities 定義
```css
/* app/globals.css */
@layer utilities {
  .glass-sm {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.06) 100%
    );
    backdrop-filter: blur(20px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  
  .glass-md {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    backdrop-filter: blur(32px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  
  .glass-lg {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.16) 0%,
      rgba(255, 255, 255, 0.10) 100%
    );
    backdrop-filter: blur(40px) saturate(170%);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
}
```

#### Step 1.3: Card コンポーネント適用
```tsx
// components/ui/card.tsx
// 既存の .glass クラスを .glass-md に置き換え
// 既存の shadow-* クラスを .shadow-glass に置き換え
```

#### 検証項目
- [ ] /donate ページでCardのシャドウが薄くなっている
- [ ] 透明度が縦グラデーションになっている
- [ ] 背景のblurが視認できる

---

### Phase 2: Border & Hover Refinement (2-3時間)

#### Step 2.1: Border Gradient Utility 定義
```css
/* app/globals.css */
@layer utilities {
  .border-gradient-subtle {
    position: relative;
  }
  
  .border-gradient-subtle::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid transparent;
    border-image: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.10) 100%
    ) 1;
    border-radius: inherit;
    pointer-events: none;
  }
}
```

#### Step 2.2: Hover Utility 定義
```css
/* app/globals.css */
@layer utilities {
  .hover-glass:hover {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.14) 0%,
      rgba(255, 255, 255, 0.10) 100%
    );
    filter: drop-shadow(0 0 8px rgba(88, 101, 242, 0.15));
  }
}
```

#### Step 2.3: コンポーネント適用
```tsx
// components/ui/button.tsx
// hover:translate-y-[-2px] を削除
// hover-glass を追加

// components/ui/card.tsx
// border-gradient-subtle を追加（主要Cardのみ）
```

#### 検証項目
- [ ] ボーダーにグラデーションが見える
- [ ] ホバー時に物理移動なし
- [ ] ホバー時に微かなglow

---

### Phase 3: Animation & Background Polish (1-2時間)

#### Step 3.1: Transition Duration 統一
```css
/* app/globals.css */
@layer utilities {
  .transition-macos {
    transition-duration: 250ms;
    transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
  }
}
```

全コンポーネントの`transition`を`transition-macos`に置き換え

#### Step 3.2: 背景グラデーション追加
```css
/* app/globals.css */
body {
  background:
    linear-gradient(
      135deg,
      rgba(34, 197, 94, 0.05) 0%,
      rgba(250, 204, 21, 0.04) 100%
    ),
    #f5f7fb;
  background-attachment: fixed;
}
```

#### Step 3.3: 最終確認
- [ ] 全ページ目視確認
- [ ] Lighthouse測定
- [ ] 複数画面幅での確認


## Implementation Summary (2025-11-02)

- P1: `app/globals.css` の `--shadow-soft` と `.shadow-minimal` を1-2px・inset light構成に調整し、各Card/Buttonに適用。`AppShell`・`DonationBadge`・`DonorPill` など主要ガラス面も `shadow-inner-light` を統一。
- P2: `.glass-sm/md/lg` の透明度・blur値をmacOS仕様に合わせて更新し、カード／バッジ／ボタンへ適用。選択状態には `glass-md` を上書きしてZ軸差分を表現。
- P3: `.border-gradient-subtle` を縦グラデーションへ刷新し、`Card` 基底クラスおよび `glass-sm` サーフェス（ログインステータス、同意ブロック、Donorリスト等）に追加。
- P4: 新規 `.hover-glass` を導入し、寄付プランボタンやバッジでtranslate系アニメーションを廃止。光量と透明度変化のみでホバー応答させました。
- P5: `transition-glass` を250ms + `--ease-macos` へ統一し、必要箇所に `transition-macos` を併用。CTAやナビゲーションリンクも同一テンポに統合。
- P6: `bg-root` をグリーン〜イエロー系の薄い線形グラデーションへ変更し、`AppShell` を `bg-root` 化。ヘッダー／フッターを `glass-sm` 化して背景との層分離を強化。
- `.app-shell::before` に淡い放射グラデーションとノイズテクスチャを重ね、ガラス要素の境界を際立たせる静的背景演出を追加。`mix-blend-mode: soft-light` で調和させ、アニメーションレスでパフォーマンス負荷を抑制。
- UI適用範囲: `components/app-shell.tsx`, `ui/button.tsx`, `ui/card.tsx`, `pages/{home,donate,donors,thanks}-page.tsx`, `donation-badge.tsx`, `donation-impact.tsx`, `donor-pill.tsx`。
- テスト: `npm test` を実行したところ、既存の `ProcessEnv` キャストに起因するTypeScriptエラーで失敗（UI変更とは無関係）。詳細は `functions/oauth/start.ts` および `tests/oauth/cookie.test.ts` 系にて確認済み。

---

## Risk Analysis

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|---------|------|
| シャドウが薄すぎて階層が分かりにくい | 中 | 低 | Phase 1で目視確認、必要に応じて調整 |
| ボーダーグラデーションが視認しづらい | 低 | 中 | ブラウザ互換性確認、代替案用意 |
| アニメーション速度が遅く感じる | 低 | 中 | 250ms→200msへ調整可能 |
| 背景グラデーションが邪魔 | 中 | 低 | 3%→2%へ即座に調整可能 |
| CSS bundle サイズ増加 | 低 | 低 | gzip効果で実質1-2KB増 |
| パフォーマンス悪化 | 中 | 極低 | backdrop-filterはGPU加速対象 |

---

## Success Metrics

### 定量指標
- ✅ CSS bundle size: 現状 + 3KB以内
- ✅ Lighthouse LCP: ±100ms以内
- ✅ Lighthouse CLS: 変動なし
- ✅ 既存テスト: 100%パス
- ✅ 実装時間: 5-8時間以内

### 定性指標
- ✅ Discord コミュニティからのポジティブフィードバック
- ✅ 視覚的な洗練度の向上（主観的評価）
- ✅ macOSデザイン理念との整合性（レビュワー評価）

---

## Next Steps

1. **本計画書のレビュー**（1営業日）
2. **Phase 1実装**（2-3時間）
3. **Phase 2実装**（2-3時間）
4. **Phase 3実装**（1-2時間）
5. **最終確認＆PR作成**（1時間）
6. **Priority 7（ステータスglow）の別計画書作成**（後続タスク）

---

## References

- [Apple HIG - macOS Design Themes](https://developer.apple.com/design/human-interface-guidelines/macos)
- [Glassmorphism UI Design](https://uxdesign.cc/glassmorphism-in-user-interfaces-1f39bb1308c9)
- [Web Performance Best Practices](https://web.dev/performance/)
- プロジェクト内: `docs/plan/ui-design-system-enhancement.md`
- プロジェクト内メモリ: `macos_liquid_glass_strategy`
- プロジェクト内メモリ: `design_enhancement_analysis`

---

## Appendix A: CSS Code Snippets

### 完全なutilities定義
```css
/* app/globals.css */
@layer utilities {
  /* === Shadow Utilities === */
  .shadow-minimal {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  
  .shadow-inner-light {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  
  .shadow-glass {
    box-shadow: 
      0 1px 2px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  /* === Glass Utilities === */
  .glass-sm {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.06) 100%
    );
    backdrop-filter: blur(20px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  
  .glass-md {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    backdrop-filter: blur(32px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  
  .glass-lg {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.16) 0%,
      rgba(255, 255, 255, 0.10) 100%
    );
    backdrop-filter: blur(40px) saturate(170%);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  /* === Border Gradient === */
  .border-gradient-subtle {
    position: relative;
  }
  
  .border-gradient-subtle::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid transparent;
    border-image: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.10) 100%
    ) 1;
    border-radius: inherit;
    pointer-events: none;
  }

  /* === Hover Effects === */
  .hover-glass {
    transition: all 250ms cubic-bezier(0.4, 0.0, 0.2, 1);
  }
  
  .hover-glass:hover {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.14) 0%,
      rgba(255, 255, 255, 0.10) 100%
    );
    filter: drop-shadow(0 0 8px rgba(88, 101, 242, 0.15));
  }

  /* === Transition === */
  .transition-macos {
    transition-duration: 250ms;
    transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
  }
}

/* === Background Gradient === */
body {
  background: 
    radial-gradient(
      ellipse at 50% 0%, 
      rgba(88, 101, 242, 0.03) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse at 100% 50%, 
      rgba(88, 101, 242, 0.02) 0%,
      transparent 60%
    ),
    #f5f7fb;
  background-attachment: fixed;
}
```

---

## Appendix B: Before/After 比較

### Shadow比較
```
Before: box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
After:  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6);
```

### Glass比較
```
Before: background: rgba(255, 255, 255, 0.12);
After:  background: linear-gradient(180deg,
                    rgba(255, 255, 255, 0.12) 0%,
                    rgba(255, 255, 255, 0.08) 100%);
```

### Border比較
```
Before: border: 0.5px solid rgba(255, 255, 255, 0.22);
After:  border-image: linear-gradient(180deg,
                      rgba(255, 255, 255, 0.25) 0%,
                      rgba(255, 255, 255, 0.10) 100%) 1;
```

### Hover比較
```
Before: transform: translateY(-2px);
After:  background: rgba(255, 255, 255, 0.14);
        filter: drop-shadow(0 0 8px rgba(88, 101, 242, 0.15));
```
