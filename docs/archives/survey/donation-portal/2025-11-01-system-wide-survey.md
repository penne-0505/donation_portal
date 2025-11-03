---
title: System-Wide Survey Report (2025-11-01)
domain: donation-portal
status: deprecated
version: 1
created: 2025-11-01
updated: 2025-11-01
related_issues: []
related_prs: []
references:
  - docs/standards/documentation_guidelines.md
  - docs/standards/documentation_operations.md
---

# Donation Portal 全体調査レポート (2025-11-01)

## 背景

Donation Portal プロジェクトは、Discord コミュニティ向けに対価を伴わない任意寄付を受け付けるシステムである。Stripe 決済、Discord OAuth、Cloudflare Pages Functions によるサーバーレスアーキテクチャで構成されており、セキュリティ・ユーザー体験・運用効率の観点から継続的な品質保証が必要である。

## 目的

本調査では、プロジェクト全体の実装状況を網羅的に把握し、以下を達成する：
- **CI/テスト実行環境** の機能状態を確認
- **ユーザーセッション・認可フロー** の完全性を検証
- **状態管理・API 呼び出し** の正確性をコードレビューで確認
- **セキュリティ・キャッシュ戦略** に関するリスク要因を抽出
- **優先度付きの改善推奨** を提示

## 対象範囲・実施条件

- **対象ディレクトリ**: `app/`, `components/`, `functions/`, `lib/`, `src/`, `tests/`, `docs/`（`_temp/` 配下は除外）
- **実施日時**: 2025-11-01
- **実施者**: 開発チーム内レビュー
- **参照対象**: Cloudflare Pages Functions（`functions/`）、UI（`app/`, `components/`, `lib/ui/`）、共通ライブラリ（`src/lib/`）、E2E/ユニットテスト（`tests/`）
- **実行環境**:
  - `npm test` → `Cannot find module '/…/dist/tests'` エラーで失敗
  - `npm run lint` → 成功（違反なし）
  - `npm run build` → 成功（Node v25 実行のため `engines` 警告あり）

## 手法

1. **コード審査**: `app/`, `components/`, `functions/`, `lib/`, `src/`, `tests/` 配下のソースコード及びテスト定義を構造的にレビュー
2. **動的検査**: `npm test`, `npm run lint`, `npm run build` を実行し、エラー・警告を確認
3. **ドキュメント参照**: プロジェクト仕様・ガイドラインを基に、実装の一貫性・完全性を評価

## 結果

### 検出事項（重大度別）

#### 🔴 高優先度（3件）

##### 1. `npm test` がコンパイル済みテストを解決できず失敗

**検出内容**
- `npm test` 実行時に `Error: Cannot find module '/dist/tests'` が発生し、Node.js v25 でテストランナーが終了
- `package.json` の `test` スクリプト（L12）で `node --experimental-global-webcrypto --test dist/tests` を実行しているが、ディレクトリ指定では読み込まれない

**根拠**
- 再現手順: `npm test` 実行
- 実行環境: Node.js v25

**影響度**
- CI/ローカルでテストが一切実行できず、回帰検知が不能
- 品質保証プロセスが機能していない

**推奨対応**
- `node --test "dist/tests/**/*.test.js"` などファイルグロブを指定する
- または Node v18/20 動作での互換性確認を行い、テスト起動方法を再設計する

---

##### 2. `/oauth/logout` エンドポイントが未実装

**検出内容**
- フロントエンドの `useSession()`（`lib/ui/hooks/use-session.ts` L90）が `/oauth/logout` へ遷移する設計だが、Pages Functions 側に該当ハンドラが存在しない
- `functions/oauth/` は `start.ts` と `callback.ts` のみで、`logout.ts` がない

**根拠**
- ディレクトリ構造の確認: `functions/oauth/` の内容物チェック
- コード参照: UI の `useSession()` 実装確認

