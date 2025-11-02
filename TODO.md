# TODO

Next ID No: 25

**(連番は全カテゴリで通し番号)**



---



Definitions to suppress Markdown warnings



[Bugfix]: #

[Feature]: #

[Enhancement]: #

[Refactor]: #

[Performance]: #

[Documentation]: #

[Testing]: #

[Chore]: #



## Backlog



### [Enhancement] LPヒーローとCTAのレイアウトを中央に調整

- **ID**: UI/UX-Enhancement-17

- **Priority**: P2

- **Size**: S

- **Area**: UI/UX

- **Dependencies**: None

- **Goal**: LPのヒーローイメージとCTAボタンが、画面の中央付近にバランス良く配置される。

- **Steps**:

  1. `app/new/donate/page.tsx` と `components/pages/donate-page.tsx` のレイアウト構造を調査する。

  2. ヒーローセクションとCTAコンポーネントを特定する。

  3. Tailwind CSSの `flexbox` や `grid`, `margin`, `padding` などを調整し、中央に再レイアウトする。

  4. `spacing` に注意し、全体のバランスを整える。

- **Description**: 現在のランディングページ（LP）では、ヒーローイメージとCTA（Call to Action）の位置が中央からずれており、視覚的なバランスが悪い。これを画面の中央付近に再レイアウトし、ユーザーの視線を自然に誘導できるようにする。



### [Enhancement] App ShellのGlass効果を維持しつつ影を強調

- **ID**: UI/UX-Enhancement-18

- **Priority**: P3

- **Size**: XS

- **Area**: UI/UX

- **Dependencies**: None

- **Goal**: HeaderとFooterのApp Shellにおいて、Glass効果を損なわずに影が少し強調され、奥行き感が表現される。

- **Steps**:

  1. `components/app-shell.tsx` のスタイル定義を特定する。

  2. `box-shadow` プロパティを調整して、影を少し濃く、または広げる。

  3. `backdrop-blur` や `background-color` とのバランスを確認し、Glass効果が損なわれないようにする。

- **Description**: 現在のApp Shell（Header, Footer）はGlass効果を適用しているが、影が弱く、コンテンツとの境界が曖昧に見えることがある。影を少し強調することで、UIに奥行きと立体感を与える。



### [Feature] Headerをスクロール追従（Sticky Header）にする

- **ID**: UI/UX-Feature-19

- **Priority**: P2

- **Size**: S

- **Area**: UI/UX

- **Dependencies**: None

- **Goal**: ページをスクロールしてもHeaderが常に画面上部に表示され、ナビゲーションのアクセス性が向上する。

- **Steps**:

  1. `components/app-shell.tsx` 内のHeaderコンポーネントのスタイルを修正する。

  2. `position: sticky; top: 0;` を適用する。

  3. `z-index` を設定し、他のコンテンツに隠れないようにする。

  4. スクロール時にレイアウトが崩れないか、他のページでも確認する。

- **Description**: ユーザーがページをスクロールした際にHeaderが隠れてしまい、ナビゲーションメニューへのアクセスが不便になる。Headerを常に画面上部に固定表示（Sticky Header）することで、サイト全体のユーザビリティを向上させる。



### [Refactor] Donateページの各セクションをカードコンポーネントで統一

- **ID**: UI/UX-Refactor-20

- **Priority**: P2

- **Size**: M

- **Area**: UI/UX

- **Dependencies**: None

- **Goal**: Donateページの各セクション（寄付金額選択、情報入力など）が、`Card`コンポーネントを使用して一貫性のあるデザインで表示される。

- **Steps**:

  1. `components/pages/donate-page.tsx` の構造を調査し、カード化すべきセクションを特定する。

  2. 各セクションが `components/ui/card.tsx` を使用しているか確認する。

  3. 使用していないセクションがあれば、`Card`コンポーネントでラップするようにリファクタリングする。

  4. カード化によってレイアウトが崩れないか確認し、必要に応じてスタイルを調整する。

- **Description**: Donateページの各コンテンツセクションが、統一されたUIコンポーネントで構成されていない可能性がある。`components/ui/card.tsx` を利用して各セクションをカード化し、UIの一貫性を高め、メンテナンス性を向上させる。



### [Enhancement] Donateページの各カードにGlass効果を適用

- **ID**: UI/UX-Enhancement-21

- **Priority**: P3

- **Size**: S

- **Area**: UI/UX

- **Dependencies**: UI/UX-Refactor-20

- **Goal**: DonateページのすべてのセクションカードにGlass効果が適用され、モダンで洗練されたデザインになる。

- **Steps**:

  1. `UI/UX-Refactor-20` が完了していることを確認する。

  2. `globals.css` や関連するスタイルファイルで、Glass効果を適用するためのCSSクラス（例: `glassmorphism`）を特定または定義する。

  3. `components/pages/donate-page.tsx` 内の各カードコンポーネントに、Glass効果用のCSSクラスを適用する。

  4. 背景との相性や可読性を確認し、必要に応じてスタイルを微調整する。

- **Description**: Donateページの各セクションをカード化した後、そのカードにGlass効果（背景のすりガラス効果）を適用する。これにより、UI全体のデザイン性を高め、モダンな印象を与える。



### [Enhancement] UI上の"Donors"表記を"支援者"に統一

- **ID**: UI/UX-Enhancement-22

- **Priority**: P2

- **Size**: S

- **Area**: UI/UX

- **Dependencies**: None

- **Goal**: サイト内のすべてのページ（特にDonorsページ、Thanksページ）で、"Donors"という英語表記が"支援者"という日本語表記に統一される。

- **Steps**:

  1. プロジェクト全体で `"Donors"` という文字列を検索する。

  2. `donors`ページ、`thanks`ページ、および関連コンポーネント内の該当箇所を特定する。

  3. "Donors" を "支援者" に置換する。

  4. ページタイトルやパンくずリストなども対象に含める。

  5. 表示崩れがないか確認する。

- **Description**: 現在、サイト内の一部のページで寄付者を指す言葉として英語の"Donors"が使用されている。ユーザー体験の一貫性を保ち、日本語話者に分かりやすくするため、これを"支援者"という日本語表記に完全に統一する。



### [Documentation] Glassmorphism表現向上のための技術調査とデザイン提案

- **ID**: UI/UX-Documentation-23

- **Priority**: P3

- **Size**: M

- **Area**: UI/UX

- **Dependencies**: None

- **Goal**: より洗練されたGlassmorphism（すりガラス効果）を実装するための具体的なCSSテクニックやデザインパターンをまとめたドキュメントが作成される。

- **Steps**:

  1. Glassmorphismの先進的な実装例をWeb上で調査する（Dribbble, Awwwardsなど）。

  2. `box-shadow`, `border`, `background-gradient`, `noise texture`, `lighting effects` などの要素を組み合わせる方法を検討する。

  3. 調査結果を基に、本プロジェクトで適用可能な複数のデザインパターンを提案する。

  4. 各パターンの実装方法（CSSコード例）と、メリット・デメリットをまとめる。

  5. `docs/survey/ui/glassmorphism-enhancement-survey.md` としてドキュメントを作成する。

- **Description**: 現在のGlassmorphism実装をさらに洗練させるため、表現力を向上させるための技術的な工夫を調査・検討する。影、境界線、グラデーション、ノイズテクスチャなどを効果的に組み合わせる方法を探求し、今後のUI改善に活かすためのデザイン提案と技術的な指針をドキュメントとしてまとめる。



---




