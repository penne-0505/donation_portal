---
title: "UI Test Failures Analysis: DonatePage Hero Context Issue"
domain: "donation-portal/ui/testing"
status: "proposed"
version: "0.1.1"
created: "2025-11-05"
updated: "2025-11-14"
state: "paused"
hypothesis: "DonatePage のUI テストが失敗している原因は、HeroProvider が不要に呼び出されているか、テストセットアップが不適切である可能性がある"
options:
  - "DonatePage から useHeroContext() の呼び出しを削除する（値を使用していないため）"
  - "テストモックに useHeroContext のモックを追加する"
  - "テストで DonatePage を HeroProvider でラップする"
  - "useHeroContext() の呼び出しを条件付きにして、テスト環境では呼び出さないようにする"
open_questions: []
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

### 2025-11-14 更新

- `tests/mocks/ui-hooks.ts` に `useHeroContext` と `HeroProvider` のモックを実装し、`scripts/alias-loader.mjs` で差し替えることで UI テストの失敗を解消した。
- `DonatePage` は `setShouldDeemphasizeButton` を利用してヒーローセクションの強調状態を制御しているため、Context 自体は正当な依存関係である。
- 本ドキュメントは調査結果の記録として保持しつつ、当面の追加アクションは不要なため `state: paused` とする。

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

`components/pages/donate-page.tsx` (L25-34):
```typescript
export function DonatePage() {
  const { setShouldDeemphasizeButton } = useHeroContext();
  const { status, login, logout, refresh, isRefreshing } = useSession();

  useEffect(() => {
    setShouldDeemphasizeButton(true);
    return () => {
      setShouldDeemphasizeButton(false);
    };
  }, [setShouldDeemphasizeButton]);
  // ...
```

`DonatePage` はヒーローセクションに設置されたグローバル CTA ボタンの強調状態を制御するため、`setShouldDeemphasizeButton` を呼び出している。これにより、寄付フローへ進むページではヒーローセクションのボタンを抑制し、画面内の重複アクションを避けている。

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

**結論: テストセットアップの問題**

理由：
1. **DonatePage は Context を利用してグローバル CTA の強調状態を制御している**
   - `setShouldDeemphasizeButton` の呼び出しは実装上必要な副作用であり、依存自体は正当。

2. **プロダクションでは常に HeroProvider 配下で描画される**
   - `app/(main)/layout.tsx` でアプリ全体が `HeroProvider` にラップされているため、実運用ではエラーにならない。

3. **テストモックが HeroContext を差し替えていなかった**
   - `scripts/alias-loader.mjs` は主要な UI フックをモックへ差し替えているが、`@/lib/ui/contexts/hero-context` だけ未登録だった。
   - そのため、テスト環境では Provider を持たない実装が呼ばれ、`useHeroContext must be used within a HeroProvider` が発生した。

### なぜこの状態になったのか？

既存の UI テストは `useSession` などのフックをモック化する前提で設計されており、Context も同様に差し替える想定だった。しかし HeroContext の追加時にモック登録が抜け落ちたことで、テスト専用の実装との整合性が崩れたと推測される。

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

#### オプション1: DonatePage から useHeroContext() を削除

**評価**:
- `setShouldDeemphasizeButton` はグローバル CTA の挙動を調整するために必要であり、削除すると UX が変化する。
- そのため、本オプションは現在の要件と矛盾するため採用しない。

#### オプション2: テストモックに useHeroContext を追加（採用）

**理由**:
- 本番実装の依存関係を維持したままテストの安定性を確保できる。
- 既存のフックモック戦略（`useSession` など）と整合する。

**実施内容**:
1. `tests/mocks/ui-hooks.ts` に `useHeroContext`／`HeroProvider` のモックを追加し、`setShouldDeemphasizeButton` の副作用を模倣。
2. `scripts/alias-loader.mjs` に HeroContext のオーバーライドを登録し、テスト環境で自動的にモックを利用するようにした。

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

**テストモックの不足が原因** - HeroContext の差し替えが抜けていたため、Provider なしで `useHeroContext` が実行されていた。

### 根拠

1. **実装要件**: `setShouldDeemphasizeButton` は Donate ページで必要な挙動。
2. **プロダクションの正常性**: `HeroProvider` にラップされた構成で問題が発生していない。
3. **モック構成のギャップ**: 他の UI フックはモック化されているが、HeroContext だけ未対応だった。

### 推奨アクション

**オプション2（HeroContext モックの追加）を採用・実施**

理由：
- 本番コードを変更せずにテストを安定化できる。
- 既存のテスト戦略と整合し、将来の Context 変更時にも拡張しやすい。

### 実装提案

```typescript
// tests/mocks/ui-hooks.ts
function useHeroContext() {
  return state.hero;
}

function HeroProvider({ children }) {
  return createElement(Fragment, null, children);
}

// scripts/alias-loader.mjs
['@/lib/ui/contexts/hero-context', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')]
```

この変更により：
- `DonatePage React UI` を含む UI テストがすべて成功する。
- Context への依存関係を維持したままテストを自己完結させられる。
- 新たな UI コンポーネントでも HeroContext を利用しやすくなる。

## 補足: 他の観点からの検討

### パフォーマンスへの影響

現状では影響は軽微だが：
- `HeroProvider` の state 変更時に `DonatePage` も再評価される点は把握しておく（`setShouldDeemphasizeButton` が必要なため許容範囲）。
- テスト環境では軽量なモックを利用するため、実行コストへの影響は僅少。

### 将来の拡張性

将来的にヒーローセクション周辺のロジックが拡張された場合でも：
- モック経由で Context の振る舞いを注入できるため、テストコードの変更コストは限定的。
- 実装側で値の追加があれば、モックにフィールドを増やすだけで追随可能。

### セキュリティ・プライバシー

影響なし

### アクセシビリティ

影響なし

## 次のステップ

1. 本ドキュメントのレビューと承認
2. HeroContext に新たなフィールドを追加する際はモックの更新手順を開発チェックリストに追記する
3. UI テストの定期実行で HeroContext モックが最新状態かどうかを監視する

## 参考資料

- [React Context API - Best Practices](https://react.dev/learn/passing-data-deeply-with-context)
- [Testing Library - Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [You Aren't Gonna Need It (YAGNI)](https://martinfowler.com/bliki/Yagni.html)
