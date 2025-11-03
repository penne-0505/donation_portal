---
title: 'Donation Portal 機能要件サーベイ'
domain: 'donation-portal'
status: 'active'
version: '0.1.0'
created: '2025-11-02'
updated: '2025-11-02'
related_issues: []
related_prs: []
references:
  - ../../intent/donation-portal/mvp-architecture-and-phases.md
  - ../../reference/api/checkout.md
  - ../../reference/api/consent.md
  - ../../reference/api/donors.md
  - ../../guide/auth/discord-oauth.md
  - ../../reference/payments/webhook-signature.md
  - ../../../README.md
  - ../../archives/draft/requirements_definition.md
---

## 背景

Donation Portal の機能実装は Intent ドキュメントを起点に段階的に進められてきたが、現時点での機能要件を横断的に把握できる一次資料が不足している。特に Stripe 連携・Discord OAuth・Donors 掲載ポリシーは複数ドキュメントに分散しており、開発・運用メンバーが前提を素早く共有するには整理が必要となった。

## 目的

- MVP リリース時点で求められる機能要件を俯瞰し、今後の変更検討や監査に備える。
- Intent / Reference / Guide で定義された仕様のうち、ユーザー体験と API 群に直接影響する項目を集約する。
- 後続の plan / intent 更新時に差分を検知しやすい基準点を提供する。

## 手法

- Intent `donation-portal/mvp-architecture-and-phases` を中心に、API リファレンス・OAuth ガイド・旧要件定義書の内容を突合。
- Cloudflare Pages / Stripe / Discord の各連携ポイントについて、仕様・制約・非対象事項を洗い出し。
- 既存ドキュメントの記述が曖昧な部分は、実装コード（Functions, Next.js UI）のディレクトリ構成と README を補助資料として参照。

## 調査結果

### ユーザーフローと UI 要件

- `/donate` は寄付趣旨と注意書き（対価なし・税控除なし）を掲示し、Discord OAuth を起点に寄付者表示名と掲示同意を取得する。単発（¥300）および定期（月額 ¥300 / 年額 ¥3,000）の寄付メニューを提示。
- OAuth 完了時に `sess` Cookie を発行し、UI 上で表示名と掲示同意の状態を即時反映する。TTL は 10 分で、失効後は再ログインを要求。
- Stripe Checkout 完了時は `/thanks` へ遷移し、感謝メッセージのみを表示する。特典・順位・額面に関する要素は一切含めない。
- `/donors` は掲示同意を得た表示名だけをリスト列挙する。順序は API の `order` パラメータ（降順/昇順/ランダム）に追従し、撤回導線（OAuth 再実行→consent 更新）を提示する。
- `/privacy` ページは任意だが、問い合わせ先とデータ取扱い方針を簡潔に記載することが期待されている。

### Stripe 連携と決済要件

- 寄付はすべて Stripe Checkout で処理し、カード決済のみを提供。成功時は Stripe レシート以外の通知を送付しない。
- Stripe Customer metadata を SSOT とし、`display_name`, `display_name_source=discord`, `discord_id`, `consent_public` を必須項目として保持する。自前データベースは導入しない。
- `mode` と `interval` の組合せを厳密にバリデートし、単発 (`payment`) と定期 (`subscription` 月次/年次) の整合性を保証する。
- Checkout からの復帰は `success_url=/thanks`、`cancel_url=/donate` 固定。キャンセル後に再度 OAuth を求めることで metadata の整合性を保つ。
- Stripe Webhook (`payment_intent.succeeded`, `invoice.paid`) は event.id 単位で冪等化し、処理後は 200 を即時返却。署名検証が必須で、不一致時は 400 で拒否する。

### OAuth・セッション管理要件

- `GET /oauth/start` で `state` Cookie（HMAC-SHA256, Base64URL, TTL 600 秒）を生成し、Discord 認可画面へリダイレクトする。
- `GET /oauth/callback` は `state` の TTL・署名・nonce を検証し、Discord API `identify` スコープから取得した `global_name`（なければ `username`）で表示名を確定。`sess` Cookie（同 TTL・署名方式）に `display_name`, `discord_id`, `consent_public` を格納する。
- Cookie は `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/` を必須属性とし、キー管理は Cloudflare Pages の Secrets で一元化する。
- セッション更新時は最新の掲示同意を `sess` に反映し、UI 側は Cookie の状態でトグル表示を制御する。

### バックエンド API 機能要件

#### `POST /api/checkout/session`

