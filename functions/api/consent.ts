import { parseSessionFromCookie } from '../../src/lib/auth/session.js';
import { issueSessionCookie } from '../../src/lib/auth/sessionCookie.js';
import type { CookieKeySource } from '../../src/lib/cookie/signKey.js';
import { createLogger } from '../../src/lib/core/logger.js';
import { requireEnv } from '../../src/lib/core/env.js';
import { errorResponse, noContent, toErrorResponse } from '../../src/lib/core/response.js';
import { now } from '../../src/lib/core/time.js';
import { StripeClient } from '../../src/lib/payments/stripeClient.js';
import { buildCustomerMetadata } from '../../src/lib/payments/metadata.js';

interface ConsentEnv extends CookieKeySource {
  readonly STRIPE_SECRET_KEY?: string;
}

interface ConsentRequestBody {
  readonly consent_public?: unknown;
}

type ConsentParseResult =
  | { readonly ok: true; readonly value: boolean }
  | { readonly ok: false; readonly message: string };

function parseConsentFlag(value: unknown): ConsentParseResult {
  if (value === true) {
    return { ok: true, value: true };
  }
  if (value === false) {
    return { ok: true, value: false };
  }
  return { ok: false, message: 'consent_public は true または false を指定してください。' };
}

function createStripeClient(env: ConsentEnv, requestId: string): StripeClient {
  const secretKey = requireEnv('STRIPE_SECRET_KEY', env, process.env);
  const logger = createLogger('api.consent', { request_id: requestId });
  return new StripeClient({ apiKey: secretKey, logger });
}

async function readJson(request: Request): Promise<ConsentRequestBody | null> {
  try {
    return (await request.json()) as ConsentRequestBody;
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction<ConsentEnv> = async (context) => {
  const { request, env } = context;
  const requestId =
    typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `req_${Date.now()}`;
  const logger = createLogger('api.consent', { request_id: requestId });
  const stripe = createStripeClient(env, requestId);

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
      'セッション情報の検証に失敗しました。Discord で再ログインしてください。',
    );
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
    const customerId = await stripe.searchCustomerByDiscordId(sessionResult.session.discordId);
    if (!customerId) {
      return errorResponse(
        404,
        'not_found',
        '該当する寄付者情報が見つかりませんでした。寄付後に再度お試しください。',
      );
    }

    const timestamp = now();
    const metadata = buildCustomerMetadata(
      {
        displayName: sessionResult.session.displayName,
        discordId: sessionResult.session.discordId,
        consentPublic: parsedConsent.value,
      },
      { consentUpdatedAt: timestamp },
    );
    await stripe.updateCustomerMetadata(customerId, metadata);

    const remainingMs = sessionResult.raw.expiresAt - timestamp;
    const ttlSeconds = Math.max(1, Math.floor(remainingMs / 1000));
    const { cookie: sessionCookie } = await issueSessionCookie({
      displayName: sessionResult.session.displayName,
      discordId: sessionResult.session.discordId,
      consentPublic: parsedConsent.value,
      ttlSeconds,
      now: timestamp,
      keySource: env,
    });

    return noContent({ headers: { 'Set-Cookie': sessionCookie } });
  } catch (error) {
    logger.error('consent_update_failed', {
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return toErrorResponse(error, '同意状態の更新に失敗しました。時間をおいて再実行してください。');
  }
};
