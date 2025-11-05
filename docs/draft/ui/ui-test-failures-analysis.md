---
title: "UI Test Failures Analysis: DonatePage Hero Context Issue"
domain: "donation-portal/ui/testing"
status: "proposed"
version: "0.1.0"
created: "2025-11-05"
updated: "2025-11-05"
state: "exploring"
hypothesis: "DonatePage のUI テストが失敗している原因は、HeroProvider が不要に呼び出されているか、テストセットアップが不適切である可能性がある"
options:
  - "DonatePage から useHeroContext() の呼び出しを削除する（値を使用していないため）"
  - "テストモックに useHeroContext のモックを追加する"
  - "テストで DonatePage を HeroProvider でラップする"
  - "useHeroContext() の呼び出しを条件付きにして、テスト環境では呼び出さないようにする"
open_questions:
  - "なぜ DonatePage に useHeroContext() が追加されたのか？（値を使用していない）"
  - "他のページコンポーネント（HomePage、DonorsPage）との設計の一貫性はどうあるべきか？"
  - "HeroProvider の責任範囲とページコンポーネントの依存関係はどうあるべきか？"
next_action_by: "@penne-0505"
review_due: "2025-11-12"
ttl_days: 30
related_issues: []
related_prs: []
references:
  - "components/pages/donate-page.tsx"
  - "components/pages/donors-page.tsx"
  - "components/pages/home-page.tsx"
  - "tests/donate/ui.test.ts"
  - "tests/donors/ui.test.ts"
  - "lib/ui/contexts/hero-context.tsx"
  - "tests/mocks/ui-hooks.ts"
  - "scripts/alias-loader.mjs"
---

## 概要

現在、UI関連のテストで `DonatePage React UI` の全5件のテストが失敗している。エラー内容は全て `useHeroContext must be used within a HeroProvider` である。本ドキュメントでは、この失敗の原因を分析し、コードの問題なのか、テストの想定が誤っているのかを考察する。

## 現状の問題

### テスト失敗の詳細

```
# Subtest: DonatePage React UI
not ok 4 - DonatePage React UI
  ---
  duration_ms: 45.988814
  type: 'suite'
  location: '/home/runner/work/donation_portal/donation_portal/dist/tests/donate/ui.test.js:8:1'
  failureType: 'subtestsFailed'
```

全5件のサブテストが同じエラーで失敗：
1. 未ログイン時はログイン導線を表示し、寄付操作を無効化する
2. ログイン済みセッションでは表示名と同意状態を反映する
3. 同意チェックをオンにすると API を呼び出す
4. 寄付メニューの選択で Checkout を開始しインパクトカードを表示する
5. Checkout フックがエラー状態のときはエラーメッセージを表示する

エラーメッセージ：
```
Error: useHeroContext must be used within a HeroProvider
    at useHeroContext (file:///home/runner/work/donation_portal/donation_portal/dist/lib/ui/contexts/hero-context.js:38:15)
    at DonatePage (file:///home/runner/work/donation_portal/donation_portal/dist/components/pages/donate-page.js:25:5)
```

### 他のテストの状況

- `ConsentToggle` テスト: **成功**（3件）
- `DonorsPage React UI` テスト: **成功**（4件）
- その他の API・機能テスト: **全て成功**

つまり、**DonatePage のみが失敗している**。

## 根本原因の分析

### 1. コード実装の調査

#### DonatePage の実装

`components/pages/donate-page.tsx` (L27-28):
```typescript
export function DonatePage() {
  useHeroContext();
  const { status, login, logout, refresh, isRefreshing } = useSession();
  // ...
```

**重要な発見**: `useHeroContext()` が呼び出されているが、**その戻り値は使用されていない**。

コンポーネント全体（327行）を調査した結果、`heroInView`、`heroRef`、`hasHeroSection` のいずれも使用されていないことを確認：
```bash
$ grep -E "hero(InView|Ref|Section)" components/pages/donate-page.tsx
# （出力なし）
```

#### 他のページコンポーネントとの比較

**HomePage** (`components/pages/home-page.tsx`):
```typescript
export function HomePage() {
  const { heroRef } = useHeroContext();
  // ...
  <section ref={heroRef} className="...">
```
→ `heroRef` を**実際に使用している**

