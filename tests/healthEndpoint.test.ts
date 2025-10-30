import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { onRequest } from '../functions/health.js';

describe('functions/health', () => {
  it('200 OK と ok を返す', async () => {
    const response = await onRequest({
      request: new Request('https://example.com/health'),
      env: {},
      params: {},
      waitUntil: () => {
        // noop
      },
      next: async () => new Response('not found', { status: 404 }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.text();
    assert.equal(body, 'ok');
  });
});
