---
title: "UI Design System Enhancement - macOS Liquid Glass & glow effects"
domain: "donation-portal/ui"
status: "in-progress"
version: "0.1.0"
created: "2025-11-02"
updated: "2025-11-02"
related_issues: []
related_prs: []
references:
  - "docs/plan/donate-page-new-ui-migration.md"
  - "docs/plan/ui-design-brief.md"
  - "_new_ui_draft/styles/globals.css"
  - "app/globals.css"
  - "components/ui/card.tsx"
  - "components/ui/button.tsx"
  - "components/pages/donate-page.tsx"
scope:
  - "既存UIの視認性・UXの強みを維持しつつ、macOS Liquid Glass 美学とglow効果を段階的に導入"
  - "Tier 1（基盤）として、Liquid Glass utilities、shadow最小化、border グラデーション、glow 基本定義を実装"
  - "Tier 2（UX強化）として、ConsentToggle改善、ステータス表示改善、アニメーション tuning を実装"
  - "既存の視認性・UXは現状維持し、美麗さ・洗練感を優先的に向上させる"
non_goals:
  - "新UI案（`_new_ui_draft/`）の全面的な踏襲。参考程度の利用に留める"
  - "Dark Mode対応（Light Modeのみ対象。Dark Mode は将来のOptional）"
  - "AnimatedBackground など過度な動的背景の導入"
  - "複数色のglow乱用。紫（アクセント色）のみに限定"
  - "既存フック（useSession, useConsentMutation, useCheckout）の変更"
  - "Pages Functions等のバックエンド実装への影響"
requirements:
  functional:
    - "macOS Liquid Glass スタイルの基本utilities（.glass-sm, .glass-md, .glass-lg）を app/globals.css に定義"
    - "ドロップシャドウを12-32px → 1-4px に最小化し、inset light で立体感を表現"
    - "ボーダーにグラデーション効果を追加（上部より透明 → 下部より白）"
    - "ホバー・選択時のglow効果を紫色アクセント（accent: #5865f2）のみに限定"
    - "全ページのアニメーション transition を200-300ms に統一"
    - "ConsentToggleコンポーネントをmacOS style トグルに改善"
    - "ステータス表示（Success/Error Alert）に subtle glow を追加"
  non_functional:
    - "既存の視認性を損なわない（明度・コントラスト比を維持）"
    - "バンドルサイズ増加は最小限（CSS utilities のみで、JS不要）"
    - "ページロード時間（LCP）への悪影響なし"
    - "スマートフォン・タブレット・デスクトップ全サイズで美麗さを保持"
constraints:
  - "Tailwind CSS ベースの実装のみ。UI framework 追加は不可"
  - "既存の `components/ui/card.tsx`, `components/ui/button.tsx` に glow class を添付する形での実装"
  - "ページ全体の構造変更なし。CSS in globals.css と components の軽微な修正のみ"
  - "Pages Functions の JavaScript バンドル に追加の依存を入れない"
api_changes: []
data_models: []
migrations: []
rollout_plan:
  - "Tier 1（基盤構築、1-2日）"
  - "  1. app/globals.css に Liquid Glass utilities 定義（.glass-sm/md/lg, .shadow-minimal/.shadow-inner-light, .border-gradient-subtle）"
  - "  2. glow utilities 定義（.glow-accent-subtle, .glow-accent-medium）"
  - "  3. 既存 Card に .glass-md をデフォルト適用"
  - "  4. Button ホバーから大きな transform を削除"
  - "Tier 2（UX強化、1-2日）"
  - "  5. components/consent-toggle.tsx 新規作成（macOS style）"
  - "  6. ステータス Alert に glow 追加（success/error）"
  - "  7. 全体 glow 統一性チェック"
  - "  8. アニメーション transition tuning（200-300ms 統一）"
  - "Tier 3（オプション、1-2日）"
  - "  9. Dark Mode 対応（将来検討）"
  - "  10. AnimatedBackground 軽量版（オプション）"
  - "  11. Multi-layer card elevation（オプション）"
rollback:
  - "Tier 1 完了時点で git tag を作成し、途中で問題が生じた場合は即座にrevert可能にする"
  - "各CSS utility は順序を逆にして app/globals.css から削除することで完全に回復可能"
test_plan:
  unit:
    - "既存テストスイート（useCheckout, useConsentMutation等）がパス継続"
    - "ConsentToggle コンポーネントのユニットテスト追加"
  integration:
    - "donate-page.tsx での glow class 適用時の動作確認"
    - "Button, Card コンポーネント単体テスト"
  visual:
    - "ローカル dev サーバーでの目視確認（Light mode、複数デバイス幅）"
    - "Stripe Checkout Sand Box との連携フロー確認（ホバーglow が邪魔しないか等）"
  performance:
    - "Lighthouse スコア（LCP, CLS 等）の回帰確認"
    - "CSS バンドルサイズ計測（新utilities による増加量）"
