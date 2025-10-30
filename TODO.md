# TODO

Next ID No: 10
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

### [Bugfix] Stripe Customer 検索のHTTPメソッド修正
- **ID**: Core-Bugfix-7
- **Priority**: P0
- **Size**: S
- **Area**: Core
- **Dependencies**: None
- **Goal**: Stripe の `/v1/customers/search` 呼び出しが Cloudflare Pages Functions 全体で成功し、Donors/Consent/Checkout の Stripe 連携が 200 を返す状態にする。
- **Steps**:
  1. `functions/api/donors.ts` を中心に `/customers/search` を `GET` クエリで呼び出すよう修正し、昇順/降順はアプリ側でソートする。
  2. 同じ共通実装を利用する `functions/api/consent.ts` と `functions/api/checkout/session.ts` へも適用し、Stripe からのレスポンス処理を更新する。
  3. 既存の API テストを更新し、Stripe 呼び出しのメソッドと並び順を検証する。
- **Description**: 現状は `POST` + `order` パラメータで呼び出しており Stripe 側が 400/405 を返す。Donors 取得・Consent 更新・Checkout 開始が失敗するため、Stripe Search API の仕様に従った実装へ修正する。

### [Bugfix] Donors ページの DOM 操作安定化
- **ID**: UI/UX-Bugfix-8
- **Priority**: P0
- **Size**: XS
- **Area**: UI/UX
- **Dependencies**: Core-Bugfix-7
- **Goal**: `/donors` ページのスクリプトが主要ブラウザでエラーなく動作し、撤回後の Donors 件数表示が実際のリストと一致する状態にする。
- **Steps**:
  1. `public/donors/app.js` で `dataset` プロパティを再代入している部分を修正し、ブラウザ互換な DOM 操作にする。
  2. 撤回処理後に `donor-count` 表示を更新し、UI と内部状態の差分を解消する。
  3. UI テストを拡張し、DOM 操作エラーが発生しないことと件数更新を確認する。
- **Description**: 現状は `dataset` 再代入で `TypeError` が発生しスクリプトが停止するほか、リスト削除後も件数表示が旧値のまま残るため、撤回フローが破綻している。

### [Bugfix] Consent API のセッション更新
- **ID**: Core-Bugfix-9
- **Priority**: P0
- **Size**: S
- **Area**: Core
- **Dependencies**: Core-Bugfix-7
- **Goal**: `POST /api/consent` が同意状態変更後に最新の `sess` Cookie を返却し、Donors/Donate UI がリロード直後から正しい consent 状態を表示する。
- **Steps**:
  1. `functions/api/consent.ts` で更新後の `consent_public` と表示名を含む `sess` Cookie を再発行し、`Set-Cookie` ヘッダーを返す。
  2. Cookie 更新を前提としたユニットテストを追加し、撤回直後のセッション整合性を検証する。
  3. 必要に応じて `/donors`・`/donate` スクリプトの同意状態ハンドリングを確認し、ドキュメントへの影響があれば `docs/reference/api/consent.md` を更新する。
- **Description**: 現状は 204 応答のみで Cookie が更新されないため、同意撤回後に UI が再び「同意済み」と表示され、Donors 掲載状況と整合しない。

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
