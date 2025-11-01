import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { issueSessionCookie } from '../../src/lib/auth/sessionCookie.js';
import { onRequestPost } from '../../functions/api/checkout/session.js';

interface Env {
  COOKIE_SIGN_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  PRICE_ONE_TIME_300?: string;
  PRICE_SUB_MONTHLY_300?: string;
  PRICE_SUB_YEARLY_3000?: string;
  APP_BASE_URL?: string;
}

interface Context {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: () => Promise<Response>;
}

const COOKIE_SIGN_KEY = 'test-cookie-secret';
const STRIPE_SECRET_KEY = 'stripe-test-secret';
const PRICE_ONE_TIME_300 = 'price_300_one_time';
const PRICE_SUB_MONTHLY_300 = 'price_sub_monthly_300';
const PRICE_SUB_YEARLY_3000 = 'price_sub_yearly_3000';
const APP_BASE_URL = 'https://donation.example';

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_CONSOLE_ERROR = console.error;
const ORIGINAL_DATE_NOW = Date.now;

const FIXED_NOW = 1_700_000_000_000;
const FIXED_NOW_ISO = new Date(FIXED_NOW).toISOString();

const DEFAULT_ENV: Env = {
  COOKIE_SIGN_KEY,
  STRIPE_SECRET_KEY,
  PRICE_ONE_TIME_300,
  PRICE_SUB_MONTHLY_300,
  PRICE_SUB_YEARLY_3000,
  APP_BASE_URL,
};

