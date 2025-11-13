---
title: "UI Test Failures Analysis: DonatePage Hero Context Issue"
domain: "donation-portal/ui/testing"
status: "proposed"
version: "0.1.0"
created: "2025-11-05"
updated: "2025-11-13"
state: "exploring"
hypothesis: "DonatePage の UI テスト失敗は HeroProvider 非注入およびブラウザ API モック不足が原因である"
options:
  - "テストで DonatePage を HeroProvider でラップするユーティリティを導入する"
  - "HeroContext をテスト専用モックで差し替える"
  - "DonatePage から HeroContext 依存を切り離す"
open_questions:
  - "HeroProvider 以外にブラウザ API の不足がないかを継続的に監視する必要があるか?"
next_action_by: "@penne-0505"
review_due: "2025-11-12"
ttl_days: 30
related_issues: []
related_prs: []
references:
  - "components/pages/donate-page.tsx"
  - "tests/donate/ui.test.ts"
  - "tests/setup/test-environment.ts"
  - "lib/ui/contexts/hero-context.tsx"
  - "tests/mocks/ui-hooks.ts"
  - "scripts/alias-loader.mjs"
---

## 概要

`DonatePage React UI` の 5 件のテストがすべて `useHeroContext must be used within a HeroProvider` で失敗していた。プロダクションではアプリケーションレイアウトが `HeroProvider` を提供しているが、テスト環境では Provider が用意されていなかったためである。さらに、`HeroProvider` は `IntersectionObserver` に依存するため、JSDOM 上でのポリフィルが無いと実装が動作しない。テスト実行時の差分を精査し、実装の変更ではなくテストセットアップの不足を補う方針とした。

## 現状の失敗内容

- 対象: `tests/donate/ui.test.ts`
- 失敗テスト数: 5 / 5
- エラー: `Error: useHeroContext must be used within a HeroProvider`
- 発生タイミング: `<DonatePage>` を直接 `render()` した直後に `useHeroContext()` が投げる

## 実装調査

### DonatePage の依存

`DonatePage` は `HeroContext` から `setShouldDeemphasizeButton` を取得し、ページ表示中はヒーローセクションの CTA ボタンをデエンファシスするよう依頼している。

```typescript
const { setShouldDeemphasizeButton } = useHeroContext();
useEffect(() => {
  setShouldDeemphasizeButton(true);
  return () => setShouldDeemphasizeButton(false);
}, [setShouldDeemphasizeButton]);
```

この挙動はランディングページのヒーロー CTA を弱め、寄付ページ上の案内を優先表示するために必要であり、単純に依存を削除することは仕様退行を招く。

### テスト環境の不足

- `tests/donate/ui.test.ts` は `<DonatePage>` を Provider 無しで描画していた。
- `tests/setup/test-environment.ts` では `IntersectionObserver` のモックが定義されていなかったため、仮に Provider を注入しても `ReferenceError: IntersectionObserver is not defined` が発生するリスクがあった。

## 原因の特定

根本原因は **テストセットアップがプロダクション環境と一致していなかったこと** にある。`HeroProvider` を提供せずにページを描画した結果、`useHeroContext()` が例外を投げ、テストが失敗した。合わせて、ブラウザ API の不足が潜在的な第 2 の失敗要因になっていた。

## 対応方針の評価

| 方針 | 利点 | 欠点 |
| --- | --- | --- |
| HeroProvider でラップ | 実装と同等の条件を再現できる | IntersectionObserver などブラウザ API を別途モックする必要がある |
| HeroContext をモック | IntersectionObserver を扱う必要がなく簡潔 | 実装との乖離が大きく、将来の仕様変更を検出しづらい |
| HeroContext 依存削減 | テストは単純化する | 現行仕様で必要な挙動を失うため不可 |

実装の整合性と将来の検出性を優先し、テストを実装に揃える方針（HeroProvider でラップ）を選択した。

## 決定と実施内容

1. `tests/donate/ui.test.ts` に `renderDonatePage()` ヘルパーを追加し、全テストケースで `<HeroProvider>` によるラップを行う。
2. `tests/setup/test-environment.ts` へ簡易的な `IntersectionObserver` ポリフィルを追加し、`HeroProvider` の副作用が参照するブラウザ API を満たす。

これにより、テスト環境でプロダクション同等の依存関係を再現しつつ、`HeroContext` の仕様を維持したままテストを通過できるようになった。

## フォローアップ

- ブラウザ API 依存を追加するコンポーネントが増えた場合は、`tests/setup/test-environment.ts` にモックを集約し、テスト失敗の早期検知を図る。
- `HeroProvider` の機能拡張が行われた際には、React テストユーティリティを共有化することを検討する。
