---
title: "UI デザイントークン定義"
domain: "donation-portal"
status: "active"
version: "0.2.0"
created: "2025-11-01"
updated: "2025-11-14"
related_issues: []
related_prs: []
references:
  - docs/archives/legacy-static/styles/base.css
  - docs/plan/donation-portal/ui-refresh-2025/plan.md
  - docs/plan/frontend/glass-aesthetic-alignment/plan.md
---

# UI デザイントークン定義

Donation Portal の画面スタイルは `docs/archives/legacy-static/styles/base.css` に定義されたデザイントークンとユーティリティを土台に構築する。ここでは Stage 1 で導入したトークンの一覧と、主要コンポーネントへの適用ルールを整理する。Inter / Noto Sans JP は `next/font/local` で自己ホストしており、Cloudflare Pages / Workers などネットワーク制限下でも同一のタイポグラフィを保証する。加えて、LP ヒーローの強調コピーには Zen Kaku Gothic New（`--font-display`）を用い、日本語の視認性を高める。リード文など中程度のメッセージは `--font-noto-sans-jp` を直接参照し、トーンの統一とサイズバランスを確保する。

## タイポグラフィ

| トークン | 値 | 用途 |
| --- | --- | --- |
| `--font-sans` | `var(--font-inter), var(--font-noto-sans-jp), 'Hiragino Sans', 'Yu Gothic UI', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif` | 画面全体の既定フォントファミリ |
| `--font-display` | `var(--font-zen-kaku-gothic-new), var(--font-sans)` | LP ヒーローなど、強調コピー用の書体（700 のみ自己ホスト） |
| `--line-height-body` | `1.65` | 本文の標準行間 |
| `--line-height-tight` | `1.3` | ボタンやバッジ等の密度を高めたい要素 |
| `--line-height-display` | `1.22` | 見出し (`h1–h3`) |
| `--text-xs` | `0.8125rem` | メタ情報、タグ |
| `--text-sm` | `0.9rem` | 注釈・補足テキスト |
| `--text-md` | `1rem` | 本文の基本サイズ |
| `--text-lg` | `1.125rem` | リード文、強調段落 |
| `--text-xl` | `clamp(1.4rem, 1.1rem + 0.8vw, 1.9rem)` | セクション見出し |
| `--text-2xl` | `clamp(2rem, 1.7rem + 1.2vw, 2.7rem)` | ページタイトル、ヒーロー |

## スペーシング & シェイプ

| トークン | 値 | 用途 |
| --- | --- | --- |
| `--space-3xs` | `0.25rem` | アイコンとラベルの最小余白 |
| `--space-2xs` | `0.375rem` | メタラベル、タグ内余白 |
| `--space-xs` | `0.5rem` | 小要素の縦余白、フォーム周辺 |
### 背景レイヤ

- ルート背景は `--surface-root`（#f6f8fb）をベースに、`--accent-ambient-strong`/`--accent-ambient-soft`（いずれも 3〜5% のアルファ）を使った 2 つの radial-gradient と `linear-gradient(180deg, #fff, var(--surface-root))` を重ねる。
- `.bg-root` は上記 3 レイヤーを `background-position: 10% -8% / 92% -6% / center` で配置し、青系アクセントの面積を最小限に抑える。
- `.bg-panel` / `.bg-panel-strong` は `--surface-panel`（rgba(255,255,255,0.86)）と `--surface-panel-strong`（rgba(255,255,255,0.94)）を背景に、`var(--surface-divider*)` のボーダーと `var(--surface-glint)` の内向きハイライトでカード面を構成する。
- `.bg-gloss` は最上位の光沢レイヤで、白寄りのボーダーと `inset 0 1px 0 var(--surface-glint)` を付与し、Hero や帯状のエリアで使用する。

### ガラスユーティリティ

- `.glass` / `.glass-md` は `border-image: var(--glass-border-soft) 1` と `linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0.04))` を組み合わせ、`box-shadow: 0 1px 2px rgba(15,23,42,0.1)`（0〜2px の範囲）と `inset 0 1px 0 rgba(255,255,255,0.28)` で光沢を付ける。
- `.glass-sm` は blur を抑えた `linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04))` を使い、ミニバッジでも 0〜1px の柔らかい影に統一する。
- `.glass-lg` / `.glass-strong` は `var(--glass-border-strong)` を参照し、`backdrop-filter: blur(24px) saturate(160%)` と `inset 0 1px 0 rgba(255,255,255,0.45)` で段階的に強い光沢を演出する。
- `.glass-card` は 28px の blur と縦方向の `linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.08))` を使い、`::before` の radial ハイライトで macOS Liquid Glass に合わせた光表現を再現する。
- `.border-gradient-subtle` 自体も `linear-gradient(180deg, rgba(255,255,255,0.62), rgba(15,23,42,0.18))` の縦グラデーションに置き換え、マスクや極端な drop-shadow に頼らずアウトラインを描画する。