observability:
  - "各CSS utility の適用状況を browser DevTools で確認（背景色、ボーダー、glow filter等）"
  - "Cloudflare Pages デプロイ後、Core Web Vitals を監視（異常な悪化がないか）"
  - "ユーザー フィードバック（GitHub Issues, Discord 等）による主観的な改善度評価"
security_privacy: []
performance_budget:
  - "CSS utilities による gzip 後のバンドル増加: 最大 5KB（現状 app/globals.css は約 2-3KB）"
  - "LCP への悪影響なし（CSS のみで JavaScript なし）"
  - "ブラウザ reflow/repaint への負荷は既存と同等（backdrop-filter は GPU加速対象）"
i18n_a11y:
  - "日本語コピー変更なし"
  - "aria属性、キーボード操作、color contrast ratio 等は既存維持"
  - "ConsentToggle の aria-checked 属性を確保"
acceptance_criteria:
  - "Tier 1 完了時に、/donate /donors /thanks ページで Liquid Glass 効果が視認可能"
  - "ホバー・選択時のglow が紫色（#5865f2）のみ表示され、他色glow なし"
  - "Lighthouse スコア（Light house audit）で LCP/CLS 回帰なし"
  - "既存テストスイート 100% パス"
  - "ローカル/プレビュー環境での目視確認で、macOS design feeling が確認可能"
  - "Tier 2 完了時に、ConsentToggle がmacOS style トグルとして動作"
  - "Tier 2 完了時に、ステータス Alert（Success/Error）にsubtleなglow が表示"
owners:
  - "penne-0505"
---

# UI Design System Enhancement - macOS Liquid Glass & glow effects

## 背景

現状のDonation Portal UIは視認性とUXに優れているが、新UI案（`_new_ui_draft/`）と比較すると、美麗さ・洗練感に差がある。新UI案のすべてを踏襲するのではなく、macOS最新（Liquid Glass）の美学とglow効果を段階的に取り入れることで、既存の強みを活かしつつ、デザインシステムをモダン化する。

### 既存UIの強み
- 明確なセクション分け（ログイン、同意、チェックアウト）
- 高い視認性と情報設計の明快さ
- 既存フック（useSession, useConsentMutation, useCheckout）で完成度の高いロジック実装
- レスポンシブ対応の堅牢性

### 新UI案の特徴
- Glassmorphism 美学（Blur + 透明度）
- グラデーション色彩（青、緑、黄）とglow効果
- アニメーション豊富（AnimatedBackground等）
- より「遊び心」のあるデザイン

### 目指す方向
- **macOS Liquid Glass** の淡さ・洗練さを取り入れ
- **glow効果** を紫（アクセント色）のみに限定し、確実な情報伝達を保つ
- 過度な動きや色彩を避け、「技術的な現代性」を表現

## 現状整理

### スタイリング現状
| 項目 | 値 |
|------|-----|
| **Glass背景** | `rgba(255,255,255,0.12)` / blur 36px |
| **ドロップシャドウ** | 12-32px（やや強い） |
| **ボーダー** | 0.5px 白 / 単色 |
| **glow** | 限定的（hover-glow pseudo で基本的） |
| **色彩** | 紫（Discord #5865f2） + グレー |

### macOS Liquid Glass の特性
| 項目 | 値 |
|------|-----|
| **Glass背景** | グラデーション（上透明、下不透明） |
| **ドロップシャドウ** | 最小化（1-2px） |
| **ボーダー** | グラデーション / 厚さ1px |
| **ホバー** | 大きな変化なし。透明度+0.02程度 |
| **色彩** | 白・グレー・淡色のみ |

## 実装戦略

### Tier 2 実装状況 (2025-11-02)

- ConsentToggle を macOS 風トグルとして実装し、`/donate` に統合（`aria-labelledby`/`aria-describedby` を付与）
- ステータスの Success/Error アラートへ `glow-status-*` ユーティリティを付与し視認性を強化
- `.transition-glass` と `--ease-glass` を追加し、主要インタラクションの遷移を 240ms・共通カーブへ統一
- `/donors` ページも含めて glow 適用範囲を精査し、ログイン状態のフィードバックを整備
- `tests/donate/consentToggle.test.ts` を新設し、`npm run test -- tests/donate/ui.test.ts tests/donate/consentToggle.test.ts` で検証済み

### Tier 1: 基盤構築（優先度 ★★★★★）

#### 1-1. Liquid Glass Utilities の定義
`app/globals.css` に以下を追加：

