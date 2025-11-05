---
title: 'Git履歴修正: dev ブランチへの不正なマージコミット削除'
domain: 'operations'
status: 'active'
version: '1.0.0'
created: '2025-11-05'
updated: '2025-11-05'
related_issues: []
related_prs: []
references:
  - ../../standards/git_workflow.md
  - ../../guide/development/git-workflow.md
---

## 背景

dev ブランチから main ブランチへの PR を作成する際に、過去のすべてのコミット（PR #47 以前のコミット群）が対象に含まれてしまう問題が発生した。

### 根本原因の分析

Git ログの調査から、以下の状況が判明した：

1. **main ブランチの HEAD**: `e8a80fa` (Merge pull request #46...)
2. **dev ブランチの HEAD**: `6a4c9f1` (Merge pull request #49...)
3. **共通の祖先**: `e8a80fa` (main の HEAD と同じ)

つまり、main から dev へのすべてのコミットが未マージ状態のままであり、これらが PR に含まれることになっていた。

### 不正なマージの発生箇所

PR #47（コミット `4b0397a`）の時点で、**main の内容を dev に統合するマージコミットが作成されていた**。

```
Merge pull request #47 from penne-0505/main
  ↑ main → dev への逆向きマージ（非推奨）
```

この操作により：
- ❌ **通常の流れ**: dev で開発 → main にマージ（一方向）
- ✓ **発生した流れ**: dev に main をマージ バック（双方向）

結果として、dev はすべての main 変更を取り込んでしまい、dev → main への PR が「main の全コミット + dev の独自コミット」を対象にするという異常な状態になった。

## 決定

Git の interactive rebase を使用して、PR #47 のマージコミット（`4b0397a`）のみを dev ブランチから削除する。

### 実装方針

1. **バックアップ作成**: 修正前の状態を `backup-dev-before-rebase` ブランチとして保存
2. **Rebase 実行**: `git rebase -i main` で `4b0397a` を `drop` に変更
3. **検証**: rebase 後、`git log main..dev` で PR #48, #49 のコミットのみが対象に含まれることを確認
4. **Push**: `git push -f origin dev` で修正済み履歴をリモートに反映
5. **クリーンアップ**: PR #48、#49 の変更内容は全て保持され、PR #47 のマージコミットのみが削除される

### 変更の影響

| 項目 | 影響 |
| --- | --- |
| **コード変更** | ✅ 保持（PR #48, #49 の全変更が残る） |
| **履歴** | 🗑️ 削除（PR #47 の merge commit のみ） |
| **新 PR** | ✅ 正常化（dev → main の PR は4コミット対象になる） |
| **ローカル** | ⚠️ Force update 必要（`git fetch origin dev` で同期） |
| **チーム** | ⚠️ 影響あり（他人が dev から branch 作成している場合） |

## 実行内容

### 実行日時
- 実行日: 2025-11-05
- 実行者: GitHub Copilot（AIエージェント）
- コマンド:
  ```bash
  # 1. バックアップ作成
  git branch backup-dev-before-rebase
  
  # 2. Rebase スクリプト実行
  export GIT_SEQUENCE_EDITOR='sed -i "s/^pick 4b0397a/drop 4b0397a/"'
  git rebase -i main
  
  # 3. リモートに反映
  git push -f origin dev
  ```

### 実行結果

| コマンド | 結果 | 詳細 |
| --- | --- | --- |
| バックアップ作成 | ✅ 成功 | HEAD: `6a4c9f1` (Merge pull request #49...) |
| Rebase 実行 | ✅ 成功 | コミット削除: 1 → dev HEAD: `a357c6d` |
| Push | ✅ 成功 | `6a4c9f1...a357c6d dev -> dev (forced update)` |

### 修正後の状態

```bash
# main..dev の対象コミット（修正後）
a357c6d (HEAD -> dev) docs: Add frontend input trust survey report
44af539 docs: final verification and completion of consent toggle redesign
72b4434 feat: redesign consent toggle with macOS-inspired styling
3a159a1 Initial plan
e8a80fa (origin/main, main) Merge pull request #46 ...
```

✅ **PR #48, #49 のみが対象に含まれる**（正常化完了）

## 影響範囲

### 修正によるメリット

1. ✅ **PR 作成が正常化**: dev → main の PR で不要なコミットが含まれなくなった
2. ✅ **履歴の線形化**: `git log` が理解しやすくなった
3. ✅ **コード レビュー効率向上**: レビュイーが不要なコミットを確認する手間がなくなった
4. ✅ **キャッシュ効率**: Git オブジェクトの不要なコミットが削除され、効率改善

### 注意事項

1. ⚠️ **Force push**: リモートの dev が書き換わったため、ローカルの古い dev は使用不可
   - **対応**: `git fetch origin dev` + `git reset --hard origin/dev` で同期
2. ⚠️ **他ブランチへの影響**: 他の人が古い dev から branch を作成していた場合、マージ衝突の可能性
   - **対応**: 該当者に通知し、新しい dev からの rebase を推奨
3. ⚠️ **CI/CD**: GitHub Actions のキャッシュが古い HEAD を参照している可能性
   - **対応**: Force push 後、CI キャッシュをリセット推奨

## 長期対応

### 再発防止策

1. **Git Workflow ドキュメント強化**
   - `docs/standards/git_workflow.md` に「main ← dev への merge は禁止」を明記
   - rebase vs merge の判断基準を具体例と共に記載

2. **レビュープロセス整備**
   - PR テンプレートに「dev → main 以外の direction での merge」チェックを追加
   - CODEOWNERS に dev/main 関連 PR は自動リクエスト

3. **CI による検証**
   - GitHub Actions で dev が main を取り込む merge commit を自動検出する pre-commit hook
   - 該当 PR をブロックまたは警告する仕組み

### 関連ドキュメント整備

- `docs/guide/development/git-workflow.md`: 実装フロー（dev → feature → PR）の詳細手順
- `docs/reference/operations/git-commands.md`: rebase / merge の使い分けリファレンス

---

**補足**: バックアップブランチ `backup-dev-before-rebase` は `6a4c9f1` を指しており、必要に応じて復帰可能な状態を保持している。
