---
title: "Windows Transparency Behavior Survey (2025-11)"
domain: "frontend"
status: "active"
version: 2
created: "2025-11-11"
updated: "2025-11-11"
related_issues: []
related_prs: []
references:
  - app/globals.css
  - components/app-shell.tsx
  - app/layout.tsx
---

# Windows 環境でヘッダーが半透明にならない問題の調査

## 対応方針の更新（2025-11-11）

- Windows / macOS / Linux のアクセシビリティ設定で `prefers-reduced-transparency: reduce` が返された場合でも、サイト側で `data-force-glass="true"` を `<html>` 要素に付与し、ガラスモルフィズムを強制的に維持する方針へ転換した。【F:app/layout.tsx†L30-L36】
- `app/globals.css` の `@media (prefers-reduced-transparency: reduce)` フォールバックは `data-force-glass` 属性が存在しない場合にのみ適用されるよう制限したため、既定では半透明表現が保持される。【F:app/globals.css†L520-L527】
- 上書き方針によりアクセシビリティ設定を無視するため、透明効果を抑えたい利用者には別途配慮（例: 個別の「低透過モード」トグル）が必要となる。今後のデザイン検討時に考慮すること。

## 背景

- 寄付ポータルのトップページおよび共通レイアウトでは、`glass-sm` ユーティリティクラスと `backdrop-filter` を用いたガラスモルフィズム表現を採用している。【F:components/app-shell.tsx†L27-L63】【F:app/globals.css†L201-L255】
- Windows 11 の一部環境（Chrome / Edge 最新版を含む）で閲覧した際、ヘッダーやフッターが半透明ではなく白い単色背景で描画される事象が報告された。

## 調査目的

1. Windows 環境においてガラスモルフィズムが失われる要因を特定する。
2. 既存スタイルシートの挙動とブラウザの互換性を踏まえ、修正の可否と代替案を整理する。

## 調査手法

- `app/globals.css` 内で `glass-*` 系クラスおよびヘッダー向けスタイルに適用されている `@supports` / `@media` クエリを確認し、フォールバック条件を精査した。【F:app/globals.css†L201-L279】【F:app/globals.css†L501-L512】
- Windows 11（23H2）の「設定 → 個人用設定 → 色」にある **透明効果** の ON/OFF がブラウザの `prefers-reduced-transparency` メディアクエリに与える影響を確認した。透明効果が OFF の場合、Chrome/Edge が `reduce` を返すことをブラウザの DevTools で検証した（2025-11-11 時点）。
- `backdrop-filter` 未対応ブラウザ（古い EdgeHTML, Windows High Contrast モード等）で想定される `@supports not (backdrop-filter: blur(1px))` のフォールバックも併せて確認した。

## 調査結果

### 1. アクセシビリティ設定により `prefers-reduced-transparency: reduce` が返る

- Windows 11 で「透明効果」を無効にすると、Chromium 系ブラウザが `prefers-reduced-transparency: reduce` を報告する。現行 CSS ではこの条件に一致した場合、`glass-*` クラス全体で `backdrop-filter` を無効化し、背景色を `rgba(255, 255, 255, 0.85)` に切り替えるフォールバックが適用される。【F:app/globals.css†L501-L512】
- ヘッダーおよびフッターは `glass-sm` クラスを使用しているため、アクセシビリティ設定を尊重した結果として白い背景になる。これは仕様どおりの降格であり、Windows 特有の挙動というより **OS レベルで透過効果を減らす設定を有効にした利用者向けの意図的フォールバック** である。

> **2025-11-11 更新**: `data-force-glass="true"` を適用した現在の実装では、既定状態でこのフォールバックは発動しない。将来的にユーザー向けに透過無効化オプションを提供する場合は、`data-force-glass` 属性の制御を UI レベルで切り替えることを想定する。

### 2. `backdrop-filter` 非対応ブラウザでも同様に白背景へフォールバックする

- `@supports not (backdrop-filter: blur(1px))` の分岐でも `glass-*` の背景が `rgba(255, 255, 255, 0.85)` に変更されるため、GPU アクセラレーションが無効化された環境や旧 Edge/IE などで閲覧した場合も同じく白背景となる。【F:app/globals.css†L501-L507】
- この場合もアクセシビリティ確保を目的としたデザイン降格であり、現時点の CSS では半透明表現を維持する手段は用意されていない。

## 原因の整理

| 症状 | トリガー条件 | 現行 CSS の挙動 | 備考 |
| --- | --- | --- | --- |
| 半透明が無効化され白背景になる | Windows で「透明効果」を OFF (=`prefers-reduced-transparency: reduce`) | `glass-*` クラスが `backdrop-filter: none` + 不透明白背景にフォールバック | アクセシビリティ設定に従った降格 |
| 半透明が無効化され白背景になる | `backdrop-filter` 未対応 / 無効化ブラウザ | `@supports not` セクションにより同様のフォールバック | レガシー互換のために意図的に設定 |

## 修正可能性の検討

### 1. アクセシビリティ設定を尊重したまま視覚的コントラストを調整する

- `prefers-reduced-transparency` でのフォールバック色を純白ではなく、背景とのコントラストを保ちながらも若干透け感を演出する中間色（例: `rgba(255,255,255,0.7)` や淡いグラデーション）に変更することは可能。
- ただし `backdrop-filter` は使用できないため、背景画像と同様の視覚効果を完全に再現することはできない。半透明感を演出するには **ボーダーやシャドウのトーン調整** を追加する必要がある。

### 2. OS 設定を無視して `prefers-reduced-transparency` を上書きする

- JavaScript でメディアクエリ結果を監視し、ユーザー設定に関わらず `backdrop-filter` を適用することも技術的には可能だが、アクセシビリティ要件（透明効果を減らしたい利用者）に反するため推奨できない。

### 3. Windows 特化の条件分岐

- `@media (prefers-color-scheme: light)` 等と組み合わせて OS 判別を試みることもできるが、ブラウザ標準の判定では Windows 固有の識別子が提供されないため、CSSのみで Windows のみ別処理とすることは困難。
- ユーザーエージェント判定による分岐は保守負荷および将来の互換性リスクが大きいため、避けることが望ましい。

## 推奨方針

1. 現状はガラスモルフィズムを常に維持するため、`data-force-glass` 属性を UI トグルやクッキー設定で制御する仕組みを今後検討し、透明度を低減したいユーザーにも選択肢を提供する。
2. 将来的にアクセシビリティとビジュアルを両立させるため、`prefers-reduced-transparency` を尊重するモードと強制モードの両立をデザインシステムで検証する。
3. Windows / macOS / Linux それぞれで透明効果設定を切り替えながら E2E テストを行い、`data-force-glass` 属性の効き方を継続的に確認する。

## 追加で必要な検討事項

- ガイドライン上、アクセシビリティ設定を尊重することが必須かどうか（UI デザインチームとの合意形成）。
- `prefers-reduced-transparency` を考慮したデザインシステムのトークン整備（`--color-surface-opaque` など）。
- `@supports not (backdrop-filter: ...)` と `prefers-reduced-transparency` の両方に同一フォールバックを適用しているが、**ブラウザ互換性とアクセシビリティで別のフォールバックを採用するべきか**。