**影響度**
- 利用者が手動でセッション Cookie を削除できず、共有端末での利用において重大なセキュリティリスク
- ユーザー体験が損なわれる

**推奨対応**
- Cookie 破棄を行う `POST /oauth/logout` または `GET /oauth/logout` を追加
- `Set-Cookie` で即時失効するセッションクッキーを送出する実装

---

##### 3. Donors 同意トグルが状態を正しく保持できない

**検出内容**
- `components/pages/donate-page.tsx` の `handleConsentChange`（L52-L59）が `consent` state を参照しているにもかかわらず、`useCallback` の依存配列に含めていない
- クロージャスコープにより古い `consent` 値がキャプチャされる

**根拠**
- コード静的解析: `useCallback` の依存配列チェック
- React Hooks 規則の検証

**影響度**
- 一度同意を ON→OFF に戻そうとすると、古い状態がキャプチャされるため API が呼ばれず撤回できないケースが発生
- ユーザーが望まない公開表示を撤回できない

**推奨対応**
- 依存配列に `consent` を追加する
- または `setConsent` の updater 形式を利用して最新値で比較する

---

#### 🟠 中優先度（2件）

##### 4. Stripe Webhook 署名の複数値処理が曖昧

**検出内容**
- `functions/api/webhooks/stripe.ts` の `parseStripeSignature`（L74-L93）で `v1` 署名を配列化し、`some()`（L163）で1件一致すれば真とみなす
- Stripe 署名仕様に対する実装の厳密性が不明確

**根拠**
- コード実装の確認: 署名検証ロジックの詳細
- Stripe 公式ドキュメント仕様との比較（仕様確認未完）

**影響度**
- 想定外ケースで最初に一致した署名が偽陽性となるリスク
- セキュリティ脆弱性の可能性

**推奨対応**
- Stripe 公式仕様に基づき、複数署名の取り扱い方針を文書化する
- 必要に応じて厳格な一致確認を行う実装に修正

---

##### 5. Cookie 署名キー取得失敗時のエラーハンドリング不足

**検出内容**
- `functions/oauth/callback.ts`（L137）で `getCookieSignKey(env)` を呼び出す際、例外を捕捉していない
- `COOKIE_SIGN_KEY` の未設定時に 500 エラーとスタックトレースが露出

**根拠**
- コード実装の確認: try-catch ブロック不在
- エラーハンドリング規約の確認

**影響度**
- 秘密情報がログに記録される恐れがある
- セキュリティ・プライバシーリスク

**推奨対応**
- `getCookieSignKey` 周辺を try-catch で包む
- ユーザー向けには汎用的なエラー文言、ログにはサニタイズした原因のみを出力する

---

#### 🟡 低優先度（1件）

##### 6. Donors API のランダム順序とキャッシュ戦略

**検出内容**
- `functions/api/donors.ts` の `order=random`（L132-L151）が毎回順序をシャッフルしつつ `ETag` を弱整合で返却
- キャッシュ戦略が明文化されていない

**根拠**
- コード実装の確認: `order=random` ロジック
- HTTP キャッシュ仕様との検討（未完）

**影響度**
- キャッシュを有効化した際に毎回内容差分が生じ、CDN やブラウザキャッシュが効率的に機能しない可能性
- パフォーマンス低下のリスク（実装直後は軽微）

**推奨対応**
- `order=random` を提供する場合はキャッシュ無効化方針を明文化する
- または `ETag` を付与しないなど仕様を整理する

---

## 考察

### 既知課題のフォローアップ

- ✅ Cookie 検証ロジックの ArrayBuffer 取扱いは `src/lib/auth/cookie.ts` で `Uint8Array` コピーを挟む実装に改善済み（前回指摘の解消を確認）
- 🟠 Webhook 署名処理、🟠 Cookie 署名キー取得エラー露出、🟡 Donors API キャッシュの懸念は前回調査から未解決

