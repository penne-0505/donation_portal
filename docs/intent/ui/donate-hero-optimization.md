---
title: Donate Page Hero Section UX Optimization - Design Decision
domain: ui
status: active
version: 1.0.0
created: 2025-11-02
updated: 2025-11-02
related_issues: []
related_prs: []
references:
  - ../../../docs/plan/donate-page-new-ui-migration.md
  - ../../../docs/reference/ui/donate-hero-section.md
  - ../../../docs/standards/ui-design-system.md
---

# ヘロセクション UX 最適化の実装意図

**対象**: `/donate` ページのヘロセクション全体  
**優先度**: A（視線集約・CTA クリック率向上）

---

## 背景

寄付ページのヘロセクションは、ユーザーが最初に目にする重要な領域です。ただし以下の課題がありました：

1. **ヘッダーCTA の可視性が一定**：ページを下にスクロールしてもヘッダー CTA の強調レベルが変わらず、ユーザーの視線がヘロセクション主要メッセージと分散
2. **タイポグラフィの静的性**：画面幅に応じた最適化が不足し、モバイルでの読みやすさに余地あり
3. **CTA と バッジの情報設計が未最適化**：寄付前の不安感（「本当に安全か？」「後で取り消せるか？」）の即時払拭が不十分
4. **テキスト表現の自然性**：日本語としての流暢さを改善の余地あり

---

## ソリューション

### 1. **ヘッダーCTA の動的出し分け** 

**実装方法**
- React Context (`HeroProvider`) で `heroInView` 状態を管理
- IntersectionObserver (threshold: 0.5) でヘロセクション可視性を検出
- ヘッダーCTA のスタイル・操作性をトグル

**効果**
- ユーザーがヘロセクションを読んでいる間は CTA は「抑制」（outline + opacity-60 + pointer-events-none）で**視線の分散を防止**
- スクロール後は CTA を「強調」（primary color + shadow）で**クリック誘導**
- 結果：主要メッセージへの集中度向上 → CTA クリック率改善予想

---

### 2. **タイポグラフィの流体化**

**実装**
```tailwind
H1:     text-3xl sm:text-5xl md:text-6xl leading-tight tracking-tight
リード: mt-3 text-base md:text-lg leading-relaxed
コンテナ: max-w-3xl mx-auto px-4
```

**効果**
- **375px 幅**: H1 が2–3行（`text-3xl` で調整）、読みやすい余白
- **768px+**: より大きく主張性強い H1（`text-5xl/6xl`）
- **全体余白**: `py-16 sm:py-20 md:py-24` で画面幅に応じた最適なバランス

---

### 3. **CTA のタップ領域・アイコン最適化**

**主CTA（ヘッダーCTA）**
- サイズ: `md` (h-11 = 44px以上) で指ガイドライン対応
- 矢印: `<ArrowRight />` を付与し、**クリック促進シグナル**を強化
- 状態表現: disable vs opacity で二段階の「弱め」を表現

**副CTA（支援者一覧）**
- テキストのみ、矢印なし（主CTA との視認性分離）
- アウトラインボタンで副要素性を視覚化

**効果**
- タップ誘発性向上（ボタンサイズの心理的効果）
- ユーザーの次アクション選択肢が明確に

---

### 4. **バッジによる即時安心情報提示**

**実装**
```tsx
<DonationBadge type="stripe" />
<DonationBadge type="oauth" />
<DonationBadge type="list" />
```

各バッジは以下を含む：
- **アイコン**: Lock / CheckCircle2 / FileText
- **ラベル**: `Stripeで安全に決済` など自然な日本語表現
- **ツールチップ**: クリック/フォーカス時に補足情報を表示
  - Stripe: `カード情報は当サービスに保存されません`
  - OAuth: `同意はいつでも取り消せます`
  - リスト: `同意した支援者のみ表示します`

**アクセシビリティ**
- `role="tooltip"` + `aria-describedby` で適切に構造化
- キーボード操作: Tab で到達、Enter で開閉、Esc で閉じる

**効果**
- ユーザーの「本当に安全か？」という心理的障壁を**段階的に**（すぐには見えない補足で）低減
- 決済躊躇の軽減 → コンバージョン率改善

---

### 5. **テキスト表現の自然化**

| 項目 | 変更前 | 変更後 | 理由 |
|------|--------|--------|------|
| H1 | 寄付のご案内 | Discordコミュニティの運営を支えるための寄付 | 主人公性・行動喚起を強化 |
| リード | (既存同) | 透明性と感謝を大切に運営しています | ユーザーとの信頼構築 |
| バッジ | Stripe Checkout で安全に決済 | Stripeで安全に決済 | 簡潔・自然な日本語表現 |

---

## 受け入れ条件（AC）

✅ **AC1**: ヘッダーCTA がヘロセクション可視時は「抑制」、不可視時は「強調」に自動で切り替わる  
✅ **AC2**: 375px幅で H1 が2–3行に収まり、CTA は折返しなし・タップ高さ≥44px  
✅ **AC3**: 主CTA のみ矢印アイコン、副CTA はテキストのみ  
✅ **AC4**: バッジにアイコン表示、補足がキーボード操作でも読める  
✅ **AC5**: 文言が仕様書に一致  

---

## 技術的判断

### Context API の選択

**理由**
- ヘロ可視状態をページ全体で共有する必要がある（app-shell ↔ donate-page-tsx）
- 将来的に `/ (home)` など他ページでも同じパターンが活用できるよう設計
- Props drilling を避けてコンポーネント間の疎結合を維持

### IntersectionObserver の threshold: 0.5

**理由**
- ユーザーが「ページ主体部分」へ移行するタイミングを検出
- threshold が低すぎると誤検知、高すぎるとラグが生じるため 0.5 が適切

### バッジの補足をクリック表示（ホバーに未対応）

**理由**
- モバイルでは「ホバー」が存在しないため、クリック・フォーカス駆動に統一
- キーボードナビゲーション対応で全ユーザーに公平なアクセスを提供
- ツールチップが常時表示だと視覚ノイズが増加するため、オンデマンド表示で効率化

---

## 参考ドキュメント

- **実装計画**: `docs/plan/donate-page-hero-optimization.md`
- **UI仕様**: `docs/reference/ui/donate-hero-section.md`
- **デザイン基準**: `docs/standards/ui-design-system.md`

---

## 次のステップ（将来検討事項）

1. **ヘッダーCTA の非表示タイミング最適化**: theme-provider やダークモードでの表現検討
2. **バッジのアニメーション**: ツールチップ表示時のアニメーション効果の追加検討
3. **他ページへの展開**: home ページ や donors ページへの適用
4. **A/B テスト**: H1 テキスト変更によるコンバージョン率改善の測定