### ホバー / グローユーティリティ

- `.glow-accent-subtle` / `.glow-accent-medium` / `.hover-glass` / `.hover-glow` / `.cta-donate-glow` はすべて `var(--motion-duration-standard)`（260ms）のトランジションで統一し、ホバー差分は白〜グレーの `inset`/`box-shadow` だけで表現する。
- `.donate-cta-animated` はニュートラルな `var(--cta-layer-base)` レイヤを既定とし、`data-accent="primary"` のみ深いアクセントを持つ。`@media (prefers-reduced-motion: reduce)` では `::before/::after` のトランジションを落として視覚効果を抑制する。
| `--space-sm` | `0.75rem` | セクション内の段落間 |
| `--space-md` | `1rem` | カード内の基本余白 |
| `--space-lg` | `1.5rem` | カードの外側余白、スタック間隔 |
| `--space-xl` | `2.25rem` | セクション間隔、ヒーローブロック |
| `--space-2xl` | `3rem` | ページ上下の余白 |
| `--space-3xl` | `4rem` | ラージ画面でのヒーロー余白 |
| `--radius-xs` | `6px` | トグル、バッジ |
| `--radius-sm` | `10px` | 入力要素の角丸 |
| `--radius-md` | `14px` | リストカード、アラート |
| `--radius-lg` | `18px` | ページカード（`card`） |
| `--radius-xl` | `28px` | ヒーローブロック、モジュール枠 |
| `--radius-pill` | `999px` | ボタン、タグ |
| `--shadow-xs` | `0 2px 8px rgba(15, 23, 42, 0.08)` | 小型カード、ホバー時 |
| `--shadow-sm` | `0 8px 22px rgba(15, 23, 42, 0.08)` | 既定カード、ボタンの浮き上がり |
| `--shadow-md` | `0 14px 38px rgba(15, 23, 42, 0.11)` | ホバー時の主要ボタン |
| `--shadow-lg` | `0 20px 52px rgba(15, 23, 42, 0.16)` | ヒーローセクション、モーダル |

## カラーパレット

Light と Dark は `prefers-color-scheme` で自動切り替えし、同一トークン名で値のみを差し替える。

| トークン | Light | Dark | 主な用途 |
| --- | --- | --- | --- |
| `--color-bg` | `#f5f6fb` | `#0f172a` | ページ背景 |
| `--color-bg-subtle` | `#eef2f8` | `#131d35` | セクション背景 |
| `--color-surface` | `#ffffff` | `#1e293b` | カード、モーダル |
| `--color-surface-alt` | `#f8fafc` | `#15233c` | サブカード、メタパネル |
| `--color-surface-muted` | `#f1f5f9` | `#18273f` | ボタンのセカンダリ背景 |
| `--color-border` | `#d5dce7` | `#2b384f` | 基本ボーダー |
| `--color-border-strong` | `#c3ccdd` | `#38475f` | カード強調線 |
| `--color-divider` | `rgba(148, 163, 184, 0.32)` | `rgba(148, 163, 184, 0.24)` | 罫線 |
| `--color-text` | `#101828` | `#e2e8f0` | 本文 |
| `--color-text-muted` | `#475569` | `#cbd5f5` | サブテキスト |
| `--color-text-subtle` | `#64748b` | `#94a3b8` | 注釈 |
| `--color-text-inverse` | `#ffffff` | `#0f172a` | ボタン反転色 |
| `--color-accent` | `#5865f2` | 同左 | 主要アクセント |
| `--color-accent-strong` | `#4752c4` | 同左 | アクセントの濃色 |
| `--color-accent-soft` | `rgba(88, 101, 242, 0.12)` | `rgba(129, 140, 248, 0.22)` | バッジ・背景チップ |
| `--color-info` | `#2563eb` | 同左 | 情報系アラート |
| `--color-info-soft` | `rgba(37, 99, 235, 0.12)` | `rgba(96, 165, 250, 0.26)` | 情報系背景 |
| `--color-success` | `#0f766e` | 同左 | 完了ステータス |
| `--color-success-soft` | `rgba(15, 118, 110, 0.12)` | `rgba(34, 197, 94, 0.2)` | 成功背景 |
| `--color-warning` | `#d97706` | 同左 | 注意喚起 |
| `--color-warning-soft` | `rgba(217, 119, 6, 0.16)` | `rgba(251, 191, 36, 0.22)` | 注意背景 |
| `--color-danger` | `#dc2626` | 同左 | エラー状態 |
| `--color-danger-strong` | `#b91c1c` | 同左 | エラー強調 |
| `--color-danger-soft` | `rgba(220, 38, 38, 0.16)` | `rgba(248, 113, 113, 0.26)` | エラー背景 |
| `--focus-ring` | `0 0 0 3px rgba(88, 101, 242, 0.35)` | `0 0 0 3px rgba(129, 140, 248, 0.4)` | `:focus-visible` のリング |