**DonorsPage** (`components/pages/donors-page.tsx`):
```typescript
export function DonorsPage() {
  const { donors, total, isLoading, error, refresh: refreshDonors } = useDonors();
  // ...
```
→ `useHeroContext()` を**呼び出していない**

#### HeroContext の実際の利用箇所

```bash
$ grep -rn "heroInView\|heroRef\|hasHeroSection" components/ --include="*.tsx" | grep -v "hero-context.tsx"
components/app-shell.tsx:17:  const { heroInView, hasHeroSection } = useHeroContext();
components/app-shell.tsx:19:  const isHeroCtaSuppressed = hasHeroSection && heroInView;
components/pages/home-page.tsx:8:  const { heroRef } = useHeroContext();
components/pages/home-page.tsx:26:        ref={heroRef}
```

**AppShell** と **HomePage** のみが HeroContext の値を実際に使用している。

### 2. テスト環境の調査

#### テストモックの仕組み

`scripts/alias-loader.mjs` でモジュールを動的に差し替えている：
```javascript
const overrides = new Map([
  ['@/lib/ui/hooks/use-session', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['@/lib/ui/hooks/use-consent', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['@/lib/ui/hooks/use-checkout', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['@/lib/ui/hooks/use-donors', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['next/link', path.join(projectRoot, 'dist', 'tests', 'mocks', 'next-link.js')],
]);
```

**重要な発見**: `@/lib/ui/contexts/hero-context` は**モックされていない**。

そのため、`useHeroContext()` が呼び出されると、実際の実装が実行され、`HeroProvider` が存在しないためエラーになる。

#### テストの書き方

`tests/donate/ui.test.ts`:
```typescript
render(createElement(DonatePage));
```

`DonatePage` を直接レンダリングしており、`HeroProvider` でラップしていない。

`tests/donors/ui.test.ts`:
```typescript
render(createElement(DonorsPage));
```

同様に直接レンダリングしているが、`DonorsPage` は `useHeroContext()` を呼び出していないため成功する。

### 3. プロダクション環境での動作

`app/(main)/layout.tsx`:
```typescript
export default function AppShellLayout({ children }: { readonly children: ReactNode }) {
  return (
    <HeroProvider>
      <AppShell>{children}</AppShell>
    </HeroProvider>
  );
}
```

プロダクション環境では、全ページが `HeroProvider` でラップされているため、`DonatePage` でも `useHeroContext()` が正常に動作する。

## 原因の特定

### コードの問題か、テストの問題か？

**結論: コードの問題**

理由：
1. **DonatePage は `useHeroContext()` の戻り値を使用していない**
   - `heroInView`、`heroRef`、`hasHeroSection` のいずれも参照されていない
   - 単に Context が利用可能かチェックしているだけで、機能的な意味がない

2. **他のページコンポーネントとの設計の不一致**
   - `HomePage`: Context の値を実際に使用（`heroRef`）
   - `DonorsPage`: Context を使用しない
   - `DonatePage`: Context を呼び出すが値を使用しない ← **不整合**

3. **テストが合理的な範囲をテストしている**
   - テストはページコンポーネント単体の振る舞いを検証している
   - 外部の Context Provider への依存を最小限にするのは良い設計
   - `DonorsPage` のテストが成功していることから、テストアプローチ自体は正しい

### なぜこの状態になったのか？

仮説：
- 初期実装時に、全てのページで `useHeroContext()` を呼び出す方針だった可能性
- または、後から `DonatePage` でも Hero セクションを追加する予定だった可能性
- 実装が完了せず、不要な `useHeroContext()` 呼び出しだけが残った

現在のコードベースを見る限り、Git履歴が浅く、具体的な導入経緯は不明。

## 考察

### 設計上の問題点

1. **不要な依存関係**
   - `DonatePage` が `HeroProvider` に依存する必要がない
   - テスタビリティが低下している

2. **Context の使用方針が不明確**
   - どのページが `HeroContext` を使うべきか、基準がない
   - `HomePage` のように実際に Hero セクションがあるページのみが使うべき

3. **テストとプロダクションコードの乖離**
   - プロダクション環境では `HeroProvider` が常に存在するため問題が隠れている
   - テストで初めて不要な依存が明らかになった

