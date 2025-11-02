---
title: 'Donation Portal UI デザインブリーフ'
domain: 'donation-portal'
status: 'active'
version: '0.1.0'
created: '2025-11-02'
updated: '2025-11-02'
related_issues: []
related_prs: []
references:
  - ../survey/donation-portal/functional-requirements-survey.md
  - ../intent/donation-portal/mvp-architecture-and-phases.md
---

## デザイン方針

**基調**: Minimal + Dark Mode Ready  
**副要素**: Micro-interactions, Glow, Glassmorphism, グラデーション  
**焦点**: 寄附という純粋な行為を邪魔しない洗練さと、細かな演出による貢献感・面白み

---

## ページ別要件

### 1. `/donate` - 寄附エントリーページ

**主要コンポーネント**:
- **ヘッダー**: グラデーションテキスト「寄附してコミュニティを応援する」
- **寄附趣旨セクション**: 「対価なし」「税控除対象外」を明示（minimal text）
- **寄附メニュー**: 3枚のカード（glassmorphic + gradient + glow）
  - ¥300 / 単発（gradient: blue→cyan, glow: blue）
  - ¥300 / 月（gradient: green→emerald, glow: green）
  - ¥3,000 / 年（gradient: amber→gold, glow: gold）
- **Discord ログインボタン**: purple glow, glassmorphic
- **ページ背景**: 選択中メニューの色から subtle radial glow（opacity 0.05～0.1）

**状態遷移**:
- 未ログイン → Discord ログインボタン表示
- ログイン後 → 表示名 + 掲示同意トグル表示
- TTL 失効時 → 再ログイン導線（inline notification）
- メニュー選択 → 選択中の card に glow intensity up + 背景 radial glow activated

**Micro-interactions**:
- Card hover: subtle elevation + glow intensity +20%
- Button click: smooth scale animation + glow pulse
- Toggle: smooth color transition + small ping effect

---

### 2. `/thanks` - 感謝確認ページ

**主要コンポーネント**:
- **タイトル**: グラデーションテキスト「ありがとうございます」（typewriter effect）
- **背景**: 中央からの radial gradient（gold/amber tint, opacity 0.08）
- **メッセージ**: 感謝テキスト（段階的フェードイン）
- **Confetti animation**: 既存 `confetti-celebration.tsx` を活用
- **Back ボタン**: `/donate` への戻り導線（pulse glow animation）

**演出効果**:
- ページ表示時に要素が上から順にスライドイン
- Confetti と同時に背景が明るくなる（achievement 感）
- 全体で 5～7 秒の演出

---

### 3. `/donors` - 公開寄附者リスト

**主要コンポーネント**:
- **ヘッダー**: 寄附者総数 + sort toggle
- **Sort オプション**:
  - `desc` (newest): 上向き矢印 + "Recently" → blue accent
  - `asc` (oldest): 下向き矢印 + "Early supporters" → cyan accent
  - `random` (shuffle): shuffle icon + "Surprise order" → purple accent
- **寄附者リスト**: 表示名のみ列挙（段階的フェードイン）
- **自分の名前**: row に inner glow + subtle highlight color
- **ガイダンス**: 「撤回ガイド」と「60秒キャッシュ遅延」を明記

**Micro-interactions**:
- リスト表示時に上からスライドイン
- 新規寄附者は最後に "new" ラベル付きで flicker
- Sort 切替時にリスト再表示アニメーション

---

### 4. `/privacy` (任意) - プライバシー・連絡先ページ

**内容**:
- 連絡先情報
- データ取扱方針（Stripe・Discord の利用範囲）
- シンプルで専門的なレイアウト

---

## Glow・Glassmorphism・グラデーション 統合仕様

### Glassmorphism

**主要な適用対象**:
- **寄附メニュー card**:
  - Light: `rgba(255,255,255,0.1) + blur(10px) + border: rgba(255,255,255,0.2)`
  - Dark: `rgba(0,0,0,0.3) + blur(10px) + border: rgba(255,255,255,0.05)`
- **ログインボタン**: 同様の glassmorphic style
- **Session timeout notification**: overlay に backdrop-filter blur(5px)

### Glow

**戦略的配置**:
- **CTA ボタン（Checkout）**: メニュー色別の radial glow
  - ¥300 単発: blue, ¥300/月: green, ¥3,000/年: amber
- **Discord ログインボタン**: purple glow
- **同意チェック**: 選択時に green glow
- **Ambient background**: ページ背景奥の very subtle radial glow（opacity 0.05～0.1）
- **Intensity調整**: Light mode 0.7x, Dark mode 1.0x

### グラデーション

**色パレット**:
- Blue→Cyan: `#3B82F6 → #06B6D4` (単発)
- Green→Emerald: `#10B981 → #34D399` (月次)
- Amber→Gold: `#F59E0B → #FBBF24` (年次)

**適用**:
- **Text gradient**: ページタイトル、主要見出し（`background-clip: text`）
- **Button gradient**: メニュー card（linear gradient 45deg）
- **Background gradient**: `/thanks` page radial gradient（中央 gold/amber, 外側 transparent）
- **Animated gradient** (optional): CTA hover 時にグラデーション方向 animate（45deg→90deg, 3～5s cycle）

---

## Dark Mode・Light Mode 対応

| 要素 | Light Mode | Dark Mode |
|-----|-----------|-----------|
| Background | #FAFAFA | #0F172A |
| Card bg (glassmorphic) | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.3)` |
| Card border | `rgba(255,255,255,0.2)` | `rgba(255,255,255,0.05)` |
| Text primary | #1F2937 | #F3F4F6 |
| Glow intensity | 0.7x | 1.0x |
| Ambient glow opacity | 0.03 | 0.08 |
| Gradient contrast | Medium | High |

---

## 実装優先度

| 優先度 | 要素 | 対象ページ |
|-------|-----|----------|
| 🔴 P1 | Glassmorphic cards | `/donate` |
| 🔴 P1 | Glow on CTA buttons | `/donate`, `/thanks` |
| 🔴 P1 | Gradient text (titles) | `/donate`, `/thanks` |
| 🟠 P2 | Micro-interactions (hover, click) | 全ページ |
| 🟠 P2 | `/thanks`演出 (typewriter + confetti) | `/thanks` |
| 🟠 P2 | Ambient radial glow background | `/donate` |
| 🟡 P3 | Animated gradients | `/donate` CTA |
| 🟡 P3 | Donor list animations | `/donors` |

---

## アクセシビリティ・パフォーマンス

- **Motion**: `prefers-reduced-motion` で animation 軽減
- **Contrast**: WCAG 2.1 AA 以上を確保
- **Glow実装**: `box-shadow` より `filter: drop-shadow()` で軽量化
- **Backdrop-filter**: 多用は避ける（GPU intensive）
- **Fallback**: glassmorphism 非対応環境では solid background color に自動フォール

---

## API・セッション連携

- **Cookie ベース**: `sess` cookie から display_name, consent_public を読取
- **API呼出**: `/api/donors?order=desc` など
- **State管理**: フロントエンド hooks で cookie 監視、変更時に UI 反映