追加で `--transition-base` (`0.18s ease`) をすべてのインタラクション・トランジションに統一して利用する。

## レイアウトユーティリティ

| クラス | 説明 | 主要トークン |
| --- | --- | --- |
| `.page` | ページ幅（`min(100%, 1120px)`）と上下余白を付与。`.page--donate` などのバリエーションは現状なし。 | `--container-width`, `--space-3xl` |
| `.page-header` | ページタイトル、リード文の縦積み。 | `--space-sm`, `--text-2xl` |
| `.layout-grid` | 2 カラム対応のレスポンシブグリッド。`.layout-grid--columns` で `768px` 以上時に 2 カラム。 | `--space-lg` |
| `.layout-stack` | 縦方向のスタック。カード群を一定間隔で配置。 | `--space-lg` |
| `.layout-cluster` | インライン要素をラップしながら等間隔に配置。ボタン群やメタ情報で使用。 | `--space-sm` |
| `.card` | 背景・角丸・シャドウを統一。`.card--muted` はサブセクション向け薄色背景。 | `--color-surface`, `--radius-lg`, `--shadow-sm` |

### Glass & Shadow ユーティリティ

| クラス | 説明 | 主な用途 |
| --- | --- | --- |
| `.glass-card` | ラジアルハイライトを重ねたガラスカード表現。`.glass-md` / `.glass-lg` と組み合わせることで立体感を強調する。 | 寄付導線（/donate）、サンクスカード（/thanks）、支援者一覧（/donors）のセクションカード |
| `.shadow-glass-elevated` | ガラスの透明感を維持したまま多層のドロップシャドウと内側ハイライトを付与する。 | App Shell のヘッダー／フッターなど常時表示されるガラスコンテナ |

## コンポーネントスタイル

| コンポーネント | 使用トークン | 備考 |
| --- | --- | --- |
| `.button` | `--radius-pill`, `--transition-base`, `.glass-*` | `button--primary` は `bg-panel-strong` + `hover-glass` により透明度／ボーダー強度のみで差分を出し、`button--secondary` は `glass-md` を共有する。`.donate-cta-animated` を重ねる場合は `data-accent="primary"` を 1 ページ 1 箇所に限定して付与し、CTA テキストは `text-white` を追加して濃色背景とのコントラストを担保する。 |
| `.alert` | `--radius-md`, `--color-*-soft` | 種別ごとに soft/border/strong トークンを組み合わせる。 |
| `.donor-card` | `--radius-md`, `--shadow-xs`, `--color-surface-alt` | Donors リスト用のカード表現。空状態は `.donor-empty`。 |
| `.checkout-action` | `.button` + `.tag` + `.button__meta` を組み合わせ、メニュー単位の補足を表示。 | `--space-3xs`, `--text-xs` |
| `.thanks-container` | `.card` 相当のラッパー。ヒーロー内で `.page-eyebrow`, `.donation-meta` を利用。 | `--shadow-sm`, `--space-xl` |

## 運用メモ

- 新しいコンポーネントを追加する場合は既存トークンの再利用を優先し、値の重複定義を避ける。
- ダークモードの値を変更する際は `@media (prefers-color-scheme: dark)` 内の同名トークンだけを更新する。差分が必要な場合は `--*-soft` など補助トークンを追加する。
- ページ単位で余白が不足する場合はまず `.page` の `padding` を調整し、局所対応はユーティリティ（`.layout-stack` 等）のギャップ調整で吸収する。
- トークンの更新時は `docs/reference/ui/style-tokens.md` の `updated` フィールドと表の値を同期させ、関連スクリーンショットを QA レポートに添付する。
- UI コピーは「Donors」ではなく「支援者」を既定表記とし、ヘッダー／CTA／同意トグルで統一する。

---
本ドキュメントは UI リフレッシュ計画 Stage 1 の成果物として保持し、継続的な UI 改修の単一参照点とする。
