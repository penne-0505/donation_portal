---
title: "Glass Aesthetic Audit (2025-11-14)"
domain: "frontend"
status: "active"
version: 1
created: "2025-11-14"
updated: "2025-11-14"
related_issues: []
related_prs: []
references:
  - app/globals.css
  - docs/archives/plan/macos-ui-refinement-priority-1-6.md
  - components/ui/button.tsx
  - components/consent-toggle.tsx
---

# Glass Aesthetic Audit (2025-11-14)

## 背景
- macOS Liquid Glass の美学を目指すという `docs/archives/plan/macos-ui-refinement-priority-1-6.md` の要件に従い、Project 全体の glass 系表現がその思考に沿っているかを再確認する必要があった。特に「シャドウの最小化」「多段階の透明度」「精緻なボーダー」「光の変化によるホバー」「200-300ms の遷移」「控えめな背景」という 6 項目は何をもって逸脱と判断するかの基準となる。【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L171-L188】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L205-L206】

## 調査目的
1. `app/globals.css` に定義された glass 系ユーティリティ、背景、グロー系クラスの実装内容を一覧化する。
2. 上記の実装が macOS Liquid Glass の美学（特に 171-188 行の「現状課題」および 182-206 行の「目指す姿と palette」）と何点で齟齬を起こしているかを明らかにする。
3. 逸脱箇所ごとにどのような調整が必要かを次工程に向けて示す。

## 調査手法
- `app/globals.css` を通読し、glass utility、背景、CTA/glow、hover/transition などのセクションをピックアップ。
- 各セクションの記述（シャドウサイズ、border、背景色、トランジション、drop-shadow、グラデーション）と計画文書内の要件を照合し、逸脱/過剰と判断できるポイントを抽出。
- 逸脱ポイントには css 行番号と plan のリファレンスを添え、改善余地を構造的に整理した。

## 調査結果

### 1. 背景・アクセント色が macOS らしい“極薄”ではなく彩度の高いレイヤーになっている
- `:root` に `--color-accent: #5865f2` や補助の青/オレンジグラデーション変数を用意し、ルート背景 `.bg-root` では青・紫・ピンクの複数のラジアルグラデーションと線形グラデーションを多用している。【F:app/globals.css†L25-L33】【F:app/globals.css†L125-L154】
- 一方で macOS Liquid Glass 美学では、背景とアクセントは「白・グレー・薄色」「アクセントは 3-5% の香り」までに抑えるべきとされているため、この背景は要件 6（背景が極薄アクセント色）を上回る存在感を放ってしまっている。【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L182-L188】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L205-L206】
- 同様に `--color-accent` を Discord 系の強いブルーに寄せることで、Glass ユーティリティに手を加えなくても全体が Discord ブランド感へ傾いてしまう。macOS 美学で求められる控えめなカラーパレットからの逸脱になるため、Accent 系の色の使いどころとボリュームを再検討する必要がある。

### 2. Glass utility に負荷をかける大きいシャドウ・単色ボーダー・物理移動
- `:is(.glass, .glass-sm, .glass-md, .glass-lg, .glass-strong)` が 0 10px 40px および 0 16px 48px といった大きなドロップシャドウをベースにしており、macOS で求められる “1-2px/内側の光” の方向性と比較して明らかに過剰な浮き上がり感を与えている【F:app/globals.css†L181-L248】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L171-L188】
- 同セクションでは `border: 1px solid rgba(255, 255, 255, 0.35)` という単色ボーダーを使っており、macOS が推奨する縦グラデーション＋ボーダーイメージを用いた光の当たり表現（`border-image` など）になっていない【F:app/globals.css†L181-L247】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L183-L205】
- `components`/`plan-card` 付近で `translateY(-4px)` を含む物理的な上下移動と 0.32s の transition を与えているが、macOS Liquid Glass ではホバーは透明度・glow などの光の変化で表現し、位置を動かさないこと（および 200-300ms で統一された遷移）とされているため、不一致の典型例となっている【F:app/globals.css†L405-L424】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L176-L186】

### 3. CTA/hover/glow がカラフルなグラデーション・drop-shadow に頼っており、macOS の控えめ palette から逸脱
- `.donate-cta-animated` は多色の線形グラデーションと `donateCtaGradient` アニメーション（6 秒で色位置を動かす）を背景に走らせ、常に濃いカラーを回転させている。ただしホームページの中央 CTA のように「1 ページにつき 1 個まで、ユーザーのアクション誘導に重要なボタン」に限定すれば、派手な演出を例外的に許容する余地があると判断できる。この場合も彩度を抑えつつ 3-5% のアクセント感に収め、他の要素と共存させる設計が前提となることを明示しておきたい。【F:app/globals.css†L56-L111】
- `.glow-accent-*`, `.hover-glow`, `.cta-donate-glow` では `rgba(88, 101, 242, …)` 系の drop-shadow を hover 中に何層も適用し、強い紫/青のハロを発生させるため、macOS の「白・グレー・薄色のみ」かつアクセント色を 3-5% に抑えるという制約に対して過度にクロマティックな印象を残す。【F:app/globals.css†L336-L403】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L205-L206】
- `.hover-glass` の hover でも背景画像と drop-shadow を使って青紫系の glow を追加しており、glass state のトーンは常に Discord/CTA 系カラーに引きずられてしまうことを確認した。【F:app/globals.css†L449-L468】

