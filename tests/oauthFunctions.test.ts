import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { onRequestGet as oauthStart } from '../functions/oauth/start.js';
import { onRequestGet as oauthCallback } from '../functions/oauth/callback.js';

type Env = {
  COOKIE_SIGN_KEY?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
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
    env: {
      DISCORD_CLIENT_ID: 'id-from-test',
      DISCORD_CLIENT_SECRET: 'secret-from-test',
      ...env,
    },
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

  it('callback は不正なリクエストの場合にエラー付きで /donate へリダイレクトする', async () => {
    const context = createContext({ COOKIE_SIGN_KEY: 'from-tests' });

    const callbackResponse = await oauthCallback(context);

    assert.equal(callbackResponse.status, 302);
    assert.equal(callbackResponse.headers.get('Location'), '/donate?error=invalid_request');
  });

  it('Cookie 署名キーが未設定の場合 start は 500 を返し、callback はエラーになる', async () => {
    const context = createContext({});

    const startResponse = await oauthStart(context);

    assert.equal(startResponse.status, 500);

    const callbackResponse = await oauthCallback(context);

    assert.equal(callbackResponse.status, 302);
    assert.match(callbackResponse.headers.get('Location') || '', /error=/);
  });
});