### 品質保証フロー

現在の問題の根本原因は、**テスト実行が機能していないため回帰検知ができていない** 点にある。`npm test` の修復は、他の改善項目の効果を担保する基盤として最優先である。

## 推奨対応

### 優先度順序と実装計画

| 優先度 | 項目 | 目安工期 | 推奨フェーズ |
|--------|------|---------|-----------|
| 1 | `npm test` の修復 | 1～2 時間 | 直近 Sprint |
| 2 | `/oauth/logout` ルートの実装 | 3～4 時間 | 直近 Sprint |
| 3 | Donors 同意トグルのステート管理修正 | 1～2 時間 | 直近 Sprint |
| 4 | Stripe Webhook 署名仕様の文書化と検証 | 2～3 時間 | 次 Sprint 初期 |
| 5 | Cookie 署名キー取得時の例外ハンドリング | 1～2 時間 | 次 Sprint 初期 |
| 6 | Donors API のキャッシュ/ランダム仕様の整理 | 1～2 時間 | 次 Sprint 後期 |

### 対応別の詳細アクション

#### アクション 1: `npm test` の修復
- [ ] `package.json` の `test` スクリプトをファイルグロブで修正
- [ ] 全テストスイート実行確認
- [ ] CI 環境でのテスト実行検証
- [ ] ドキュメント: `docs/guide/development/testing.md` へテスト実行方法を記載

#### アクション 2: `/oauth/logout` エンドポイント実装
- [ ] `functions/oauth/logout.ts` を新規作成
- [ ] Session Cookie の即時失効処理を実装
- [ ] フロントエンド `useSession()` 呼び出し確認
- [ ] 統合テスト追加（ログアウト→再ログイン）
- [ ] ドキュメント: `docs/reference/api/oauth.md` へ logout エンドポイント記載

#### アクション 3: Donors 同意トグルのステート管理修正
- [ ] `components/pages/donate-page.tsx` の `handleConsentChange` をレビュー
- [ ] 依存配列に `consent` を追加、またはクロージャを改善
- [ ] 状態同期のユニットテスト追加
- [ ] 手動テスト: ON→OFF→ON の状態遷移確認

#### アクション 4: Stripe Webhook 署名仕様の文書化
- [ ] Stripe 公式仕様ドキュメント確認
- [ ] `docs/reference/payments/webhook-signature.md` を作成
- [ ] 複数署名の取り扱い方針を明文化
- [ ] 実装検証・必要に応じて修正

#### アクション 5: Cookie 署名キー取得時の例外ハンドリング
- [ ] `functions/oauth/callback.ts` の try-catch ブロック追加
- [ ] エラーログのサニタイズ方針を確認
- [ ] テスト追加（キー未設定時の挙動）
- [ ] ドキュメント: `docs/guide/auth/error-handling.md` へログレベル・出力内容を記載

#### アクション 6: Donors API のキャッシュ戦略の整理
- [ ] キャッシュ・ランダムの仕様意図を `docs/intent/` へ ADR として記載
- [ ] `order=random` 時のキャッシュ無効化方針を明文化
- [ ] ETag 仕様を検証・修正
- [ ] ドキュメント: `docs/reference/api/donors.md` へキャッシュ戦略を記載

---

## まとめ

本調査により、Donation Portal は基盤機能の実装は進捗しているものの、**運用・品質保証・セキュリティ** の観点で改善余地が認識された。特に `npm test` 修復による CI 回復が他の施策の効果を担保する最優先事項である。

推奨対応を段階的に実施することで、以下を達成できる：
- 🔄 **CI 環境の正常化** → 回帰検知能力の回復
- 🔐 **セキュリティリスク低減** → ログアウト、エラーハンドリング強化
- ⚙️ **ユーザー体験改善** → 同意トグル、セッション管理の安定化
- 📊 **運用効率化** → キャッシュ戦略、Webhook 仕様の明確化