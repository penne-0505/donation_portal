import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { issueSessionCookie } from '../../src/lib/auth/sessionCookie.js';
import { onRequestGet } from '../../functions/api/session.js';

const COOKIE_SIGN_KEY = 'test-cookie-secret';

type Env = { COOKIE_SIGN_KEY: string };

type Context = {
  readonly request: Request;
  readonly env: Env;
  readonly params: Record<string, string>;
  readonly waitUntil: (promise: Promise<unknown>) => void;
  readonly next: () => Promise<Response>;
};

async function createSessionCookie(consentPublic: boolean): Promise<string> {
  const { signedValue } = await issueSessionCookie({
    displayName: 'テストユーザー',
    discordId: '1234567890',
    consentPublic,
    keySource: { COOKIE_SIGN_KEY },
  });
  return `sess=${signedValue}`;
}

function createContext(cookie?: string): Context {
  const headers = new Headers();
  if (cookie) {
    headers.set('cookie', cookie);
  }
  const request = new Request('https://example.com/api/session', {
    method: 'GET',
    headers,
  });
  return {
    request,
    env: { COOKIE_SIGN_KEY },
    params: {},
    waitUntil: () => {
      // noop for tests
    },
    next: async () => new Response(null, { status: 404 }),
  };
}

describe('functions/api/session', () => {
  it('有効なセッションを返す', async () => {
    const cookie = await createSessionCookie(true);
    const context = createContext(cookie);

    const response = await onRequestGet(context);
    const body = (await response.json()) as {
      status: string;
      session?: { displayName: string; consentPublic: boolean; expiresAt: number };
    };

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/json');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(body.status, 'signed-in');
    assert.equal(body.session?.displayName, 'テストユーザー');
    assert.equal(body.session?.consentPublic, true);
    assert.ok(typeof body.session?.expiresAt === 'number');
    assert.equal(response.headers.get('set-cookie'), null);
  });

  it('Cookie が無い場合は signed-out を返す', async () => {
    const context = createContext();
    const response = await onRequestGet(context);
    const body = (await response.json()) as { status: string };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'signed-out');
    assert.equal(response.headers.get('set-cookie'), null);
  });

  it('不正な Cookie はエラーとして扱い、Cookie を破棄する', async () => {
    const context = createContext('sess=invalid.signature');
    const response = await onRequestGet(context);
    const body = (await response.json()) as {
      status: string;
      error?: { code?: string };
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'error');
    assert.equal(body.error?.code, 'invalid_session');
    const setCookie = response.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.match(setCookie ?? '', /Max-Age=0/);
    assert.match(setCookie ?? '', /SameSite=Lax/);
  });
});
