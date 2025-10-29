import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { healthCheck } from '../src/lib/healthCheck.js';

describe('healthCheck', () => {
  it('returns service metadata', () => {
    const result = healthCheck();

    assert.equal(result.service, 'donation-portal');
    assert.equal(result.status, 'ok');
    assert.match(result.version, /^0\.1\.0/);
    assert.ok(result.timestamp instanceof Date);
  });
});
