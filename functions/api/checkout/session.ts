import { parseSessionFromCookie } from '../../../src/lib/auth/session.js';
import type { CookieKeySource } from '../../../src/lib/cookie/signKey.js';

interface CheckoutEnv extends CookieKeySource {
  readonly STRIPE_SECRET_KEY?: string;
  readonly PRICE_ONE_TIME_300?: string;
  readonly PRICE_SUB_MONTHLY_300?: string;
  readonly PRICE_SUB_YEARLY_3000?: string;
  readonly APP_BASE_URL?: string;
}

interface CheckoutRequestBody {
  readonly mode?: unknown;
  readonly interval?: unknown;
  readonly variant?: unknown;
}

interface CheckoutSuccessBody {
  readonly url: string;
}

interface ErrorBody {
  readonly error: {
    readonly code: 'bad_request' | 'unauthorized' | 'internal';
    readonly message: string;
  };
}

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

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

function resolveBaseUrl(request: Request, env: CheckoutEnv): string | undefined {
  if (env.APP_BASE_URL) {
    return env.APP_BASE_URL;
  }
  try {
    const url = new URL(request.url);
    return url.origin;
  } catch {
    return undefined;
  }
}

function parseBody(body: CheckoutRequestBody):
  | { readonly ok: true; readonly mode: 'payment'; readonly priceKey: 'PRICE_ONE_TIME_300' }
  | {
      readonly ok: true;
      readonly mode: 'subscription';
      readonly priceKey: 'PRICE_SUB_MONTHLY_300' | 'PRICE_SUB_YEARLY_3000';
    }
  | { readonly ok: false; readonly message: string } {
  const mode = body.mode;
  const interval = body.interval;
  const variant = body.variant;

  if (mode !== 'payment' && mode !== 'subscription') {
    return { ok: false, message: 'mode must be either "payment" or "subscription"' };
  }

  if (mode === 'payment') {
    if (interval !== null) {
      return { ok: false, message: 'interval must be null for one-time payments' };
    }
    if (variant !== 'fixed300') {
      return { ok: false, message: 'variant must be "fixed300" for one-time payments' };
    }
    return { ok: true, mode, priceKey: 'PRICE_ONE_TIME_300' };
  }

  if (interval !== 'monthly' && interval !== 'yearly') {
    return { ok: false, message: 'interval must be "monthly" or "yearly" for subscriptions' };
  }

  if (interval === 'monthly' && variant !== 'fixed300') {
    return { ok: false, message: 'variant must be "fixed300" for monthly subscriptions' };
  }

  if (interval === 'yearly' && variant !== 'fixed3000') {
    return { ok: false, message: 'variant must be "fixed3000" for yearly subscriptions' };
  }

  const priceKey = interval === 'monthly' ? 'PRICE_SUB_MONTHLY_300' : 'PRICE_SUB_YEARLY_3000';
  return { ok: true, mode, priceKey };
}

