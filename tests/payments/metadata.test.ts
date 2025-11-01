import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildCustomerMetadata } from '../../src/lib/payments/metadata.js';

const BASE = {
  displayName: 'Tester',
  discordId: '123',
  consentPublic: true,
} as const;

describe('buildCustomerMetadata', () => {
  it('基本情報と consent flag を含める', () => {
    const metadata = buildCustomerMetadata(BASE);
    assert.equal(metadata['metadata[display_name]'], 'Tester');
    assert.equal(metadata['metadata[display_name_source]'], 'discord');
    assert.equal(metadata['metadata[discord_id]'], '123');
    assert.equal(metadata['metadata[consent_public]'], 'true');
    assert.equal(metadata['metadata[last_checkout_at]'], undefined);
  });

  it('タイムスタンプを ISO8601 で埋め込む', () => {
    const now = Date.UTC(2024, 0, 2, 3, 4, 5);
    const metadata = buildCustomerMetadata(BASE, {
      lastCheckoutAt: now,
      consentUpdatedAt: now + 1_000,
    });
    assert.equal(metadata['metadata[last_checkout_at]'], new Date(now).toISOString());
    assert.equal(metadata['metadata[consent_updated_at]'], new Date(now + 1_000).toISOString());
  });
});
