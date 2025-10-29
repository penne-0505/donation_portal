import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { onRequestGet as oauthStart } from '../functions/oauth/start.js';
import { onRequestGet as oauthCallback } from '../functions/oauth/callback.js';

type Env = { COOKIE_SIGN_KEY?: string };

type Context = {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: () => Promise<Response>;
};

function createContext(env: Env): Context {
  return {
    request: new Request('https://example.com/mock'),
    env,
    params: {},
    waitUntil: () => {
      // noop
    },
    next: async () => new Response(null, { status: 404 }),
  };
}

describe('OAuth Functions', () => {
  it('Cookie 署名キーがあれば 501 を返す', async () => {
    const context = createContext({ COOKIE_SIGN_KEY: 'from-tests' });

    const startResponse = await oauthStart(context);
    const callbackResponse = await oauthCallback(context);

    assert.equal(startResponse.status, 501);
    assert.equal(callbackResponse.status, 501);
  });

  it('Cookie 署名キーが未設定の場合はエラーを投げる', async () => {
    const context = createContext({});

    let startError: unknown;
    try {
      await oauthStart(context);
    } catch (error) {
      startError = error;
    }

    assert.ok(startError instanceof Error);
    assert.match((startError as Error).message, /COOKIE_SIGN_KEY/);

    let callbackError: unknown;
    try {
      await oauthCallback(context);
    } catch (error) {
      callbackError = error;
    }

    assert.ok(callbackError instanceof Error);
    assert.match((callbackError as Error).message, /COOKIE_SIGN_KEY/);
  });
});
