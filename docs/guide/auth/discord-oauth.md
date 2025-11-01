---
title: 'Discord OAuth フロー運用ガイド'
domain: 'donation-portal'
status: 'active'
version: '0.1.1'
created: '2025-10-30'
updated: '2025-10-31'
related_issues: []
related_prs: []
references:
  - ../../plan/donation-portal/phase-02-oauth/plan.md
  - ../development/setup.md
---

## 概要

Discord OAuth を利用して寄附者の表示名と掲示同意を取得し、Stripe 連携前のセッション情報を整えるための手順を整理します。`GET /oauth/start` で state Cookie を発行し、Discord 認可後に `GET /oauth/callback` が sess Cookie を生成して `/donate` に戻すフローを前提とします。

### フロー全体像

1. `/donate` から掲示同意（`consent_public`）の入力と共に `GET /oauth/start` へ遷移。
2. Functions が `state` Cookie を生成し、Discord 認可エンドポイントへ 302 リダイレクト。
3. ユーザーが認可すると Discord から `code` と `state` が返却され、`GET /oauth/callback` にアクセス。
4. Callback で state 署名と TTL を検証し、Discord API で `id` と `global_name`（無い場合は `username`）を取得。
5. `sess` Cookie を発行し、`/donate` に 302 で戻して UI に表示名と同意ステータスを反映。

> **補足**: Stripe 連携前の段階では `sess` Cookie を Checkout metadata に転記する処理は実装しません。Phase 3 での利用を想定しています。

## Cookie 仕様

### state Cookie

| 項目 | 内容                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| 名前 | `state`                                                                                                       |
| 値   | JSON を Base64URL エンコードした文字列（例: `{ "nonce": "...", "consent_public": true, "exp": 1730257200 }`） |
| 署名 | `HMAC-SHA256(JSON)` を Base64URL エンコードし、値と結合（`<payload>.<signature>`）                            |
| TTL  | 600 秒（10 分）                                                                                               |
| 属性 | `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=600`                                                 |
| 用途 | Discord 認可開始時の改ざん検知と TTL 管理                                                                     |

- `nonce` は 16 バイト以上のランダム値を生成し、一度使用した値は再利用しない想定です。
- 署名には `.env` / Cloudflare Secrets の `COOKIE_SIGN_KEY`（32 文字以上のランダム英数字）を利用します。
- TTL 超過や署名不一致時は 401（`state_invalid`）で `/donate?error=state_invalid` にリダイレクトする運用とします。

### sess Cookie

| 項目 | 内容                                                                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 名前 | `sess`                                                                                                                                          |
| 値   | `{ "display_name": "<Discord 表示名>", "discord_id": "<ユーザーID>", "consent_public": true, "exp": 1730257500 }` を JSON 化し Base64URL + 署名 |
| TTL  | 600 秒（10 分）                                                                                                                                 |
| 属性 | `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=600`                                                                                   |
| 用途 | `/donate` の UI 状態管理と Stripe metadata 連携の前準備                                                                                         |

- `display_name` には Discord の `global_name` を優先し、未設定なら `username` を保存します。
- TTL は Phase 2 実装時点で 10 分です（Phase 3 で要件を再評価予定）。
- 署名方式とキーは state Cookie と同一です。ローテーション時は両 Cookie を同時に破棄します。

## エラーハンドリング

| 事象                                    | 検知ポイント          | ユーザー向け動作                                                            | ログ/対応                                          |
| --------------------------------------- | --------------------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| state 署名不一致                        | `GET /oauth/callback` | `/donate?error=state_invalid` に 302、UI で「もう一度ログインしてください」 | `warn` ログに `requestId` とエラー種別のみ記録。   |
| state TTL 失効                          | `GET /oauth/callback` | `/donate?error=state_expired` へリダイレクト                                | `warn` ログと共に `nonce` を破棄。                 |
| state パラメータ不一致                  | `GET /oauth/callback` | `/donate?error=state_mismatch` に遷移                                       | `error` ログに差分のみ記録（コード等は残さない）。 |
| OAuth リクエスト欠落 (`code` / `state`) | `GET /oauth/callback` | `/donate?error=invalid_request` に遷移                                      | `error` ログ（パラメータ欠落のみ記録）。           |
| Discord トークン交換失敗                | Discord API           | `/donate?error=discord_token_error` へ遷移し UI で再ログインを案内          | `error` ログ（HTTP ステータスのみ記録）。          |
| ユーザー情報取得失敗                    | Discord API           | `/donate?error=discord_user_error` に遷移                                   | `error` ログ。必要なら Discord 側の状態を確認。    |
| Cookie 署名キー不足                     | Functions             | start: 500 応答 / callback: 例外発生（Pages 側で 500）                      | Secrets 設定を再確認し、キーを登録後に再デプロイ。 |

- エラーコードは UI とドキュメント（FAQ/Runbook）で共通化し、Pages Functions から返すクエリパラメータも統一します。
- 重大障害（Discord API ダウン、署名キー漏洩など）が発生した場合は TODO リストにある運用タスク（Core-Feature-5 以降）で定義される Incident 手順に従います。

## Secrets 設定手順

### ローカル `.env`

1. `.env.example` をコピーして `.env` を作成します。
2. 以下の値を設定します。
   - `DISCORD_CLIENT_ID`: Discord Developer Portal のアプリケーション ID。
   - `DISCORD_CLIENT_SECRET`: OAuth2 クライアントシークレット。
   - `DISCORD_REDIRECT_URI`: ローカル検証では `http://localhost:8788/oauth/callback` を使用。
   - `COOKIE_SIGN_KEY`: 32 文字以上のランダム英数字（1 回生成したら Secrets Manager で保管）。
3. `npm run dev` を実行し、`GET /oauth/start` → Discord 認可 → `GET /oauth/callback` の順で動作を確認します。

### Cloudflare Pages Secrets

1. Cloudflare ダッシュボードで対象 Pages プロジェクトを開き、**Settings → Environment variables** を選択します。
2. `Production` と `Preview` の両方に以下を **Environment Variables (Secrets)** として登録します。
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `DISCORD_REDIRECT_URI`（本番はカスタムドメインが無い場合 `https://<project>.pages.dev/oauth/callback`）
   - `COOKIE_SIGN_KEY`
   - `APP_BASE_URL`（Pages の本番 URL）
3. 保存後に `wrangler pages publish` もしくは GitHub 連携によるデプロイを実行すると、Functions から `env.DISCORD_CLIENT_ID` などを参照できます。
4. Secrets を更新する場合は再デプロイが必要です。キーをローテーションした場合は古い Cookie を無効にするため Cloudflare ダッシュボードからセッション破棄をアナウンスします。

> 詳細なローカルセットアップや Cloudflare Pages 連携手順は [開発環境セットアップガイド](../development/setup.md) を参照してください。