function createRequest(body: unknown, cookie?: string, options: { origin?: string } = {}): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (cookie) {
    headers.set('cookie', cookie);
  }
  const origin = options.origin ?? 'https://donation.example';
  return new Request(`${origin}/api/checkout/session`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function createContext(request: Request, overrides: Partial<Env> = {}): Context {
  return {
    request,
    env: { ...DEFAULT_ENV, ...overrides },
    params: {},
    waitUntil: () => {
      // noop
    },
    next: async () => new Response(null, { status: 404 }),
  };
}

async function createSessionCookie(
  displayName: string,
  consent: boolean,
  discordId = '123456789',
): Promise<string> {
  const { signedValue } = await issueSessionCookie({
    displayName,
    discordId,
    consentPublic: consent,
    keySource: { COOKIE_SIGN_KEY },
    now: FIXED_NOW,
  });
  return `sess=${signedValue}`;
}

describe('functions/api/checkout/session', () => {
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

  it('Stripe Checkout セッションを作成し URL を返す', async () => {
    const cookieHeader = await createSessionCookie('寄附ユーザー', true);
    const request = createRequest(
      { mode: 'payment', interval: null, variant: 'fixed300' },
      cookieHeader,
    );
    const context = createContext(request);

    let fetchCalls = 0;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls += 1;
      const url = String(input);
      const method = init?.method ?? (input instanceof Request ? input.method : undefined);
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('Authorization'), `Bearer ${STRIPE_SECRET_KEY}`);
      if (method === 'POST') {
        assert.equal(headers.get('Content-Type'), 'application/x-www-form-urlencoded');
      }

      if (fetchCalls === 1) {
        assert.equal(method, 'GET');
        const searchUrl = new URL(url);
        assert.equal(
          `${searchUrl.origin}${searchUrl.pathname}`,
          'https://api.stripe.com/v1/customers/search',
        );
        assert.equal(searchUrl.searchParams.get('query'), `metadata['discord_id']:"123456789"`);
        assert.equal(searchUrl.searchParams.get('limit'), '1');
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (fetchCalls === 2) {
        assert.equal(method, 'POST');
        assert.equal(url, 'https://api.stripe.com/v1/customers');
        const body = new URLSearchParams(init?.body as string);
        assert.equal(body.get('metadata[display_name]'), '寄附ユーザー');
        assert.equal(body.get('metadata[display_name_source]'), 'discord');
        assert.equal(body.get('metadata[discord_id]'), '123456789');
        assert.equal(body.get('metadata[consent_public]'), 'true');
        assert.equal(body.get('metadata[last_checkout_at]'), FIXED_NOW_ISO);
        assert.equal(body.get('name'), '寄附ユーザー');
        return new Response(JSON.stringify({ id: 'cus_123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      assert.equal(fetchCalls, 3);
      assert.equal(method, 'POST');
      assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
      const body = new URLSearchParams(init?.body as string);
      assert.equal(body.get('mode'), 'payment');
      assert.equal(body.get('customer'), 'cus_123');
      assert.equal(body.get('line_items[0][price]'), PRICE_ONE_TIME_300);
      assert.equal(body.get('line_items[0][quantity]'), '1');
      assert.equal(body.get('success_url'), `${APP_BASE_URL}/thanks`);
      assert.equal(body.get('cancel_url'), `${APP_BASE_URL}/donate`);
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/session_test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const response = await onRequestPost(context);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = (await response.json()) as { url?: string };
    assert.equal(body.url, 'https://checkout.stripe.com/session_test');
    assert.equal(fetchCalls, 3);
  });

  it('既存顧客がいる場合は metadata を更新して Checkout を作成する', async () => {
    const cookieHeader = await createSessionCookie('再訪ユーザー', false, '987654321');
    const request = createRequest(
      { mode: 'subscription', interval: 'monthly', variant: 'fixed300' },
      cookieHeader,
    );
    const context = createContext(request);

    const callHistory: Array<{ url: string; method?: string; body?: URLSearchParams }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? (input instanceof Request ? input.method : undefined);
      const body = typeof init?.body === 'string' ? new URLSearchParams(init.body) : undefined;
      callHistory.push({ url, method, body });

      const parsed = new URL(url);
      if (parsed.pathname.endsWith('/customers/search')) {
        return new Response(JSON.stringify({ data: [{ id: 'cus_existing' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.endsWith('/customers/cus_existing')) {
        assert.equal(body?.get('metadata[consent_public]'), 'false');
        assert.equal(body?.get('metadata[last_checkout_at]'), FIXED_NOW_ISO);
        return new Response(JSON.stringify({ id: 'cus_existing' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/subscription' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const response = await onRequestPost(context);

    assert.equal(response.status, 200);
    const body = (await response.json()) as { url?: string };
    assert.equal(body.url, 'https://checkout.stripe.com/subscription');
    assert.equal(callHistory.length, 3);
    assert.equal(callHistory[0]?.method, 'GET');
    const searchUrl = new URL(callHistory[0]?.url ?? '');
    assert.equal(searchUrl.searchParams.get('query'), `metadata['discord_id']:"987654321"`);
    assert.equal(searchUrl.searchParams.get('limit'), '1');
    assert.equal(callHistory[1]?.url, 'https://api.stripe.com/v1/customers/cus_existing');
    assert.equal(callHistory[1]?.method, 'POST');
    assert.equal(callHistory[2]?.method, 'POST');
    assert.equal(callHistory[2]?.body?.get('line_items[0][price]'), PRICE_SUB_MONTHLY_300);
  });

  it('sess Cookie がない場合は 401 を返す', async () => {
    const request = createRequest({ mode: 'payment', interval: null, variant: 'fixed300' });
    const response = await onRequestPost(createContext(request));

    assert.equal(response.status, 401);
    const body = (await response.json()) as { error?: { code?: string } };
    assert.equal(body.error?.code, 'unauthorized');
  });

  it('不正な組合せは 400 を返す', async () => {
    const cookieHeader = await createSessionCookie('不正ユーザー', true);
    const request = createRequest(
      { mode: 'subscription', interval: 'monthly', variant: 'fixed3000' },
      cookieHeader,
    );
    const response = await onRequestPost(createContext(request));

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    assert.equal(body.error?.code, 'bad_request');
    assert.match(body.error?.message ?? '', /monthly/);
  });

  it('Stripe API がエラーを返した場合は 500 を返しログ出力する', async () => {
    const cookieHeader = await createSessionCookie('障害ユーザー', true);
    const request = createRequest(
      { mode: 'payment', interval: null, variant: 'fixed300' },
      cookieHeader,
    );
    const context = createContext(request);

    const errors: string[] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args.map((value) => String(value)).join(' '));
    };

    globalThis.fetch = async () =>
      new Response('stripe error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });

    const response = await onRequestPost(context);

    assert.equal(response.status, 500);
    const body = (await response.json()) as { error?: { code?: string } };
    assert.equal(body.error?.code, 'internal');
    assert.ok(errors.some((entry) => entry.includes('checkout_session_failed')));
  });

  it('APP_BASE_URL が未設定の場合はリクエストの Origin を利用する', async () => {
    const cookieHeader = await createSessionCookie('フォールバックユーザー', true);
    const origin = 'https://fallback.example';
    const request = createRequest(
      { mode: 'payment', interval: null, variant: 'fixed300' },
      cookieHeader,
      { origin },
    );
    const context = createContext(request, { APP_BASE_URL: undefined });

    let fetchCalls = 0;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls += 1;
      const url = String(input);
      const method = init?.method ?? (input instanceof Request ? input.method : undefined);

      if (fetchCalls === 1) {
        assert.equal(method, 'GET');
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (fetchCalls === 2) {
        assert.equal(method, 'POST');
        assert.equal(url, 'https://api.stripe.com/v1/customers');
        return new Response(JSON.stringify({ id: 'cus_fb' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      assert.equal(fetchCalls, 3);
      const params = new URLSearchParams(init?.body as string);
      assert.equal(params.get('success_url'), `${origin}/thanks`);
      assert.equal(params.get('cancel_url'), `${origin}/donate`);
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/fallback' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const response = await onRequestPost(context);

    assert.equal(response.status, 200);
    const body = (await response.json()) as { url?: string };
    assert.equal(body.url, 'https://checkout.stripe.com/fallback');
    assert.equal(fetchCalls, 3);
  });

  it('価格 ID が未設定の場合は 500 を返しエラーログを出力する', async () => {
    const cookieHeader = await createSessionCookie('価格未設定ユーザー', true);
    const request = createRequest(
      { mode: 'payment', interval: null, variant: 'fixed300' },
      cookieHeader,
    );
    const context = createContext(request, { PRICE_ONE_TIME_300: undefined });

    const errorMessages: string[] = [];
    let errorLogCount = 0;
    console.error = (...args: unknown[]) => {
      errorLogCount += 1;
      errorMessages.push(args.map((part) => String(part)).join(' '));
    };

    let fetchCalls = 0;
    let checkoutCalled = false;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls += 1;
      const url = String(input);
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const method = init?.method ?? (input instanceof Request ? input.method : undefined);

      if (pathname.endsWith('/customers/search')) {
        assert.equal(method, 'GET');
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (pathname.endsWith('/customers')) {
        assert.equal(method, 'POST');
        return new Response(JSON.stringify({ id: 'cus_missing_price' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (pathname.endsWith('/checkout/sessions')) {
        checkoutCalled = true;
        throw new Error('Checkout API should not be called when price id is missing');
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    };

    const response = await onRequestPost(context);

    assert.equal(response.status, 500);
    const body = (await response.json()) as { error?: { code?: string } };
    assert.equal(body.error?.code, 'internal');
    assert.ok(fetchCalls >= 1);
    assert.equal(checkoutCalled, false);
    assert.ok(errorLogCount >= 1);
    assert.ok(
      errorMessages.some((msg) => msg.includes('PRICE_ONE_TIME_300')),
      'console.error should report missing price id',
    );
  });
});