### 推奨される修正方針

#### オプション1: DonatePage から useHeroContext() を削除（推奨）

**理由**:
- 最もシンプルで明確
- 不要なコードを削除するのは常に良い実践
- `DonorsPage` と設計を統一できる
- テストの修正が不要

**影響**:
- プロダクション環境での動作に影響なし（値を使用していないため）
- テストが全て成功するようになる

**変更内容**:
```diff
export function DonatePage() {
-  useHeroContext();
  const { status, login, logout, refresh, isRefreshing } = useSession();
```

#### オプション2: テストモックに useHeroContext を追加

**理由**:
- 将来的に `DonatePage` でも Hero 機能を使う予定がある場合
- コンポーネントの構造を変えずにテストを通す

**欠点**:
- 使用されていない Context への依存が残る
- 設計の不明瞭さが継続する

**変更内容**:
1. `tests/mocks/ui-hooks.ts` に `useHeroContext` モックを追加
2. `scripts/alias-loader.mjs` に Context のオーバーライドを追加

#### オプション3: テストで HeroProvider を提供

**理由**:
- 実際のプロダクション環境に近い状態でテストできる

**欠点**:
- テストの複雑さが増す
- 不要な依存関係を正当化してしまう
- ユニットテストの粒度が適切でなくなる

#### オプション4: useHeroContext() を条件付きに

**理由**:
- テスト環境でのみスキップする

**欠点**:
- 環境依存のコードは保守性を下げる
- テストとプロダクションで動作が異なる（アンチパターン）

### ベストプラクティスとの比較

React Testing Library の推奨事項：
> "The more your tests resemble the way your software is used, the more confidence they can give you."

しかし、単一のコンポーネントをテストする場合：
- 外部の Context Provider への依存は最小限にすべき
- 使用していない Context への依存は避けるべき
- テスト可能性は設計品質の指標

## 結論

### 問題の所在

**コードに問題がある** - 具体的には `DonatePage` に不要な `useHeroContext()` 呼び出しが存在する。

### 根拠

1. **機能的根拠の欠如**: Context の値を使用していない
2. **設計の不整合**: 他のページ（`DonorsPage`）は Context を使用していない
3. **テストの合理性**: テストは適切な粒度でコンポーネントを検証している
4. **保守性の低下**: 不要な依存関係はコードの理解を困難にする

### 推奨アクション

**オプション1（DonatePage から useHeroContext() を削除）を推奨**

理由：
- YAGNI (You Aren't Gonna Need It) 原則に従う
- コードをシンプルに保つ
- テスタビリティを向上させる
- 他のページとの設計を統一
- 変更が最小限（1行削除のみ）

### 実装提案

```typescript
// components/pages/donate-page.tsx
export function DonatePage() {
  // useHeroContext(); を削除
  const { status, login, logout, refresh, isRefreshing } = useSession();
  // ...残りのコードは変更なし
}
```

この変更により：
- テストが全て成功する
- プロダクション環境での動作に影響なし
- コードの意図がより明確になる
- 将来的に Hero 機能が必要になった場合は、その時点で再度追加すれば良い

## 補足: 他の観点からの検討

### パフォーマンスへの影響

現状では影響は軽微だが：
- 不要な Context の購読は、わずかながら再レンダリングのトリガーになり得る
- `HeroProvider` の state 変更時に、`DonatePage` も再評価される（値を使っていなくても）

### 将来の拡張性

もし将来的に `DonatePage` でも Hero セクションを追加する場合：
- その時点で `useHeroContext()` を追加し、実際に値を使用すれば良い
- 現時点で "念のため" 呼び出しておく必要はない（YAGNI原則）

### セキュリティ・プライバシー

影響なし

### アクセシビリティ

影響なし

## 次のステップ

1. 本ドキュメントのレビューと承認
2. `DonatePage` から `useHeroContext()` の削除
3. テストの実行と全テストの成功確認
4. 設計ガイドラインの更新（Context 使用の基準を明文化）

## 参考資料

- [React Context API - Best Practices](https://react.dev/learn/passing-data-deeply-with-context)
- [Testing Library - Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [You Aren't Gonna Need It (YAGNI)](https://martinfowler.com/bliki/Yagni.html)
