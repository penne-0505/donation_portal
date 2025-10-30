import { parseSessionFromCookie } from '../../src/lib/auth/session.js';
import type { CookieKeySource } from '../../src/lib/cookie/signKey.js';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

interface ConsentEnv extends CookieKeySource {
  readonly STRIPE_SECRET_KEY?: string;
}

interface ConsentRequestBody {
  readonly consent_public?: unknown;
}

interface ErrorBody {
  readonly error: {
    readonly code: 'bad_request' | 'unauthorized' | 'not_found' | 'internal';
    readonly message: string;
  };
}

async function readJson(request: Request): Promise<ConsentRequestBody | null> {
  try {
    return (await request.json()) as ConsentRequestBody;
  } catch {
    return null;
  }
}

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function errorResponse(status: number, code: ErrorBody['error']['code'], message: string): Response {
  return jsonResponse({ error: { code, message } }, status);
}

function parseConsentFlag(value: unknown): { readonly ok: true; readonly value: boolean } | {
  readonly ok: false;
  readonly message: string;
} {
  if (value === true) {
    return { ok: true, value: true };
  }
  if (value === false) {
    return { ok: true, value: false };
  }
  return { ok: false, message: 'consent_public は true または false を指定してください。' };
}

async function callStripe(
  env: ConsentEnv,
  path: string,
  params: URLSearchParams,
  options: { readonly method?: 'GET' | 'POST' } = {},
): Promise<Response> {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured');
  }

  const method = options.method ?? 'POST';
  const url = new URL(`${STRIPE_API_BASE}${path}`);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
  };

  const init: RequestInit = { method, headers };
  if (method === 'GET') {
    url.search = params.toString();
  } else {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    init.body = params.toString();
  }

  return fetch(url.toString(), init);
}

async function findCustomerId(env: ConsentEnv, discordId: string): Promise<string | null> {
  const escapedId = discordId.replace(/"/g, '\\"');
  const params = new URLSearchParams({
    query: `metadata['discord_id']:"${escapedId}"`,
    limit: '1',
  });
  const response = await callStripe(env, '/customers/search', params, { method: 'GET' });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stripe customer search failed: status=${response.status} body=${body}`);
  }
  const data = (await response.json()) as { readonly data?: Array<{ readonly id?: string }> };
  const id = data.data?.[0]?.id;
  if (typeof id === 'string' && id.length > 0) {
    return id;
  }
  return null;
}

async function updateConsent(
  env: ConsentEnv,
  customerId: string,
  consent: boolean,
  displayName: string,
): Promise<void> {
  const params = new URLSearchParams({
    'metadata[consent_public]': consent ? 'true' : 'false',
    'metadata[display_name]': displayName,
    'metadata[display_name_source]': 'discord',
  });
  const response = await callStripe(env, `/customers/${customerId}`, params);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stripe customer update failed: status=${response.status} body=${body}`);
  }
}

export const onRequestPost: PagesFunction<ConsentEnv> = async (context) => {
  const { request, env } = context;

  const sessionResult = await parseSessionFromCookie({
    cookieHeader: request.headers.get('cookie'),
    keySource: env,
  });

  if (sessionResult.status === 'missing') {
    return errorResponse(401, 'unauthorized', 'Discord ログインが必要です。再度ログインしてください。');
  }

  if (sessionResult.status === 'invalid') {
    console.error('[consent] invalid session cookie', sessionResult.reason);
    return errorResponse(401, 'unauthorized', 'セッション情報の検証に失敗しました。Discord で再ログインしてください。');
  }

  const json = await readJson(request);
  if (!json) {
    return errorResponse(400, 'bad_request', 'JSON ボディを解析できませんでした。');
  }

  const parsedConsent = parseConsentFlag(json.consent_public);
  if (!parsedConsent.ok) {
    return errorResponse(400, 'bad_request', parsedConsent.message);
  }

  try {
    const customerId = await findCustomerId(env, sessionResult.session.discordId);
    if (!customerId) {
      return errorResponse(404, 'not_found', '該当する寄附者情報が見つかりませんでした。寄附後に再度お試しください。');
    }

    await updateConsent(env, customerId, parsedConsent.value, sessionResult.session.displayName);
    return new Response(null, {
      status: 204,
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('[consent] failed to update consent', message);
    return errorResponse(500, 'internal', '同意状態の更新に失敗しました。時間をおいて再実行してください。');
  }
};
