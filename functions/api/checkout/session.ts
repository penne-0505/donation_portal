import { parseSessionFromCookie } from '../../../src/lib/auth/session.js';
import type { CookieKeySource } from '../../../src/lib/cookie/signKey.js';
import { createLogger } from '../../../src/lib/core/logger.js';
import { requireEnv } from '../../../src/lib/core/env.js';
import {
  jsonResponse,
  errorResponse,
  httpError,
  toErrorResponse,
} from '../../../src/lib/core/response.js';
import { now } from '../../../src/lib/core/time.js';
import { StripeClient } from '../../../src/lib/payments/stripeClient.js';

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

type CheckoutEnvKey = keyof Pick<
  CheckoutEnv,
  'PRICE_ONE_TIME_300' | 'PRICE_SUB_MONTHLY_300' | 'PRICE_SUB_YEARLY_3000'
>;

type CheckoutMode =
  | { readonly ok: true; readonly mode: 'payment'; readonly priceKey: 'PRICE_ONE_TIME_300' }
  | {
      readonly ok: true;
      readonly mode: 'subscription';
      readonly priceKey: 'PRICE_SUB_MONTHLY_300' | 'PRICE_SUB_YEARLY_3000';
    }
  | { readonly ok: false; readonly message: string };

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

function parseBody(body: CheckoutRequestBody): CheckoutMode {
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

function resolvePriceId(env: CheckoutEnv, priceKey: CheckoutEnvKey): string {
  const value = env[priceKey];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw httpError(500, 'internal', `Price id ${priceKey} is not configured`);
}

function createStripeClient(env: CheckoutEnv, requestId: string): StripeClient {
  const secretKey = requireEnv('STRIPE_SECRET_KEY', env, process.env);
  const logger = createLogger('api.checkout.session', { request_id: requestId });
  return new StripeClient({ apiKey: secretKey, logger });
}

export const onRequestPost: PagesFunction<CheckoutEnv> = async (context) => {
  const env = context.env;
  const request = context.request;
  const requestId =
    typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `req_${Date.now()}`;
  const stripe = createStripeClient(env, requestId);
  const logger = createLogger('api.checkout.session', { request_id: requestId });

  const sessionResult = await parseSessionFromCookie({
    cookieHeader: request.headers.get('cookie'),
    keySource: env,
  });

  if (sessionResult.status === 'missing') {
    return errorResponse(
      401,
      'unauthorized',
      'Discord ログインが必要です。再度ログインしてください。',
    );
  }

  if (sessionResult.status === 'invalid') {
    logger.error('invalid_session_cookie', { reason: sessionResult.reason });
    return errorResponse(
      401,
      'unauthorized',
      'セッション情報を再取得してください。Discord でのログインからやり直してください。',
    );
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
    logger.error('failed_to_resolve_base_url');
    return errorResponse(
      500,
      'internal',
      '寄付を開始できませんでした。時間をおいて再度お試しください。',
    );
  }

  const timestamp = now();
  try {
    const customerId = await stripe.ensureCustomer(
      {
        displayName: sessionResult.session.displayName,
        discordId: sessionResult.session.discordId,
        consentPublic: sessionResult.session.consentPublic,
      },
      { lastCheckoutAt: timestamp },
    );

    const priceId = resolvePriceId(env, parsed.priceKey);

    const params = new URLSearchParams({
      mode: parsed.mode,
      customer: customerId,
      success_url: `${baseUrl}/thanks`,
      cancel_url: `${baseUrl}/donate`,
    });
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');

    const session = await stripe.createCheckoutSession(params);
    logger.info('checkout_session_created', {
      customer_id: customerId,
      mode: parsed.mode,
    });

    return jsonResponse(session, 200);
  } catch (error) {
    logger.error('checkout_session_failed', {
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return toErrorResponse(
      error,
      'Stripe との連携に失敗しました。時間をおいて再試行してください。',
    );
  }
};