- 認証: Discord OAuth セッション Cookie `sess` が必須。
- リクエスト: `mode`, `interval`, `variant` の組み合わせで単発/定期の寄付メニューを識別。想定外の組み合わせは 400 を返却。
- 副作用: 対応する Stripe Customer を `metadata.discord_id` で検索し、存在しない場合は新規作成。表示名と掲示同意を metadata に保存してから Checkout Session を生成する。
- レスポンス: Checkout URL を 200 で返す。Stripe API 失敗時は 500。

#### `POST /api/consent`

- 認証: `sess` Cookie。
- リクエスト: `consent_public` を真偽値で受け取り、Stripe Customer metadata を更新する。Discord 情報も同時に上書きし SSOT を維持。
- レスポンス: 204 No Content。対象 Customer が存在しない場合は 404。

#### `GET /api/donors`

- 認証: なし（公開 API）。
- 機能: Stripe から `consent_public=true` の Customer を取得し、空白トリム済みの表示名配列と同意者総数を返す。
- パラメータ: `limit`（1〜200, 既定100）, `order`（`desc`/`asc`/`random`）。バリデーション違反は 400。
- キャッシュ: 降順/昇順は `Cache-Control: public, max-age=60`、ランダムは `max-age=0` で 60 秒以内の新鮮さを担保。

#### `POST /api/webhooks/stripe`

- 認証: `Stripe-Signature` ヘッダーによる HMAC-SHA256 署名検証。秘密鍵は Pages Secrets 管理。
- 機能: 対象イベントのみ処理し、それ以外は 200 で受理ログのみ残す。イベント内容は今後の拡張のために記録するが、即時の副作用は限定的。
- 冪等性: `event.id` を短期キャッシュし再送を検出。重複時は処理をスキップしても 200 を返す。

#### その他エンドポイント

- `GET /oauth/start` / `GET /oauth/callback`: セッション確立と Discord 認可フローを実現。
- `GET /health`: Pages Functions の稼働監視用に 200 を返す軽量エンドポイント。

### 非対象・制約事項

- 対価・特典・ロール付与などインセンティブ要素は一切提供しない。寄付額やランキング表示も禁止。
- 独自メール送信は行わず、Stripe レシートのみで通知する運用を維持する。
- カスタムドメインは利用せず `*.pages.dev` を継続。固定費ゼロを前提に設計。
- データ保管は Stripe に限定し、ローカルや外部データベースを導入しない。PII 取扱いは Stripe 管理下に置く。
- Cloudflare Pages で `nodejs_compat` を有効化し、Pages Functions の Node.js API 利用を担保する（ビルドスクリプトで metadata.json を生成）。

### 利用者が行える操作と必要な UI 表示

- `/donate`
  - 寄付の趣旨と「対価なし」「税控除対象外」である旨を掲示。
  - Discord 連携開始ボタンを表示し、ログイン後は取得した表示名と掲示同意チェック状態を表示・切替できる。
  - 単発 ¥300、定期（月 ¥300 / 年 ¥3,000）メニューの選択肢と Checkout 開始ボタンを用意。
- OAuth 完了後
  - `sess` Cookie の内容に基づき、表示名と同意状態をフロントで即時反映。
  - TTL 失効時は再ログインを促すメッセージと導線を表示。
- `/thanks`
  - 決済完了メッセージと、必要であれば `/donate` への戻りリンクを表示（特典・額面表示は不要）。
- `/donors`
  - `GET /api/donors` の結果をリスト表示し、件数と表示名を掲載。
  - 掲示撤回を希望する利用者向けに、Discord に再ログインして同意を変更する導線を案内（キャッシュ遅延が最大 60 秒程度である旨を併記）。
- `/privacy`（任意）
  - 連絡先とデータの取り扱い方針、Stripe と Discord の利用範囲を簡潔に提示。

## 考察

- Intent で定義された要件は API リファレンスと整合しており、Stripe metadata を単一ソースにする設計が徹底されている。一方で UI 文言（対価なし・税控除なし）の最終確認先がコードベースに依存しているため、今後 guide/reference の整備が必要。
- Donors 掲載は 60 秒キャッシュを前提としており、即時反映を期待する運用とのギャップが生まれる可能性がある。サポート向け Runbook での注意喚起が望まれる。
- Webhook の処理は最小限のログ記録に留まっているため、将来的な通知や自動化を追加する際は intent の更新が必須になる。

## 推奨アクション

1. `/donate` の注意書きと `/privacy` ページの記載内容をガイド文書へ明文化し、UI 実装と乖離しないよう整備する。
2. Donors 掲載のキャッシュ仕様と撤回 SLA を運用ドキュメントに追記し、サポート対応の期待値を合わせる。
3. Webhook 拡張（通知・非同期処理）を検討する際は、本サーベイを基に intent/survey を更新し、冪等要件とセキュリティ制約を再確認する。