async function callStripe(
  env: CheckoutEnv,
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

async function ensureCustomer(
  env: CheckoutEnv,
  {
    displayName,
    discordId,
    consentPublic,
  }: {
    readonly displayName: string;
    readonly discordId: string;
    readonly consentPublic: boolean;
  },
): Promise<string> {
  const escapedId = discordId.replace(/"/g, '\\"');
  const searchParams = new URLSearchParams({
    query: `metadata['discord_id']:"${escapedId}"`,
    limit: '1',
  });
  const searchResponse = await callStripe(env, '/customers/search', searchParams, { method: 'GET' });
  if (!searchResponse.ok) {
    const body = await searchResponse.text();
    throw new Error(`Stripe customer search failed: status=${searchResponse.status} body=${body}`);
  }
  const searchData = (await searchResponse.json()) as {
    readonly data?: Array<{ readonly id?: string }>;
  };
  const existingCustomerId = searchData.data?.[0]?.id;

  const metadataParams = new URLSearchParams({
    'metadata[display_name]': displayName,
    'metadata[display_name_source]': 'discord',
    'metadata[discord_id]': discordId,
    'metadata[consent_public]': consentPublic ? 'true' : 'false',
  });

  if (existingCustomerId) {
    const updateResponse = await callStripe(env, `/customers/${existingCustomerId}`, metadataParams);
    if (!updateResponse.ok) {
      const body = await updateResponse.text();
      throw new Error(`Stripe customer update failed: status=${updateResponse.status} body=${body}`);
    }
    return existingCustomerId;
  }

  metadataParams.set('name', displayName);
  const createResponse = await callStripe(env, '/customers', metadataParams);
  if (!createResponse.ok) {
    const body = await createResponse.text();
    throw new Error(`Stripe customer creation failed: status=${createResponse.status} body=${body}`);
  }
  const created = (await createResponse.json()) as { readonly id?: string };
  if (typeof created.id !== 'string' || created.id.length === 0) {
    throw new Error('Stripe customer creation succeeded without an id');
  }
  return created.id;
}

type CheckoutEnvKey = keyof Pick<
  CheckoutEnv,
  'PRICE_ONE_TIME_300' | 'PRICE_SUB_MONTHLY_300' | 'PRICE_SUB_YEARLY_3000'
>;

async function createCheckoutSession(
  env: CheckoutEnv,
  customerId: string,
  priceKey: CheckoutEnvKey,
  mode: 'payment' | 'subscription',
  baseUrl: string,
): Promise<CheckoutSuccessBody> {
  const priceId = env[priceKey];
  if (typeof priceId !== 'string' || priceId.length === 0) {
    throw new Error(`Price id ${priceKey} is not configured`);
  }

  const params = new URLSearchParams({
    mode,
    customer: customerId,
    success_url: `${baseUrl}/thanks`,
    cancel_url: `${baseUrl}/donate`,
  });
  params.append('line_items[0][price]', priceId);
  params.append('line_items[0][quantity]', '1');

  const response = await callStripe(env, '/checkout/sessions', params);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stripe checkout session creation failed: status=${response.status} body=${body}`);
  }
  const data = (await response.json()) as { readonly url?: string };
  if (typeof data.url !== 'string' || data.url.length === 0) {
    throw new Error('Stripe checkout session returned without url');
  }
  return { url: data.url };
}

export const onRequestPost: PagesFunction<CheckoutEnv> = async (context) => {
  const env = context.env;
  const request = context.request;

  const sessionResult = await parseSessionFromCookie({
    cookieHeader: request.headers.get('cookie'),
    keySource: env,
  });

  if (sessionResult.status === 'missing') {
    return errorResponse(401, 'unauthorized', 'Discord ログインが必要です。再度ログインしてください。');
  }

  if (sessionResult.status === 'invalid') {
    console.error('[checkout/session] invalid session cookie', sessionResult.reason);
    return errorResponse(401, 'unauthorized', 'セッション情報を再取得してください。Discord でのログインからやり直してください。');
  }

  let requestBody: CheckoutRequestBody;
  try {
    requestBody = (await request.json()) as CheckoutRequestBody;
  } catch {
    return errorResponse(400, 'bad_request', 'JSON ボディを解析できませんでした。');
  }

  const parsed = parseBody(requestBody);
  if (!parsed.ok) {
    return errorResponse(400, 'bad_request', parsed.message);
  }

  const baseUrl = resolveBaseUrl(request, env);
  if (!baseUrl) {
    console.error('[checkout/session] failed to resolve base URL');
    return errorResponse(500, 'internal', '寄附を開始できませんでした。時間をおいて再度お試しください。');
  }

  try {
    const customerId = await ensureCustomer(env, {
      displayName: sessionResult.session.displayName,
      discordId: sessionResult.session.discordId,
      consentPublic: sessionResult.session.consentPublic,
    });

    const session = await createCheckoutSession(env, customerId, parsed.priceKey, parsed.mode, baseUrl);

    return jsonResponse(session, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('[checkout/session] failed to create checkout session', message);
    return errorResponse(500, 'internal', 'Stripe との連携に失敗しました。時間をおいて再試行してください。');
  }
};
