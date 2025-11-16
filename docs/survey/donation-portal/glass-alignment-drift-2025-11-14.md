---
title: "Glass Alignment Drift Survey (2025-11-14)"
domain: frontend
status: active
version: 1
created: "2025-11-14"
updated: "2025-11-14"
related_issues: []
related_prs: []
references:
  - docs/draft/ui/glass-alignment-screenshot-assessment.md
  - docs/plan/frontend/glass-aesthetic-alignment/plan.md
  - app/globals.css
  - components/ui/button.tsx
  - components/ui/card.tsx
  - components/app-shell.tsx
  - components/donate/session-panel.tsx
  - https://developer.apple.com/design/human-interface-guidelines/materials
---

# Glass Alignment Drift Survey (2025-11-14)

## 背景
- `docs/draft/ui/glass-alignment-screenshot-assessment.md` ではヒーロー UI が macOS Liquid Glass の 6 原則をほぼ満たしていると評価されていたが、最新スクリーンショット群（/donate, /donors, /thanks, / ランディング）では光沢や彩度が大きく強調され、当初の目標と乖離している。
- 直近 plan `Glass aesthetic alignment` は「背景を極薄化し、shadow を 1-2px に抑え、CTA アクセントは 1 箇所限定」と要求しているため【F:docs/plan/frontend/glass-aesthetic-alignment/plan.md†L21-L34】、スクリーンショットの状態が許容範囲かを再調査した。

## 調査目的
1. スクリーンショットで視覚的に目立つ違和感を列挙し、macOS Liquid Glass 原則と照合して逸脱度合いを定義する。
2. 逸脱の原因になっている token / utility / component 実装を突き止める。
3. ドキュメントフロー（plan→intent→guide）で反映すべき修正インパクトを整理し、次アクションへ渡す。

## 調査手法
- `/donate`・`/donors`・`/thanks`・トップページのスクリーンショットを比較し、「背景の淡さ」「shadow の大きさ」「hover の動き」「CTA アクセント件数」を macOS HIG (Materials) や既存 plan の要件と突き合わせた。【HIG:materials】
- `app/globals.css`・`components/ui/*`・`components/app-shell.tsx` を参照し、見た目に反映されているユーティリティ構成と CSS token 値を特定。
- 2025-11-14 時点の draft / plan をリファレンスし、「本来あるべき境界条件」との差分を整理。

## 調査結果

### 1. ルート背景がピンク〜ブルーの帯で埋まり、求めていた「白＋3-5% アクセント」を満たしていない
- スクリーンショットではヘッダー上部とフッター周辺が濃いピンクからブルーに塗られており、ガラスパネルより背景の方が目立つ。これは `.bg-root` が 2 本の巨大なラジアルグラデーションを常時敷いており、`--accent-ambient-strong` に 7% 透明度のディスコードブルーを使っていることが原因。【F:app/globals.css†L25-L37】【F:app/globals.css†L177-L188】
- plan では「背景トークンをホワイト/グレー基調 + アクセント 3-5% に整理し、既存 `.bg-root` の濃いグラデーションは archive する」と明記されているため、現状は要件を満たさない。【F:docs/plan/frontend/glass-aesthetic-alignment/plan.md†L31-L34】
- 背景が強く彩度を持つため、パネル自体が暗くつぶれ、macOS HIG の「Material は背景との subtle なコントラストで層を作る」という原則にも反する。【HIG:materials】

### 2. Card / Header 表面の shadow とハイライトが厚く、macOS が求める 1-2px 影や精緻ボーダーから逸脱している
- `Card` コンポーネントは `glass-card glass-md` を必ず重ねており、`glass-card` 側で `0 2px 6px` の外側 shadow と不透明度 0.55 のラジアルハイライトを描画しているため、スクリーンショットの各パネルが立体的な「灰色タイル」のように見えている。【F:components/ui/card.tsx†L16-L60】【F:app/globals.css†L225-L300】
- ナビゲーションバーやモバイルメニューも同じ `glass-sm + border-gradient-subtle + shadow-minimal` を積んでいるため、画面上部が 3 層のバブルで重く見える。【F:components/app-shell.tsx†L109-L200】
- plan は `.glass*` の box-shadow を 0-2px に抑えること、hover は物理移動ではなく光/透明度で扱うことを要求しているため、影・ハイライトの強さは要件を超過している。【F:docs/plan/frontend/glass-aesthetic-alignment/plan.md†L21-L34】

