import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSignedCookie, verifySignedCookie } from '../../src/lib/auth/cookie.js';
import { onRequestGet } from '../../functions/oauth/callback.js';

type Env = {
  COOKIE_SIGN_KEY: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
};

type Context = {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: () => Promise<Response>;
};

const COOKIE_SIGN_KEY = 'test-cookie-secret';
const DISCORD_CLIENT_ID = 'discord-client-id';
const DISCORD_CLIENT_SECRET = 'discord-client-secret';
const NOW = new Date('2024-01-01T00:00:00.000Z');

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_CONSOLE_ERROR = console.error;
const ORIGINAL_DATE_NOW = Date.now;

function createContext(url: string, cookieHeader?: string): Context {
  const headers = new Headers();
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }
  return {
    request: new Request(url, { headers }),
    env: {
      COOKIE_SIGN_KEY,
      DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET,
    },
    params: {},
    waitUntil: () => {
      // noop
    },
    next: async () => new Response(null, { status: 404 }),
  };
}

async function createStateCookie(value: object, now: Date = NOW): Promise<string> {
  const cookieValue = await createSignedCookie({
    name: 'state',
    value: JSON.stringify(value),
    ttlSeconds: 600,
    now,
    keySource: { COOKIE_SIGN_KEY },
  });
  return cookieValue;
}