```css
@layer utilities {
  /* Liquid Glass - 多段階定義 */
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

#### 1-2. Shadow 最小化
```css
@layer utilities {
  .shadow-minimal {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  
  .shadow-inner-light {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
}
```

#### 1-3. Border グラデーション
```css
@layer utilities {
  .border-gradient-subtle {
    border: 1px solid;
    border-image: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.3) 0%,
      rgba(255, 255, 255, 0.1) 100%
    ) 1;
  }
}
```

#### 1-4. glow Utilities
```css
@layer utilities {
  .glow-accent-subtle {
    filter: drop-shadow(0 0 8px rgba(88, 101, 242, 0.15));
  }
  
  .glow-accent-medium {
    filter: drop-shadow(0 0 16px rgba(88, 101, 242, 0.25));
  }
}
```

#### 1-5. 既存コンポーネントへの適用
- `components/ui/card.tsx`: デフォルトで `.glass-md` を適用
- `components/ui/button.tsx`: hover から `transform: translateY(-2px)` を削除、`.glow-accent-subtle` を hover に追加
- `components/pages/donate-page.tsx`: Card 要素を確認して `.glass-md` 適用

### Tier 2: UX強化（優先度 ★★★★☆）

#### 2-1. ConsentToggle コンポーネント
`components/consent-toggle.tsx` を新規作成。macOS style トグルスイッチ。

```tsx
export function ConsentToggle({ initialValue, onChange }: ConsentToggleProps) {
  const [enabled, setEnabled] = useState(initialValue);
  
  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    onChange(newValue);
  };
  
  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-muted/50"
    >
      <div
        role="switch"
        aria-checked={enabled}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300",
          enabled ? "bg-accent" : "bg-muted",
        )}
        style={{
          filter: enabled ? "drop-shadow(0 0 8px rgba(88, 101, 242, 0.2))" : "none",
        }}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300",
            enabled ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </div>
      <label className="flex-1 text-left text-sm font-medium">公開リストへの掲載に同意する</label>
    </button>
  );
}
```

#### 2-2. ステータス表示の改善
ステータス Alert（Success/Error）に subtle glow を追加。

```css
@layer components {
  .alert-success {
    @apply glow-accent-subtle border-green-200/80 bg-green-50 text-green-700;
  }
  
  .alert-error {
    @apply glow-accent-subtle border-red-200/80 bg-red-50 text-red-700;
  }
}
```

#### 2-3. アニメーション Tuning
既存の cubic-bezier を統一。

```css
@layer utilities {
  .transition-smooth {
    transition: all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  
  .transition-smooth-lg {
    transition: all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
}
```

### Tier 3: オプション（優先度 ★★☆☆☆）

#### 3-1. Dark Mode 対応（将来検討）
oklch 色空間を活用し、Light/Dark 両対応。

#### 3-2. AnimatedBackground 軽量版（オプション）
新UI参考だが、macOS 美学では静的背景が基本。検討レベル。

#### 3-3. Multi-layer Card Elevation（オプション）
カード同士の透明度を段階化し、視覚的な奥行きを表現。

## ファイル変更一覧

### Tier 1
- `app/globals.css` - Liquid Glass utilities, shadow utilities, border utilities, glow utilities 追加
- `components/ui/card.tsx` - デフォルト class に `.glass-md` 追加
- `components/ui/button.tsx` - ホバー効果の改善（transform 削除、glow 追加）
- `components/pages/donate-page.tsx` - Card 適用の確認

### Tier 2
- `components/consent-toggle.tsx` - 新規作成
- `components/pages/donate-page.tsx` - ConsentToggle 統合、ステータスglow確認
- `components/pages/donors-page.tsx` - glow 統一性確認

### Tier 3（オプション）
- `_new_ui_draft/components/animated-background.tsx` → 軽量版で参考実装

## 実装ステータス

- 2025-11-02: Tier 1（基盤構築）を実装済み。`app/globals.css` の Liquid Glass utilities、`components/ui/card.tsx` と `components/ui/button.tsx` の適用、/donate・/donors・/thanks ページへの反映を完了。

## リスク・対策

| リスク | 対策 |
|--------|------|
| Backdrop-filter 非対応ブラウザでの表示崩れ | Fallback で単色背景を用意。既存 globals.css の処理を踏襲 |
| Shadow 最小化による立体感喪失 | inset light で代替。微細な差別化で確認 |
| glow 過度な適用による視認性低下 | 紫（accent）のみに限定。テスト時に確認 |
| CSS バンドル増加 | gzip 後 5KB 以内に抑制。Lighthouse 監視 |

## 参考資料
- Apple HIG (Human Interface Guidelines)
- macOS Big Sur+ デザイン（Liquid Glass）
- 既存 docs/plan/donate-page-new-ui-migration.md
- _new_ui_draft/ の実装参考（ただし踏襲ではなく参考程度）

---

## 補記

### なぜこの戦略か
1. **macOS 美学**: 現代的でありながら落ち着き。ノイズ最小化で「ユーザーを急かさない」フィーリング
2. **glow 限定**: 情報設計の明快さを損なわない。紫＝Discord/アクセント色で一貫
3. **段階的実装**: Tier 1 だけでも十分な改善。Tier 2, 3 は調整・確認後の追加
4. **既存強みの維持**: 視認性・UX の変更なし。CSS/Design token のみで実現

### 次アクション
1. ドキュメント承認後、`intent/` へ移行
2. Tier 1 の CSS 実装＆ローカルテスト（1-2日）
3. プレビュー環境での確認・PR 作成
4. Review → Merge → Cloudflare Pages デプロイ
