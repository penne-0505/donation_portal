import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  __resetStripeWebhookStateForTesting,
  onRequestPost,
} from '../../functions/api/webhooks/stripe.js';

const SECRET = 'whsec_test_secret';
const encoder = new TextEncoder();

type Env = {
  readonly STRIPE_WEBHOOK_SECRET: string;
};

type Context = {
  readonly request: Request;
  readonly env: Env;
  readonly params: Record<string, string>;
  readonly waitUntil: (promise: Promise<unknown>) => void;
  readonly next: () => Promise<Response>;
};

async function signPayload(rawBody: string, timestamp: number): Promise<string> {
  const payloadToSign = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadToSign));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function createContext(
  body: Record<string, unknown>,
  options: { timestamp?: number; signature?: string } = {},
): Promise<Context> {
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify(body);
  const signature = typeof options.signature === 'string' ? options.signature : await signPayload(rawBody, timestamp);
  const headers = new Headers({
    'stripe-signature': `t=${timestamp},v1=${signature}`,
    'content-type': 'application/json',
  });
  const request = new Request('https://example.com/api/webhooks/stripe', {
    method: 'POST',
    headers,
    body: rawBody,
  });
  return {
    request,
    env: { STRIPE_WEBHOOK_SECRET: SECRET },
    params: {},
    waitUntil: () => {
      // noop for tests
    },
    next: async () => new Response('not found', { status: 404 }),
  } satisfies Context;
}

describe('functions/api/webhooks/stripe', () => {
  beforeEach(() => {
    __resetStripeWebhookStateForTesting();
  });

  it('有効な署名付きイベントを受け取り 200 を返す', async () => {
    const event = {
      id: 'evt_test_1',
      type: 'payment_intent.succeeded',
      created: 1700000000,
      livemode: false,
    } as const;
    const context = await createContext(event);

    const response = await onRequestPost(context);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = (await response.json()) as { readonly received?: boolean };
    assert.equal(body.received, true);
  });

  it('重複イベントを冪等的に処理する', async () => {
    const event = {
      id: 'evt_duplicate',
      type: 'invoice.paid',
      created: 1700000001,
      livemode: true,
    } as const;
    const first = await createContext(event);
    const second = await createContext(event);

    const firstResponse = await onRequestPost(first);
    const secondResponse = await onRequestPost(second);

    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    const firstBody = (await firstResponse.json()) as { readonly received?: boolean };
    const secondBody = (await secondResponse.json()) as { readonly received?: boolean };
    assert.equal(firstBody.received, true);
    assert.equal(secondBody.received, true);
  });

  it('署名が不正な場合は 400 を返す', async () => {
    const event = { id: 'evt_invalid_sig', type: 'payment_intent.succeeded' } as const;
    const context = await createContext(event, { signature: 'invalid-signature' });

    const response = await onRequestPost(context);

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error?: { readonly code?: string } };
    assert.equal(body.error?.code, 'bad_request');
  });

  it('event.id が欠如している場合は 400 を返す', async () => {
    const payload = { type: 'payment_intent.succeeded' };
    const context = await createContext(payload);

    const response = await onRequestPost(context);

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error?: { readonly code?: string } };
    assert.equal(body.error?.code, 'bad_request');
  });
});
