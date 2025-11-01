import { toEpochMilliseconds } from '../core/time.js';

export interface BaseMetadataOptions {
  readonly displayName: string;
  readonly discordId: string;
  readonly consentPublic: boolean;
}

export interface MetadataTimestamps {
  readonly lastCheckoutAt?: Date | number;
  readonly consentUpdatedAt?: Date | number;
}

function formatTimestamp(value: Date | number): string {
  const epochMs = toEpochMilliseconds(value);
  return new Date(epochMs).toISOString();
}

export function buildCustomerMetadata(
  options: BaseMetadataOptions,
  timestamps: MetadataTimestamps = {},
): Record<string, string> {
  const metadata: Record<string, string> = {
    'metadata[display_name]': options.displayName,
    'metadata[display_name_source]': 'discord',
    'metadata[discord_id]': options.discordId,
    'metadata[consent_public]': options.consentPublic ? 'true' : 'false',
  };

  if (typeof timestamps.lastCheckoutAt !== 'undefined') {
    metadata['metadata[last_checkout_at]'] = formatTimestamp(timestamps.lastCheckoutAt);
  }

  if (typeof timestamps.consentUpdatedAt !== 'undefined') {
    metadata['metadata[consent_updated_at]'] = formatTimestamp(timestamps.consentUpdatedAt);
  }

  return metadata;
}