describe('functions/oauth/callback', () => {
  beforeEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    console.error = ORIGINAL_CONSOLE_ERROR;
    Date.now = () => NOW.getTime();
  });

  after(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    console.error = ORIGINAL_CONSOLE_ERROR;
    Date.now = ORIGINAL_DATE_NOW;
  });

  it('state 検証成功で Discord から情報を取得し sess Cookie を発行する', async () => {
    const stateCookie = await createStateCookie({
      nonce: 'state-token',
      consent_public: true,
      exp: Math.floor(NOW.getTime() / 1000) + 600,
    });

    const context = createContext(
      'https://donation.example/oauth/callback?code=auth-code&state=state-token',
      `state=${stateCookie}`,
    );

    let fetchCalls = 0;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls += 1;
      if (fetchCalls === 1) {
        assert.equal(String(input), 'https://discord.com/api/oauth2/token');
        assert.equal(init?.method, 'POST');
        const headers = new Headers(init?.headers);
        assert.equal(
          headers.get('Authorization'),
          `Basic ${Buffer.from(
            `${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`,
            'binary',
          ).toString('base64')}`,
        );
        assert.equal(headers.get('Content-Type'), 'application/x-www-form-urlencoded');
        const body = new URLSearchParams(init?.body as string);
        assert.equal(body.get('grant_type'), 'authorization_code');
        assert.equal(body.get('code'), 'auth-code');
        assert.equal(body.get('redirect_uri'), 'https://donation.example/oauth/callback');

        return new Response(
          JSON.stringify({ access_token: 'access-token', token_type: 'Bearer' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      assert.equal(fetchCalls, 2);
      assert.equal(String(input), 'https://discord.com/api/users/@me');
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('Authorization'), 'Bearer access-token');

      return new Response(
        JSON.stringify({ id: 'discord-user-id', global_name: 'Display Name', username: 'Fallback' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    };

    const response = await onRequestGet(context);

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/donate');
    const setCookie = response.headers.get('Set-Cookie');
    assert.ok(setCookie?.startsWith('sess='));
    assert.match(setCookie ?? '', /HttpOnly/);
    assert.match(setCookie ?? '', /Secure/);
    assert.match(setCookie ?? '', /SameSite=Lax/);
    assert.match(setCookie ?? '', /Max-Age=600/);

    const sessValue = (setCookie ?? '').split(';')[0].split('=')[1];
    const verified = await verifySignedCookie({
      name: 'sess',
      cookie: sessValue,
      now: NOW,
      keySource: { COOKIE_SIGN_KEY },
    });
    const payload = JSON.parse(verified.value) as {
      display_name: string;
      discord_id: string;
      consent_public: boolean;
      exp: number;
    };

    assert.equal(payload.display_name, 'Display Name');
    assert.equal(payload.discord_id, 'discord-user-id');
    assert.equal(payload.consent_public, true);
    assert.equal(payload.exp, Math.floor((NOW.getTime() + 600_000) / 1000));
    assert.equal(fetchCalls, 2);
  });

  it('state が一致しない場合はエラー付きで /donate にリダイレクトしログを出力する', async () => {
    const stateCookie = await createStateCookie({
      nonce: 'original-state',
      consent_public: false,
      exp: Math.floor(NOW.getTime() / 1000) + 600,
    });
    const context = createContext(
      'https://donation.example/oauth/callback?code=auth-code&state=unexpected-state',
      `state=${stateCookie}`,
    );

    globalThis.fetch = () => {
      throw new Error('fetch should not be called');
    };

    const errors: unknown[] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args.join(' '));
    };

    const response = await onRequestGet(context);

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/donate?error=state_mismatch');
    assert.equal(response.headers.get('Set-Cookie'), null);
    assert.equal(errors.length, 1);
    assert.match(String(errors[0]), /state_mismatch/);
    assert.ok(!String(errors[0]).includes('auth-code'));
  });

  it('state Cookie の TTL 超過時は state_expired エラーになる', async () => {
    const issuedAt = new Date('2024-01-01T00:00:00.000Z');
    const stateCookie = await createStateCookie(
      {
        nonce: 'state-token',
        consent_public: false,
        exp: Math.floor(issuedAt.getTime() / 1000) + 600,
      },
      issuedAt,
    );

    Date.now = () => new Date('2024-01-01T00:11:00.000Z').getTime();
    const context = createContext(
      'https://donation.example/oauth/callback?code=auth-code&state=state-token',
      `state=${stateCookie}`,
    );

    globalThis.fetch = () => {
      throw new Error('fetch should not be called');
    };

    const errors: unknown[] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args.join(' '));
    };

    const response = await onRequestGet(context);

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/donate?error=state_expired');
    assert.equal(response.headers.get('Set-Cookie'), null);
    assert.equal(errors.length, 1);
    assert.match(String(errors[0]), /state_expired/);
    assert.ok(!String(errors[0]).includes('auth-code'));
  });

  it('Discord のトークン取得が失敗すると discord_token_error でリダイレクトする', async () => {
    const stateCookie = await createStateCookie({
      nonce: 'state-token',
      consent_public: true,
      exp: Math.floor(NOW.getTime() / 1000) + 600,
    });
    const context = createContext(
      'https://donation.example/oauth/callback?code=auth-code&state=state-token',
      `state=${stateCookie}`,
    );

    globalThis.fetch = async () =>
      new Response('error', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });

    const errors: unknown[] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args.join(' '));
    };

    const response = await onRequestGet(context);

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/donate?error=discord_token_error');
    assert.equal(response.headers.get('Set-Cookie'), null);
    assert.equal(errors.length, 1);
    assert.match(String(errors[0]), /discord_token_error/);
    assert.ok(!String(errors[0]).includes('auth-code'));
  });

  it('Discord のユーザー取得が失敗すると discord_user_error でリダイレクトする', async () => {
    const stateCookie = await createStateCookie({
      nonce: 'state-token',
      consent_public: true,
      exp: Math.floor(NOW.getTime() / 1000) + 600,
    });
    const context = createContext(
      'https://donation.example/oauth/callback?code=auth-code&state=state-token',
      `state=${stateCookie}`,
    );

    let called = false;
    globalThis.fetch = async (_input: RequestInfo | URL, _init?: RequestInit) => {
      if (!called) {
        called = true;
        return new Response(
          JSON.stringify({ access_token: 'access-token', token_type: 'Bearer' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
      return new Response('error', { status: 500 });
    };

    const errors: unknown[] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args.join(' '));
    };

    const response = await onRequestGet(context);

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/donate?error=discord_user_error');
    assert.equal(response.headers.get('Set-Cookie'), null);
    assert.equal(errors.length, 1);
    assert.match(String(errors[0]), /discord_user_error/);
    assert.ok(!String(errors[0]).includes('auth-code'));
  });
});