### 3. CTA / ボタンのアクセントが複数箇所に広がり、濃色グラデーションも macOS 美学から逸脱
- 中央 CTA だけでなく、ヘッダーの「寄付する」ボタンや Discord ログイン用ボタンがそれぞれ `primary` variant または `discord` variant で塗り分けられ、`discord` では #5865f2 と 0 12px 32px の drop-shadow を常時出すため、「1 ページ 1 箇所」のアクセント制限が破られている。【F:components/ui/button.tsx†L14-L52】【F:components/app-shell.tsx†L109-L144】
- `donate-cta-animated` 自体も `rgba(16,21,36,0.95)` から始まる黒に近いグラデーションと 0 2px 12px の shadow を使っており、ライトテーマでの CTA が「ほぼ黒い塊」として表示されている。【F:app/globals.css†L74-L162】
- plan では CTA アクセントの濃色バリエーションを `data-accent="primary"` を持つ 1 要素に限定する方針だったが、実装側では variant ごとに自由な色を許容しているため統制できていない。【F:docs/plan/frontend/glass-aesthetic-alignment/plan.md†L21-L34】

### 4. ステータス系 glow（成功/エラー）が強い彩度で常時発光し、画面が警告色に支配される
- 寄付フローの成功/エラー表示、セッション警告、支援者リストのエラー表示はいずれも `glow-status-success` / `glow-status-error` を利用し、境界線＋ 20-30px 程度の緑/赤グローを放っている。【F:components/donate/session-panel.tsx†L37-L90】【F:app/globals.css†L485-L501】
- これらは本来 plan で「glow-accent-* は白〜グレー主体の微弱 glow」と定義されていた範囲 (3-5% のアクセント) を超えた彩度であり、macOS HIG で推奨される “ニュートラルな情報レイヤー” を阻害している。【F:docs/plan/frontend/glass-aesthetic-alignment/plan.md†L21-L34】【HIG:materials】
- スクリーンショットでは `/donate` の同意パネルや `/donors` のエラーが真っ赤に光っており、淡いガラスの意図が失われている。

### 5. ベースアニメーションが 0.5-0.6s + translate で動いており、「物理移動なし・200-300ms」条件を満たさない
- `page-enter` / `fade-in-up` / `bounceIn` は 0.5-0.6 秒のアニメーションで `translateY` や `scale` を適用し、初期描画時に画面全体が持ち上がる。スクリーンショットと併せて確認すると、ヒーローやサマリカードがロード時に上下へ物理移動してから止まる挙動になっている。【F:app/globals.css†L530-L603】
- plan のゴールは「hover/interaction は光と透明度のみ」「duration は 200-300ms で統一」と書かれており、macOS HIG でも view がスライドするより subtil な透明度変化を推奨しているため、現状は要件から外れている。【F:docs/plan/frontend/glass-aesthetic-alignment/plan.md†L21-L34】【HIG:materials】

## 推奨アクション
- 背景 token (`--accent-ambient-*`, `.bg-root`) を 3-5% 以内に再定義し、radial-gradient を archive。plan の Phase 1 作業として `surface` パレットを白/グレー中心に戻す。
- `Card`・`glass-*` ユーティリティを見直し、box-shadow を max 2px・radial ハイライト削除・border-image を薄いグラデーションへ縮退させる。Header / フッターも同じユーティリティを参照しているため一括置換する。
- Button variant / glow ユーティリティを再設計し、`data-accent="primary"` のみ濃色グラデーションを許可。他 variant は透明度差と輪郭で表現し、Discord ボタンなどブランド色が必要な場合はアクセント数を算出できるよう lint ルールも検討する。
- `glow-status-*` と `page-enter` 系アニメーションを macOS ガイドライン準拠の微弱演出 (200-300ms / transform 無し) へ置換し、docs/reference/ui/style-tokens.md に更新予定の token と整合するよう plan→intent 更新を準備する。
