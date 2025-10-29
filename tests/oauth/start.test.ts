import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

import { onRequestGet } from '../../functions/oauth/start.js';
import { stateCookieService } from '../../src/lib/oauth/stateCookie.js';
import { discordOAuth } from '../../src/lib/oauth/discord.js';
import type { CreateStateCookieOptions } from '../../src/lib/oauth/stateCookie.js';
import type { BuildAuthorizeUrlOptions } from '../../src/lib/oauth/discord.js';

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

function createContext(url: string, env: Env): Context {
  return {
    request: new Request(url),
    env,
    params: {},
    waitUntil: () => {
      // noop
    },
    next: async () => new Response(null, { status: 404 }),
  };
}

describe('GET /oauth/start', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('consent_public=true で state Cookie を発行し Discord へリダイレクトする', async () => {
    let stateOptions: CreateStateCookieOptions | undefined;
    let authorizeOptions: BuildAuthorizeUrlOptions | undefined;

    const stateMock = mock.method(
      stateCookieService,
      'createStateCookie',
      (async (options: CreateStateCookieOptions) => {
        stateOptions = options;
        return {
          value: 'signed-cookie-value',
          nonce: 'mock-uuid',
        };
      }) as unknown as (...args: unknown[]) => unknown,
    );

    const authorizeMock = mock.method(
      discordOAuth,
      'buildAuthorizeUrl',
      ((options: BuildAuthorizeUrlOptions) => {
        authorizeOptions = options;
        return 'https://discord.example.com/mock-authorize';
      }) as unknown as (...args: unknown[]) => unknown,
    );

    const context = createContext(
      'https://portal.example.com/oauth/start?consent_public=true',
      {
        COOKIE_SIGN_KEY: 'test-cookie-secret',
        DISCORD_CLIENT_ID: 'discord-client-id',
        DISCORD_REDIRECT_URI: 'https://portal.example.com/oauth/callback',
      },
    );

    const response = await onRequestGet(context);

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), 'https://discord.example.com/mock-authorize');
    assert.equal(response.headers.get('Set-Cookie'),
      'state=signed-cookie-value; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600');

    assert.equal(stateMock.mock.callCount(), 1);
    assert.ok(stateOptions);
    assert.equal(stateOptions?.consentPublic, true);
    assert.equal(stateOptions?.keySource, context.env);

    assert.equal(authorizeMock.mock.callCount(), 1);
    assert.ok(authorizeOptions);
    assert.deepEqual(authorizeOptions, {
      clientId: 'discord-client-id',
      redirectUri: 'https://portal.example.com/oauth/callback',
      state: 'mock-uuid',
    });
  });

  it('consent_public が未指定なら false として処理する', async () => {
    let stateOptions: CreateStateCookieOptions | undefined;

    mock.method(
      stateCookieService,
      'createStateCookie',
      (async (options: CreateStateCookieOptions) => {
        stateOptions = options;
        return {
          value: 'signed-cookie-value',
          nonce: 'default-uuid',
        };
      }) as unknown as (...args: unknown[]) => unknown,
    );

    mock.method(
      discordOAuth,
      'buildAuthorizeUrl',
      (() => 'https://discord.example.com/mock-authorize') as unknown as (...args: unknown[]) => unknown,
    );

    const context = createContext('https://portal.example.com/oauth/start', {
      COOKIE_SIGN_KEY: 'test-cookie-secret',
      DISCORD_CLIENT_ID: 'discord-client-id',
      DISCORD_REDIRECT_URI: 'https://portal.example.com/oauth/callback',
    });

    await onRequestGet(context);

    assert.ok(stateOptions);
    assert.equal(stateOptions?.consentPublic, false);
  });

  it('consent_public が不正な値なら 400 を返す', async () => {
    const stateMock = mock.method(
      stateCookieService,
      'createStateCookie',
      (async () => ({
        value: 'signed-cookie-value',
        nonce: 'unused',
      })) as unknown as (...args: unknown[]) => unknown,
    );

    mock.method(
      discordOAuth,
      'buildAuthorizeUrl',
      (() => 'https://discord.example.com/mock-authorize') as unknown as (...args: unknown[]) => unknown,
    );

    const context = createContext(
      'https://portal.example.com/oauth/start?consent_public=maybe',
      {
        COOKIE_SIGN_KEY: 'test-cookie-secret',
        DISCORD_CLIENT_ID: 'discord-client-id',
        DISCORD_REDIRECT_URI: 'https://portal.example.com/oauth/callback',
      },
    );

    const response = await onRequestGet(context);

    assert.equal(response.status, 400);
    assert.equal(await response.text(), 'Invalid consent_public value');
    assert.equal(stateMock.mock.callCount(), 0);
  });

  it('環境変数が不足している場合は 500 を返す', async () => {
    mock.method(
      stateCookieService,
      'createStateCookie',
      (async () => ({
        value: 'signed-cookie-value',
        nonce: 'unused',
      })) as unknown as (...args: unknown[]) => unknown,
    );

    mock.method(
      discordOAuth,
      'buildAuthorizeUrl',
      (() => 'https://discord.example.com/mock-authorize') as unknown as (...args: unknown[]) => unknown,
    );

    const context = createContext('https://portal.example.com/oauth/start', {
      COOKIE_SIGN_KEY: 'test-cookie-secret',
      DISCORD_REDIRECT_URI: 'https://portal.example.com/oauth/callback',
    });

    const response = await onRequestGet(context);

    assert.equal(response.status, 500);
    assert.equal(await response.text(), 'OAuth configuration error');
  });
});
