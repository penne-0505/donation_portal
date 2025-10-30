---
title: 'Cloudflare Pages トラブルシューティングガイド'
domain: 'donation-portal'
status: 'active'
version: '1.0.0'
created: '2025-11-03'
updated: '2025-11-03'
related_issues: []
related_prs: []
references:
  - ./production-deployment.md
  - ../development/setup.md
---

## 概要

Cloudflare Pages で Donation Portal をデプロイする際によく発生するビルド失敗と、その対処方法をまとめています。Pages 側のルートディレクトリ設定が誤っている場合に `npm` が `package.json` を検出できず、ビルドが失敗するケースを中心に扱います。

> **対象読者**: Cloudflare Pages のビルドエラーに直面した運用担当者・開発者。

## 症状: `npm error enoent Could not read package.json`

Cloudflare Pages のデプロイログに以下のような出力が現れる場合、Pages が `package.json` を含むリポジトリルートを参照できていません。

```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/opt/buildhome/repo/package.json'
```

Pages は検出したルートディレクトリを基準に `npm run build` を実行します。ルートディレクトリが `public/` や他のサブディレクトリに誤設定されていると、`package.json` が存在しないパスでコマンドが実行され、上記エラーが発生します。

## 対処手順

1. Cloudflare ダッシュボードで対象の Pages プロジェクトを開き、**Settings → Builds & deployments → Build configuration** に進みます。
2. **Root directory** を `.`（または `package.json` が存在するディレクトリパス）に設定します。Donation Portal リポジトリではリポジトリ直下に `package.json` があるため、値を空欄または `.` にしてください。
3. **Build command** は `npm run build`、**Build output directory** は `public`、**Functions directory** は `functions` を指定します。
4. 設定を保存したら **Deployments → Retry deployment** を実行し、同じコミットで再ビルドします。ログに `npm install` と `npm run build` が正しく実行され、`Finished successfully` となれば解決です。
5. それでも失敗する場合は、該当コミットに `package.json` が存在するかを GitHub 上で確認し、最新ブランチへ更新されているかを再チェックしてください。

## 参考リンク

- [本番環境セットアップ & 移行ガイド](./production-deployment.md)
- [ローカル開発環境セットアップ](../development/setup.md)
