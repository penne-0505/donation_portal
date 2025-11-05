import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getCookieSignKey } from '../src/lib/cookie/signKey.js';

describe('getCookieSignKey', () => {
  it('指定した環境オブジェクトからキーを読み取る', () => {
    const env = { COOKIE_SIGN_KEY: 'local-key' };

    const key = getCookieSignKey(env);

    assert.equal(key, 'local-key');
  });

  it('`process.env` にフォールバックする', () => {
    const env = process.env as unknown as Record<string, string | undefined>;
    const original = env.COOKIE_SIGN_KEY;
    env.COOKIE_SIGN_KEY = 'fallback-key';

    try {
      const key = getCookieSignKey();
      assert.equal(key, 'fallback-key');
    } finally {
      if (typeof original === 'undefined') {
        delete env.COOKIE_SIGN_KEY;
      } else {
        env.COOKIE_SIGN_KEY = original;
      }
    }
  });

  it('未設定の場合はエラーを投げる', () => {
    const env = {};

    let caughtError: unknown;
    try {
      getCookieSignKey(env);
    } catch (error) {
      caughtError = error;
    }

    assert.ok(caughtError instanceof Error);
    assert.match((caughtError as Error).message, /COOKIE_SIGN_KEY/);
  });
});
