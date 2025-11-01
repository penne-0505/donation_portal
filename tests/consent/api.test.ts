import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { issueSessionCookie, SessionCookiePayloadV2 } from '../../src/lib/auth/sessionCookie.js';
import { verifySignedCookie } from '../../src/lib/auth/cookie.js';
import { onRequestPost } from '../../functions/api/consent.js';

const COOKIE_SIGN_KEY = 'test-cookie-secret';
const STRIPE_SECRET_KEY = 'stripe-test-secret';
const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_CONSOLE_ERROR = console.error;
const ORIGINAL_DATE_NOW = Date.now;

const FIXED_NOW = 1_700_000_000_000;
const FIXED_NOW_ISO = new Date(FIXED_NOW).toISOString();

interface Env {
  COOKIE_SIGN_KEY: string;
  STRIPE_SECRET_KEY: string;
}

interface Context {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: () => Promise<Response>;
}

async function createSessionCookie(consent: boolean): Promise<string> {
  const { signedValue } = await issueSessionCookie({
    displayName: 'テストユーザー',
    discordId: '9876543210',
    consentPublic: consent,
    keySource: { COOKIE_SIGN_KEY },
    now: FIXED_NOW,
  });
  return `sess=${signedValue}`;
}

function createContext(body: unknown, cookie?: string): Context {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (cookie) {
    headers.set('cookie', cookie);
  }
  const request = new Request('https://example.com/api/consent', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return {
    request,
    env: { COOKIE_SIGN_KEY, STRIPE_SECRET_KEY },
    params: {},
    waitUntil: () => {
      // noop
    },
    next: async () => new Response(null, { status: 404 }),
  };
}

describe('functions/api/consent', () => {
  beforeEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    console.error = ORIGINAL_CONSOLE_ERROR;
    Date.now = () => FIXED_NOW;
  });

  after(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    console.error = ORIGINAL_CONSOLE_ERROR;
    Date.now = ORIGINAL_DATE_NOW;
  });

  it('Stripe metadata を更新して 204 を返す', async () => {
    const cookie = await createSessionCookie(true);
    const context = createContext({ consent_public: false }, cookie);

    const calls: Array<{ url: string; method?: string; body?: URLSearchParams }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? (input instanceof Request ? input.method : undefined);
      const body = typeof init?.body === 'string' ? new URLSearchParams(init.body) : undefined;
      calls.push({ url, method, body });
      const parsed = new URL(url);
      if (parsed.pathname.endsWith('/customers/search')) {
        return new Response(JSON.stringify({ data: [{ id: 'cus_123' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      assert.equal(body?.get('metadata[consent_public]'), 'false');
      assert.equal(body?.get('metadata[consent_updated_at]'), FIXED_NOW_ISO);
      return new Response(JSON.stringify({ id: 'cus_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const response = await onRequestPost(context);

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const setCookie = response.headers.get('Set-Cookie');
    assert.ok(setCookie);
    const sessionValue = setCookie?.split(';')[0]?.split('=')[1] ?? '';
    assert.ok(sessionValue);
    const verifiedSession = await verifySignedCookie({
      name: 'sess',
      cookie: sessionValue,
      keySource: { COOKIE_SIGN_KEY },
    });
    const decoded = JSON.parse(verifiedSession.value) as SessionCookiePayloadV2;
    assert.equal(decoded.version, 2);
    assert.equal(decoded.session.display_name, 'テストユーザー');
    assert.equal(decoded.session.consent_public, false);
    assert.equal(decoded.exp, Math.floor((FIXED_NOW + 600_000) / 1000));
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.method, 'GET');
    const searchUrl = new URL(calls[0]?.url ?? '');
    assert.equal(searchUrl.searchParams.get('query'), `metadata['discord_id']:"9876543210"`);
    assert.equal(searchUrl.searchParams.get('limit'), '1');
    assert.equal(calls[1]?.method, 'POST');
  });

  it('未ログインの場合は 401 を返す', async () => {
    const context = createContext({ consent_public: true });
    const response = await onRequestPost(context);

    assert.equal(response.status, 401);
    const body = (await response.json()) as { error?: { code?: string } };
    assert.equal(body.error?.code, 'unauthorized');
  });

  it('セッションが不正な場合は 401 を返す', async () => {
    console.error = () => {
      // suppress noisy log
    };
    const headers = new Headers({
      'content-type': 'application/json',
      cookie: 'sess=invalid.signature',
    });
    const request = new Request('https://example.com/api/consent', {
      method: 'POST',
      headers,
      body: JSON.stringify({ consent_public: true }),
    });
    const context: Context = {
      request,
      env: { COOKIE_SIGN_KEY, STRIPE_SECRET_KEY },
      params: {},
      waitUntil: () => {},
      next: async () => new Response(null, { status: 404 }),
    };

    const response = await onRequestPost(context);
    assert.equal(response.status, 401);
  });

  it('consent_public が不正な場合は 400 を返す', async () => {
    const cookie = await createSessionCookie(true);
    const context = createContext({ consent_public: 'yes' }, cookie);

    const response = await onRequestPost(context);
    assert.equal(response.status, 400);
  });

  it('対象顧客が存在しない場合は 404 を返す', async () => {
    const cookie = await createSessionCookie(true);
    const context = createContext({ consent_public: false }, cookie);

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      const parsed = new URL(url);
      if (parsed.pathname.endsWith('/customers/search')) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('not-found', { status: 404 });
    };

    const response = await onRequestPost(context);
    assert.equal(response.status, 404);
  });
});
