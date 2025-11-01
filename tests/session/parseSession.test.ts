import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSignedCookie } from '../../src/lib/auth/cookie.js';
import { SESSION_COOKIE_NAME, parseSessionFromCookie } from '../../src/lib/auth/session.js';

const COOKIE_SIGN_KEY = 'test-cookie-secret';

async function createCookieHeader(payload: Record<string, unknown>): Promise<string> {
  const value = await createSignedCookie({
    name: SESSION_COOKIE_NAME,
    value: JSON.stringify(payload),
    ttlSeconds: 600,
    now: Date.now(),
    keySource: { COOKIE_SIGN_KEY },
  });
  return `${SESSION_COOKIE_NAME}=${value}`;
}

describe('src/lib/auth/session.parseSessionFromCookie', () => {
  it('display_name が空白のみの場合は invalid を返す', async () => {
    const cookieHeader = await createCookieHeader({
      display_name: '   ',
      discord_id: '123456',
      consent_public: true,
      exp: Math.floor(Date.now() / 1000) + 600,
    });

    const result = await parseSessionFromCookie({
      cookieHeader,
      keySource: { COOKIE_SIGN_KEY },
    });

    assert.equal(result.status, 'invalid');
    if (result.status === 'invalid') {
      assert.equal(result.reason, 'display_name is missing');
    }
  });

  it('discord_id が欠如している場合は invalid を返す', async () => {
    const cookieHeader = await createCookieHeader({
      display_name: '有効ユーザー',
      consent_public: false,
      exp: Math.floor(Date.now() / 1000) + 600,
    });

    const result = await parseSessionFromCookie({
      cookieHeader,
      keySource: { COOKIE_SIGN_KEY },
    });

    assert.equal(result.status, 'invalid');
    if (result.status === 'invalid') {
      assert.equal(result.reason, 'discord_id is missing');
    }
  });

  it('exp が数値でない場合は invalid を返す', async () => {
    const cookieHeader = await createCookieHeader({
      display_name: '期限不正ユーザー',
      discord_id: '999',
      consent_public: true,
      exp: 'invalid-exp',
    } as Record<string, unknown>);

    const result = await parseSessionFromCookie({
      cookieHeader,
      keySource: { COOKIE_SIGN_KEY },
    });

    assert.equal(result.status, 'invalid');
    if (result.status === 'invalid') {
      assert.equal(result.reason, 'exp is not a valid number');
    }
  });
});
