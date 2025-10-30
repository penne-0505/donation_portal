export const onRequest: PagesFunction = async () => {
  // 監視用途の軽量ヘルスチェック。将来的にバージョンや依存サービスの状態を
  // 返却する場合は JSON レスポンスへ拡張することを想定している。
  return new Response('ok', {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
