import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { onRequestGet } from '../../functions/api/donors.js';

const STRIPE_SECRET_KEY = 'test-stripe-secret';
const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_CONSOLE_ERROR = console.error;
const ORIGINAL_MATH_RANDOM = Math.random;

type Env = {
  STRIPE_SECRET_KEY: string;
};

type Context = {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: () => Promise<Response>;
};

function createContext(url: string): Context {
  return {
    request: new Request(url, { method: 'GET' }),
    env: { STRIPE_SECRET_KEY },
    params: {},
    waitUntil: () => {
      // noop for tests
    },
    next: async () => new Response(null, { status: 404 }),
  };
}

describe('functions/api/donors', () => {
  beforeEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    console.error = ORIGINAL_CONSOLE_ERROR;
    Math.random = ORIGINAL_MATH_RANDOM;
  });

  after(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    console.error = ORIGINAL_CONSOLE_ERROR;
    Math.random = ORIGINAL_MATH_RANDOM;
  });

  it('Stripe から同意済み Donor を取得しレスポンスを返す', async () => {
    const calls: Array<{ url: string; body: URLSearchParams }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const params = new URLSearchParams(init?.body as string);
      calls.push({ url, body: params });
      return new Response(
        JSON.stringify({
          data: [
            { metadata: { display_name: 'Alice' } },
            { metadata: { display_name: ' Bob ' } },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    };

    const context = createContext('https://example.com/api/donors');
    const response = await onRequestGet(context);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
    const etag = response.headers.get('etag');
    assert.ok(etag && etag.startsWith('W/"'));

    const body = (await response.json()) as { donors?: string[]; count?: number };
    assert.deepEqual(body.donors, ['Alice', 'Bob']);
    assert.equal(body.count, 2);

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, 'https://api.stripe.com/v1/customers/search');
    assert.equal(calls[0]?.body.get('limit'), '100');
    assert.equal(calls[0]?.body.get('order'), 'desc');
    assert.equal(calls[0]?.body.get('query'), "metadata['consent_public']:'true'");
  });

  it('order=random の場合はレスポンスをシャッフルして返す', async () => {
    Math.random = () => 0.1;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          data: [
            { metadata: { display_name: 'Alpha' } },
            { metadata: { display_name: 'Bravo' } },
            { metadata: { display_name: 'Charlie' } },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const context = createContext('https://example.com/api/donors?order=random&limit=3');
    const response = await onRequestGet(context);

    const body = (await response.json()) as { donors?: string[] };
    assert.deepEqual(body.donors, ['Bravo', 'Charlie', 'Alpha']);
  });

  it('limit が不正な場合は 400 を返す', async () => {
    const context = createContext('https://example.com/api/donors?limit=999');
    const response = await onRequestGet(context);

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error?: { code?: string } };
    assert.equal(body.error?.code, 'bad_request');
  });

  it('Stripe API エラー時は 500 を返す', async () => {
    console.error = () => {
      // quiet in tests
    };
    globalThis.fetch = async () => new Response('error', { status: 500 });

    const context = createContext('https://example.com/api/donors');
    const response = await onRequestGet(context);

    assert.equal(response.status, 500);
    const body = (await response.json()) as { error?: { code?: string } };
    assert.equal(body.error?.code, 'internal');
  });
});
