---
title: "Glass aesthetic: ヒーロー表示の観測メモ"
domain: frontend
status: draft
version: 0.1.0
created: "2025-11-14"
updated: "2025-11-14"
related_issues: []
related_prs: []
references:
  - docs/plan/frontend/glass-aesthetic-alignment/plan.md
  - docs/reference/ui/style-tokens.md
state: "in_review"
hypothesis: "新しい glass トークン適用後のヒーロー画面は macOS Liquid Glass の意図（薄いアクセント・移動なしのホバー）を概ね満たしているが、CTA コントラストとヘッダーの光り方に追加検証が必要"
options:
  - "現状のスタイルを正式化して intent/guide に昇格"
  - "CTA まわりのアクセントとトップバーの境界コントラストを再調整してから正式化"
open_questions:
  - "ヘッダー/フッターの光沢がモバイルでも十分に薄いか？"
  - "Primary CTA の `data-accent=\"primary\"` を複数箇所で使い始めないよう制限できているか？"
next_action_by: "@frontend-platform"
review_due: "2025-11-18"
ttl_days: 30
---

# スクリーンショット前提
- ユーザー提供の `/donate` ヒーロー状態（PC ビューポート）。
- `app/globals.css` の再設計後、`Button`/`ConsentToggle`/CTA を macOS Glass 指針に合わせた状態の確認を目的とする。

## 観測
1. **背景/パネル**: ルート背景は #f6f8fb ベースのごく薄いグラデーションで、左右上部に 3-5% 程度のアクセントが載って見える。ヘッダーとフッターは `glass-sm` 相当のバブルで囲まれ、影は 1-2px の範囲に収まっている。
2. **CTA 群**: 中央 CTA は `donate-cta-animated` + `data-accent="primary"` を唯一持つ要素で、濃色グラデーションがこの１箇所に限定されている。テキストは白でコントラストも十分。隣接する「支援者一覧」は glass ベースでホバーモーションも位置変化なしに見える。
3. **バッジ/アイコン列**: 「Stripe で安全決済」などのバッジは pill 形状＋薄い内向きハイライト。影は非常に小さく、translateY 等の移動は確認できない。
4. **タイポグラフィ**: ヒーロー見出し/リードともに計画通りに残り、カラーは `text-foreground` と `text-muted-foreground` の差で階調が作られている。

## 意図との一致評価
- **背景トークン整理**: `scope` で求めている「white/gray 基調 + アクセント 3-5%」を視覚的に満たしている。濃いピンク/青グラデーションは見当たらない。
- **移動なしのホバー**: CTA 以外のコントロール（バッジやヘッダーボタン）が上下に動いておらず、光と透明度のみで変化している点は要件どおり。
- **CTA 制限**: スクリーンショット上ではアクセントの強い CTA がヒーロー中央に 1 箇所のみ存在する。ヘッダー右上の「寄付する」は secondary 風の淡色ボタンとなっており、意図に沿う。

## 懸念・フォローアップ
1. **CTA コントラストの下限**: PC では十分に読めるが、`primary` レイヤが黒寄りグラデーションになっているため、ライトテーマでの 4.5:1 を保証するにはアクセント層の調整 or 計測が必要。
2. **ヘッダー/フッターのグロス量**: 上下バーの光沢が比較的強く、モバイル高輝度環境では白飛びする可能性がある。`bg-gloss` のボーダー濃度を確認し、必要なら `surface-divider` を 1 段階濃くする。
3. **ガイド/リファレンス更新**: 画面が計画通りであれば `docs/guide/ui/home-page.md` や intent にも「1 ページ 1 CTA」「hover=光量差」ルールを追記する必要がある。

## 次アクション案
- ヒーローと `/donors` `/thanks` で Percy/Playwright スナップショットを取得し、ガラス強度と CTA コントラストを記録。
- `home-page` ユースケースで Lighthouse Accessibility を実行し、CTA/リンクのコントラスト値を確認する。
- フッター/ヘッダーの `bg-gloss` 調整可否を `frontend-platform` でレビューし、必要なら `--surface-divider` の濃度を issue 化。
