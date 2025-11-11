# Font asset sourcing

このディレクトリには、`@fontsource` から取得する書体に関するメタデータのみを保持します。
ビルド時に必要なバイナリフォントは npm 依存関係 (`@fontsource-variable/inter`,
`@fontsource/noto-sans-jp`, `@fontsource/zen-kaku-gothic-new`) として提供され、
`app/fonts.ts` から直接参照されます。

以前の `.ttf` / `.otf` バイナリは `*_REMOVED.md` に置き換え、レポジトリに大容量資産を
同梱しない方針を明示しています。ライセンス文書は `public/fonts/licenses/` に残しています。
