# TODO

Next ID No: 7
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

## 後でタスク定義

---

## Backlog

### [Chore] Cloudflare Pages 基盤整備 (Phase 1)
- **ID**: DevOps-Chore-1
- **Priority**: P1
- **Size**: M
- **Area**: DevOps
- **Dependencies**: None
- **Goal**: リポジトリ構成とCI/Cloudflare Pages連携が整い、開発環境でPages Functionsが起動できる状態にする。
- **Steps**:
  1. `docs/plan/donation-portal/phase-01-foundation/plan.md` のタスク3章に基づき、リポジトリ構成・設定ファイル・テンプレートを整備する。
  2. GitHub Actionsでlint/test/build/Pagesデプロイを実行するワークフローを作成し、Cloudflare Pagesと連携する。
  3. `.env.example` やセットアップ手順を用意し、ローカルでFunctionsが動作することを確認する。
- **Description**: Donation Portal MVP Phase 1の実装。モノレポ構成やCI/CD基盤を確立して後続フェーズの土台を作る。
- **Plan**: [`docs/plan/donation-portal/phase-01-foundation/plan.md`](docs/plan/donation-portal/phase-01-foundation/plan.md)

### [Feature] Discord OAuth & セッション実装 (Phase 2)
- **ID**: Core-Feature-2
- **Priority**: P1
- **Size**: M
- **Area**: Core
- **Dependencies**: DevOps-Chore-1
- **Goal**: Discord OAuthで表示名と掲示同意を取得し、署名付きCookieでセッション管理できるようにする。
- **Steps**:
  1. `docs/plan/donation-portal/phase-02-oauth/plan.md` のタスクを参照し、`/oauth/start` と `/oauth/callback` を実装してstate Cookie検証を確立する。
  2. `/donate` ページにOAuth導線と掲示同意UIを追加し、sess Cookieの値を反映する。
  3. Discord OAuth実機テストとCookie属性確認を行い、エラーハンドリングとログ出力を整える。
- **Description**: Donation Portal MVP Phase 2の実装。Stripe連携前に必要な表示名取得・同意フローを完成させる。
- **Plan**: [`docs/plan/donation-portal/phase-02-oauth/plan.md`](docs/plan/donation-portal/phase-02-oauth/plan.md)

### [Feature] Stripe Checkout & Metadata 実装 (Phase 3)
- **ID**: Core-Feature-3
- **Priority**: P1
- **Size**: M
- **Area**: Core
- **Dependencies**: Core-Feature-2
- **Goal**: Stripe Checkoutで単発/定期寄附が完了し、Customer metadataに表示名と同意が保存されること。
- **Steps**:
  1. `docs/plan/donation-portal/phase-03-checkout/plan.md` に沿って `POST /api/checkout/session` を実装し、metadata更新とバリデーションを整備する。
  2. `/donate` ページに単発/定期寄附ボタンを実装し、Checkout URLで遷移させるUIを完成させる。
  3. `/thanks` ページとStripe Test環境でのE2Eテストを実施し、エラー時のユーザ通知を確認する。
- **Description**: Donation Portal MVP Phase 3の実装。StripeをSSOTとして扱い、寄附フローを完成させる。
- **Plan**: [`docs/plan/donation-portal/phase-03-checkout/plan.md`](docs/plan/donation-portal/phase-03-checkout/plan.md)

### [Feature] Donors 掲載 & 同意管理実装 (Phase 4)
- **ID**: UI/UX-Feature-4
- **Priority**: P1
- **Size**: M
- **Area**: UI/UX
- **Dependencies**: Core-Feature-3
- **Goal**: Donorsページで同意者の表示名のみ掲示し、同意/撤回操作でStripe metadataが更新される状態にする。
- **Steps**:
  1. `docs/plan/donation-portal/phase-04-donors/plan.md` を基に `GET /api/donors` と `POST /api/consent` を実装する。
  2. `/donors` ページを完成させ、撤回リンクとキャッシュ制御(max-age=60)を組み込む。
  3. OAuth→寄附→撤回までのE2Eテストを行い、APIドキュメント草案を更新する。
- **Description**: Donation Portal MVP Phase 4の実装。同意者のみ表示するDonors体験とConsent更新APIを提供する。
- **Plan**: [`docs/plan/donation-portal/phase-04-donors/plan.md`](docs/plan/donation-portal/phase-04-donors/plan.md)

### [Feature] Stripe Webhook & 運用整備 (Phase 5)
- **ID**: Core-Feature-5
- **Priority**: P1
- **Size**: M
- **Area**: Core
- **Dependencies**: UI/UX-Feature-4
- **Goal**: Stripe Webhookが署名検証・冪等化され、Healthエンドポイントと運用手順が整備されていること。
- **Steps**:
  1. `docs/plan/donation-portal/phase-05-webhook/plan.md` に従い `POST /api/webhooks/stripe` と `GET /health` を実装する。
  2. Stripe CLIで署名成功/失敗/再送をテストし、Cloudflare Logsでイベントを確認する。
  3. Webhook運用手順と監視プロセスをドキュメントに記録する。
- **Description**: Donation Portal MVP Phase 5の実装。Stripeイベントの受信体制と軽量な運用監視を整備する。
- **Plan**: [`docs/plan/donation-portal/phase-05-webhook/plan.md`](docs/plan/donation-portal/phase-05-webhook/plan.md)

### [Chore] QA & 本番リリース準備 (Phase 6)
- **ID**: DevOps-Chore-6
- **Priority**: P1
- **Size**: M
- **Area**: DevOps
- **Dependencies**: Core-Feature-5
- **Goal**: MVP全体の総合テストを完了し、Stripe Liveキー投入と本番デプロイが安全に実施されること。
- **Steps**:
  1. `docs/plan/donation-portal/phase-06-qa/plan.md` の総合テスト計画に従い、単発/定期フロー・Donors・Webhook・Consentを検証する。
  2. Liveキー・Webhook設定・Pages本番デプロイを手順通りに実施し、少額寄附でスモークテストを行う。
  3. Runbook/FAQ/CHANGELOGを更新し、リリース結果と監視体制を共有する。
- **Description**: Donation Portal MVP Phase 6の実装。QAと本番ローンチ、運用引き継ぎの最終準備を行う。
- **Plan**: [`docs/plan/donation-portal/phase-06-qa/plan.md`](docs/plan/donation-portal/phase-06-qa/plan.md)

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
