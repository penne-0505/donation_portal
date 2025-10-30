import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createSignedCookie,
  verifySignedCookie,
} from '../../src/lib/auth/cookie.js';

const ORIGINAL_KEY = (process.env as Record<string, string | undefined>).COOKIE_SIGN_KEY;

describe('OAuth cookie signing', () => {
  beforeEach(() => {
    (process.env as Record<string, string | undefined>).COOKIE_SIGN_KEY =
      'test-cookie-secret';
  });

  after(() => {
    const env = process.env as Record<string, string | undefined>;
    if (typeof ORIGINAL_KEY === 'undefined') {
      delete env.COOKIE_SIGN_KEY;
    } else {
      env.COOKIE_SIGN_KEY = ORIGINAL_KEY;
    }
  });

  it('state クッキーの署名と検証ができる', async () => {
    const now = new Date('2024-01-01T00:00:00.000Z');

    const cookie = await createSignedCookie({
      name: 'state',
      value: 'state-token',
      ttlSeconds: 600,
      now,
    });

    const result = await verifySignedCookie({
      name: 'state',
      cookie,
      now: new Date('2024-01-01T00:01:00.000Z'),
    });

    assert.equal(result.value, 'state-token');
    assert.equal(result.name, 'state');
  });

  it('sess クッキーの署名と検証ができる', async () => {
    const cookie = await createSignedCookie({
      name: 'sess',
      value: 'sess-token',
      ttlSeconds: 900,
      now: new Date('2024-01-01T00:00:00.000Z'),
    });

    const result = await verifySignedCookie({
      name: 'sess',
      cookie,
      now: new Date('2024-01-01T00:05:00.000Z'),
    });

    assert.equal(result.value, 'sess-token');
    assert.equal(result.name, 'sess');
  });

  it('TTL 超過時はエラーになる', async () => {
    const cookie = await createSignedCookie({
      name: 'state',
      value: 'state-token',
      ttlSeconds: 600,
      now: new Date('2024-01-01T00:00:00.000Z'),
    });

    await assert.rejects(
      () =>
        verifySignedCookie({
          name: 'state',
          cookie,
          now: new Date('2024-01-01T00:11:00.000Z'),
        }),
      /expired/i,
    );
  });

  it('署名を改ざんすると検証エラーになる', async () => {
    const cookie = await createSignedCookie({
      name: 'sess',
      value: 'sess-token',
      ttlSeconds: 600,
      now: new Date('2024-01-01T00:00:00.000Z'),
    });

    const tampered = cookie.replace(/.$/, (char: string) =>
      char === 'a' ? 'b' : 'a',
    );

    await assert.rejects(
      () =>
        verifySignedCookie({
          name: 'sess',
          cookie: tampered,
          now: new Date('2024-01-01T00:01:00.000Z'),
        }),
      /signature/i,
    );
  });
});
