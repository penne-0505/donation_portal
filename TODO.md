# TODO

Next ID No: 24
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



---

## Ready

---

## In Progress

---

# 使用法ドキュメント

### 基本原則
- タスクは、Backlog, In Progress, Readyの3つのセクションに分類される
- タスクは、タイトル, ID, Priority, Size, Area, Dependencies, Goal, Steps, Description, Plan(計画が完了したら)の各フィールドを持つ
- タスクIDは`{エリア}-{タスクカテゴリ}-{連番}`形式で一意に採番する **(連番は全カテゴリで通し番号)**
- タスクは可能な限り少ない関心事を保持するように分割され、各タスクは独立して遂行可能であることが望ましい
- タスクの内容は、他のタスクと重複しないように注意する

### タスクの移動ルール
1. Backlog
1. Ready
2. In Progress
3. 完了(削除)
  の順に移動される。各セクションの移動時に必要な条件は以下の通り。
  - `1. ~ 2.`: 
   - タスクの基本フォーマットに従っている
   - タスクの内容が他のタスクと重複していない
   - タスクの関心事が必要程度まで分解済みである
  - `2. ~ 3.`:
   - タスクの内容が明確で、実行可能な状態である
   - タスクのGoalフィールドに達成条件が記載されている
   - タスクのStepsフィールドに実行計画が記載されている
  - `3. ~ 4.`:
   - タスクのGoalフィールドに記載された達成条件を満たしている
   - タスクのStepsフィールドに記載された実行計画が完了している


### 基本運用ワークフロー

#### タスク追加時
1. 重複タスクの確認
2. タイトル, ID, Priority, Size, Area, Dependencies, Description, (Plan)を記述
3. Goalフィールドにタスクを達成とみなすための条件を記述
4. Sizeが'S'以上である場合、決定事項から現時点で推測できるおおよその段階をStepsフィールドに記述
5. タスクを、重要度・完成度・推定サイズから総合判断してBacklogもしくはReadyセクションに移動

#### タスク遂行時(行うタスクが決定済みの場合)
1. タスクをIn Progressセクションに移動
2. タスク内容やStepsを参考に、実際の行動計画を立案する
3. Stepsフィールドを完成した行動計画に置き換える
4. Goalフィールドに記載された達成条件を満たすまで、タスクを実際に遂行する
5. タスクが完了したら削除する

#### タスク遂行時(行うタスクが決定していない場合)
1. Backlogセクションから、以下の基準でタスクを選定
   - 重要度が高いもの
   - 推定サイズが小さいもの
   - 依存関係が少ないもの
2. 選定したタスクをIn Progressセクションに移動
3. タスク内容やStepsを参考に、実際の行動計画を立案する
4. Stepsフィールドを完成した行動計画に置き換える
5. Goalフィールドに記載された達成条件を満たすまで、タスクを実際に遂行する
6. タスクが完了したら削除する

### 各フィールドの説明

#### タイトル
- タスクの簡潔なタイトルを記載
- 以下の種別を含める
  - Feature: 新機能追加
  - Enhancement: 機能改善
  - Bugfix: バグ修正
  - Refactor: リファクタリング
  - Performance: パフォーマンス改善
  - Documentation: ドキュメント整備
  - Testing: テストコード追加・修正
  - Chore: 雑多な作業
- `[種別] タスク内容`の形式で記載

#### ID
- タスク識別子。
- 形式は`{エリア}-{タスクカテゴリ}-{連番}`。
- 連番はプロジェクト全体で共有され、既存の最大番号に続く値を採番する。
- 例: `Order-Bugfix-52`, `UI/UX-Enhancement-53`

#### Priority
- タスクの優先度を示す
- **P0**: 運用または開発を阻害するクリティカルな問題。即座に対応が必要。
- **P1**: 重要な機能や修正。優先的に対応が必要。
- **P2**: 中程度の重要度。計画的に対応。依存関係の親にあたるタスクはP2以上に設定。
- **P3**: 低優先度。時間があるときに対応。

#### Size
- タスクの推定サイズ・工数を示す
- **XS**: 0.5日以下の軽微な修正
- **S**: 1日で完了する小規模タスク
- **M**: 2-3日で完了する中規模タスク
- **L**: 1週間で完了する大規模タスク
- **XL**: 2週間以上の大型タスク

#### Area
- タスクが属する領域を示す
- **Core**: アプリケーションのコア機能。

- **UI/UX**: UI,UXに関するタスク。

- **Inventory**: 在庫管理featureに関するタスク。

- **Order**: 注文管理featureに関するタスク

- **Analytics**: 分析やレポート機能に関するタスク

- **Menu**: メニュー管理機能に関するタスク

- **Documentation**: ドキュメントやガイドラインの整備

- **Testing**: テストコードの追加や修正

- **DevOps**: 開発環境やCI/CDに関するタスク

#### Dependencies
- 他のタスクや機能に依存する場合は、ここに記載
- 依存関係がない場合は"None"と記載
- 依存するタスクが完了しないと着手できない場合は、Backlogセクションに移動
- 明確な記述フォーマット無し

#### Goal
- タスクを達成とみなすための条件を記載
- タスクの目的や成果物を明確にする
- 明確な記述フォーマット無し

#### Steps
- Sizeが`S`以上のタスクに対して、実際の行動計画を記載
- タスクを遂行するための具体的なステップを記載
- タスクの内容に応じて、必要な手順を詳細に記述
- `1.`のように番号を付けて、順序を明確にする

#### Description
- タスクの背景や目的、詳細な説明を記載
- タスクの内容を理解するための補足情報を提供
- 明確な記述フォーマット無し

#### Plan
- 該当タスクについての実装計画ドキュメントや、ドラフト、調査ドキュメントへのリンクを記載
- タスクの計画が完了したら記載
- 明確な記述フォーマット無し

### タスクの記述例
```markdown
### [Feature] 新規ユーザ登録機能の実装
- **ID**: Core-Feature-1
- **Priority**: P1
- **Size**: M
- **Area**: Core
- **Dependencies**: None
- **Goal**: ユーザが新規登録できるようにする。
- **Steps**:
  1. ユーザ登録フォームのUI設計
  2. バックエンドAPIとの連携実装
  3. 入力バリデーションの実装
  4. ユーザ登録後のリダイレクト処理実装
- **Description**: 新規ユーザがアプリケーションに登録できるようにする機能。ユーザ登録フォームを作成し、バックエンドAPIと連携してユーザ情報を保存する。入力バリデーションを実装し、登録後はログイン画面にリダイレクトする。
- **Plan**: [`docs/plan/core/2025-01-01-user-registration-plan.md`](docs/plan/core/2025-01-01-user-registration-plan.md)

### [Bugfix] ログイン画面のバリデーションエラー表示修正
- **ID**: UI/UX-Bugfix-2
- **Priority**: P2
- **Size**: S
- **Area**: UI/UX
- **Dependencies**: None
- **Goal**: ログイン画面でのバリデーションエラーが正しく表示されるようにする。
- **Steps**:
  1. ログインフォームのバリデーションロジックを確認
  2. エラーメッセージの表示位置を修正
  3. テストケースを追加して動作確認
- **Description**: ログイン画面でのバリデーションエラーが正しく表示されない問題を修正する。エラーメッセージの表示位置を調整し、ユーザが入力ミスを理解しやすくする。
```
