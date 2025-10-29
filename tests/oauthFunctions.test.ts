import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { onRequestGet as oauthStart } from '../functions/oauth/start.js';
import { onRequestGet as oauthCallback } from '../functions/oauth/callback.js';

type Env = {
  COOKIE_SIGN_KEY?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_REDIRECT_URI?: string;
};

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
  it('start は構成不足の場合 500 を返す', async () => {
    const context = createContext({ COOKIE_SIGN_KEY: 'from-tests' });

    const startResponse = await oauthStart(context);

    assert.equal(startResponse.status, 500);
  });

  it('callback は未実装のため 501 を返す', async () => {
    const context = createContext({ COOKIE_SIGN_KEY: 'from-tests' });

    const callbackResponse = await oauthCallback(context);

    assert.equal(callbackResponse.status, 501);
  });

  it('Cookie 署名キーが未設定の場合 start は 500 を返し、callback はエラーになる', async () => {
    const context = createContext({});

    const startResponse = await oauthStart(context);

    assert.equal(startResponse.status, 500);

    await assert.rejects(() => oauthCallback(context), /COOKIE_SIGN_KEY/);
  });
});
