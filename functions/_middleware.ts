export const config = {
  compatibility_date: '2025-10-30',
  compatibility_flags: ['nodejs_compat'],
};

type AssetsFetcher = { fetch: (request: Request) => Promise<Response> | Response };
type EnvWithAssets = Record<string, unknown> & { ASSETS?: AssetsFetcher };

const ensureAssetsBinding = (env: EnvWithAssets): void => {
  const maybeFetcher = env.ASSETS;
  if (maybeFetcher && typeof maybeFetcher.fetch === 'function') {
    return;
  }

  const fallbackMessage =
    'ASSETS binding is unavailable. Run `wrangler pages dev` or provide --assets when starting the worker.';

  env.ASSETS = {
    async fetch() {
      return new Response(fallbackMessage, {
        status: 501,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    },
  };
};

export const onRequest: PagesFunction = (context) => {
  ensureAssetsBinding(context.env as EnvWithAssets);
  return context.next();
};