### 4. トランジションの長さと種類が乱立し、macOS で求める 200-300ms の統一性を欠く
- `.transition-glass`/.hover-glow` などで 0.25s（250ms）を使っている一方、`.plan-card` は 0.32s（320ms）で transform/border を遷移させており、300ms を超えて macOS における「200-300ms で滑らかに」要件に微妙に反している【F:app/globals.css†L174-L179】【F:app/globals.css†L405-L424】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L185-L206】
- さらに `.plan-card` には `will-change: transform` が指定されているが、macOS 流の「光の変化＋高さの差分」の表現では不必要な GPU 負荷をかけやすいため、軽量化も検討してよいポイントと判断できる。

### 5. 主要なコントロールにも Discordブランドの濃いアクセントと大きなシャドウが入り込んでいる
- `components/ui/button.tsx` の `primary`/`discord` では `bg-slate-900` や `#5865f2`→`#4752c4` のグラデーション・複数の濃色 `shadow-[0_6px_20px_rgba(...)]` を使い、ボタン自体が macOS で指示されている「白・グレー・薄色＋アクセント3-5%」から大きくかけ離れている。さらに `shadow` が 6-32px と深く、Planが求める「1-2px程度の陰影・内側光」にはそぐわない重さになってしまっている【F:components/ui/button.tsx†L14-L55】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L202-L206】
- `components/consent-toggle.tsx` のトグルもチェック時に #5865f2〜#4752c4 のグラデーションと `shadow-[0_1px_3px_rgba(...)]` を与えており、スイッチ全体が Discordブランドに染まってしまう。macOSの控えめな palette ではこのような彩度の高いアクセントと陰影をコントロール全体に使うのではなく、glass surface でカバーして必要最小限に留めるべきであり、現状は金属的に響く強いブランドシグネチャが出過ぎている【F:components/consent-toggle.tsx†L24-L55】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L205-L206】

## 推奨アクション
1. `bg-root` などの背景を白・グレーを基調とした極薄のグラデーションに置き換え、アクセントは 3-5% 程度の淡い色だけを残す。必要であれば `bg-root` とは別に `bg-gloss` のようなサブトーンを用意し、Discord 系アクセントはボタン/CTA でのみ局所的に使う。【F:app/globals.css†L25-L154】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L182-L188】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L205-L206】
2. `.glass*` ユーティリティはシャドウを 1-2px、ボーダーは `border-image: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.05))` などのグラデーションに変更し、`plan-card` のホバーでは translate を外して glow/border 変化だけで差分を出す。【F:app/globals.css†L181-L248】【F:app/globals.css†L405-L424】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L171-L188】
3. `.donate-cta-animated` や `hover-*/glow-*` を極彩色グラデーションから落ち着いた blur/drop-shadow に変更し、`hover-glass` でも色をほぼ単色にしつつ、`drop-shadow` も白〜グレー系の小さい値に抑える。CTA のアニメーションも 200-300ms の範囲に入れるか消去し、背景アニメーションは `.transition-glass` と合わせてリズムを揃える。ただしホームページの中央など「ユーザーの体験上重要な操作」に限り、1 ページにつき 1 つまで濃いホバーレイヤーを例外的に残すのは許容し、それ以外の画面には極薄な光だけを適用する方向で調整する。【F:app/globals.css†L56-L111】【F:app/globals.css†L336-L468】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L185-L206】
4. トランジション時間や `will-change` 範囲を 200-300ms に統一し、GPU 負荷の高い `transform` ではなく `box-shadow`/`filter` などの光表現でレスポンスを作ることで、macOS が求める滑らかな動きとパフォーマンスの両立を図る。【F:app/globals.css†L174-L179】【F:app/globals.css†L405-L424】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L185-L206】
5. `Button` の `primary/discord` variant や `ConsentToggle` のチェック状態は Discord系の濃い色＆大型 shadow を使っているため、macOS の極薄パレットで想定される 3-5% アクセント・1-2px 陰影とそぐわない。これらコントロールも glass surface（`glass-sm` など）＋ `shadow-minimal` に切り替え、必要なら既存 accent color は内部の `border-gradient-subtle` のみで香らせる形にすることで、ボタンやトグル単位でも macOS の静謐な美学を守る。【F:components/ui/button.tsx†L14-L55】【F:components/consent-toggle.tsx†L24-L55】【F:docs/archives/plan/macos-ui-refinement-priority-1-6.md†L205-L206】
