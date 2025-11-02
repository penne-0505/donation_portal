# UI Design System Enhancement Plan - 計画書作成完了

## 作成日時
2025-11-02

## ドキュメント位置
`docs/plan/ui-design-system-enhancement.md`

## 計画概要

### 目的
既存UIの視認性・UXを維持しつつ、macOS Liquid Glass 美学とglow効果を段階的に導入。
美麗さ・洗練感の向上をメインゴール。

### 対象ページ
- `/donate` - 寄付ページ
- `/donors` - 寄付者リスト
- `/thanks` - ありがとうページ
- 全ページ共通（AppShell）

---

## 3段階実装計画

### Tier 1: 基盤構築（最優先）- 4-5時間
**目標**: Liquid Glass 効果を全ページに適用

1. **CSS Utilities 追加** (`app/globals.css`)
   - `.glass-sm`: blur 20px, background rgba(255,255,255,0.08)
   - `.glass-md`: blur 32px, background rgba(255,255,255,0.12)
   - `.glass-lg`: blur 40px, background rgba(255,255,255,0.16)
   - `.shadow-minimal`: 1-2px minimal shadow
   - `.shadow-inner-light`: inset light border
   - `.border-gradient-subtle`: グラデーション border
   - `.glow-accent-subtle`: drop-shadow 8px (紫)
   - `.glow-accent-medium`: drop-shadow 16px (紫)

2. **既存コンポーネント適用**
   - `Card`: デフォルトで `.glass-md` 適用
   - `Button`: hover から大きな transform 削除、`.glow-accent-subtle` 追加
   - ドロップシャドウ: 12-32px → 1-4px に最小化

### Tier 2: UX強化（推奨）- 4時間
**目標**: インタラクション改善 & 統一感強化

1. **ConsentToggle コンポーネント新規作成**
   - macOS style トグルスイッチ
   - aria-checked 属性対応
   - 選択時に subtle glow

2. **ステータス表示改善**
   - Success/Error Alert に glow 追加
   - Subtle だが確実な視認性向上

3. **アニメーション Tuning**
   - transition を 200-300ms に統一
   - cubic-bezier を統一

### Tier 3: オプション（将来検討）- 4-6時間
**目標**: さらなるモダン化

1. Dark Mode 対応
2. AnimatedBackground 軽量版
3. Multi-layer card elevation

---

## Key Design Principles

### macOS Liquid Glass の特性（取り入れる）
- 透明度グラデーション（上透明 → 下不透明）
- 最小限のドロップシャドウ（inset light で補完）
- 大きな変化を避けたホバー効果（+0.02程度）
- 色彩は白・グレー・淡色のみ

### glow 戦略（紫のみに限定）
- **ホバー時**: subtle glow (8px, 0.15 opacity)
- **選択時**: medium glow (16px, 0.25 opacity)
- **他の状態**: glow なし
- **理由**: 情報設計の明快さ、視認性維持

### 避ける（新UI案から） 
- 強いドロップシャドウ
- 複数色のglow乱用
- 背景グラデーション大幅変化
- スケールアニメーション多用
- AnimatedBackground（動的応答性）

---

## ファイル変更リスト

### Tier 1 必須
1. `app/globals.css` - 新 utilities 定義
2. `components/ui/card.tsx` - `.glass-md` デフォルト
3. `components/ui/button.tsx` - ホバー改善
4. `components/pages/donate-page.tsx` - 確認・調整

### Tier 2 推奨
5. `components/consent-toggle.tsx` - 新規作成
6. `components/pages/donate-page.tsx` - 統合
7. `components/pages/donors-page.tsx` - glow統一確認

### Tier 3 オプション
8. `components/animated-background.tsx` - 軽量版参考実装

---

## テスト・検証計画

### ユニットテスト
- 既存テストスイート 100% パス継続
- ConsentToggle の新規テスト

### ビジュアルテスト
- Lighthouse score（LCP/CLS 無回帰）
- ブラウザ DevTools での確認
- 複数デバイス幅（mobile/tablet/desktop）

### E2E テスト
- Discord ログイン → Checkout → Thanks フロー確認
- glow がCheckout 邪魔しないか確認

---

## パフォーマンス予算
- CSS バンドル増加: 最大 5KB (gzip後)
- LCP への影響: なし（CSS のみ、JS 不要）
- reflow/repaint 負荷: 既存と同等

---

## 承認・展開プロセス
1. 計画書（現在）完成
2. intent/ へ移行（レビュー）
3. Tier 1 実装開始
4. ローカルテスト → プレビュー環境 → PR
5. レビュー → Merge → Cloudflare Pages デプロイ

---

## 参考メモリ
- `macos_liquid_glass_strategy.md`: 詳細な戦略分析
- `design_enhancement_analysis.md`: 新UI vs 現状UI 比較
- `ui_comparison_current_vs_new.md`: ファイル構成比較
