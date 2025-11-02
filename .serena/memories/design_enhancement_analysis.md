# 現状UIと新UIの設計詳細分析

## 1. スタイリング・基調色の違い

### 現状UI（`app/globals.css`）
```css
--color-root: #f5f7fb;              /* ライトブルー背景 */
--color-background: #ffffff;         /* 白背景 */
--color-accent: #5865f2;            /* 紫（Discord色） */
--color-muted: #475569;             /* グレー */

.glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(36px) saturate(170%);
  border: 0.5px solid rgba(255, 255, 255, 0.22);
}
```
- **基調**: Light mode 前提、落ち着いた白・グレー・紫
- **Glassmorphism**: 薄いフロスト効果（blur 36px）
- **Glow**: CSS pseudo-element で単色 glow

### 新UI（`_new_ui_draft/styles/globals.css`）
```css
oklch色空間  →  より正確な色彩管理
Light/Dark mode の両対応
--radius: 0.625rem;  →  より一貫した角丸
```
- **基調**: Light/Dark mode 両対応、モダン
- **色彩**: oklch 色空間使用（より自然な色再現）

---

## 2. 視覚的演出の違い

### 現状UI
- ✓ シンプル・明確なレイアウト
- ✓ 既知の Lucide アイコン
- ✓ Card にはホバー時リフト効果（hover-lift）
- ✗ 背景グラデーション微量（ラジアルグラデーション）
- ✗ 色彩演出が限定的

### 新UI
- ✨ **DonationCard**: 
  - 金額ごとに異なるグラデーション（青/緑/黄）
  - 選択時・ホバー時に `drop-shadow` glow 効果
  - 円形グラデーション背景（scale アニメ付き）
- ✨ **AnimatedBackground**:
  - 複数の radial-gradient が常時アニメーション
  - ホバー対象に応じて色が変わる
  - 流体的な背景（20ms ごとに更新）
- ✨ **ConsentToggle**:
  - iOS-style トグルスイッチ
  - グリーン glow 効果

---

## 3. コンポーネント設計の違い

### 現状UI の寄付カード表示
```tsx
// DonationImpact コンポーネント使用
<DonationImpact mode="payment" amount={300} />
// → 説明的なカード（Icon + テキスト）

// 実際の寄付ボタンは Preset ループで生成
const presets = CHECKOUT_PRESETS;  // 複数の金額・期間
```
- **特徴**: 目的説明型、複数プリセット対応
- **レイアウト**: Grid レイアウトで複数表示

### 新UI の寄付カード表示
```tsx
<DonationCard 
  amount="¥300"
  frequency="一回のみ"
  gradient="blue-cyan"
  glow="blue"
  selected={selectedType === "onetime"}
  onSelect={() => setSelectedType("onetime")}
  onHoverChange={(isHovered) => setHoverColor("blue")}
/>
```
- **特徴**: ビジュアル優先型、金額・期間・色が連動
- **レイアウト**: セクション化（「一回限りの寄付」「継続的な寄付」）

---

## 4. インタラクション

### 現状UI
- ホバー: リフト（translateY -2px）
- ロード: フェードイン・ステッガー
- 選択: 色変化

### 新UI
- ホバー: スケール（scale-105）+ glow intensity up
- 背景: リアクティブに色が応答
- トグル: iOS-style アニメーション
- セクション区切り: グラデーションライン

---

## 5. 現状の強み（維持すべき）

1. **視認性**:
   - 明確なセクション分け（ログイン・同意・チェックアウト）
   - 大きな見出し＆説明テキスト
   - エラー表示が即座に見える

2. **UX**:
   - ステップが明確（フロー明示）
   - フックで既存ロジック活用
   - Checkout プリセット統合

3. **レスポンシブ対応**:
   - sm/md/lg ブレークポイント対応
   - モバイルでも崩れない

---

## 6. 新UI の美点（取り入れるべき）

1. **ビジュアル演出**:
   - DonationCard の色彩・glow 効果
   - AnimatedBackground の流動性
   - ConsentToggle の洗練されたデザイン

2. **セマンティック**:
   - セクション区分けを UI で強調
   - 金額と色を結びつける（ユーザーが選択肢を素早く理解）

3. **アニメーション**:
   - マイクロインタラクション（glow pulse, scale）
   - ホバー応答が背景に波及

4. **ページセクション化**:
   - 「一回限りの寄付」「継続的な寄付」で分割
   - 各セクション内で選択を統一管理

---

## 7. 参考情報

**現状の主要フック**:
- `useSession`: ログイン状態・表示名管理
- `useConsentMutation`: 同意状態更新
- `useCheckout`: Checkout セッション開始

**新UI の提案**:
- Props ベース設計（SSR 考慮）
- Cookie からセッション読み取り
- より詳細なローディング状態
