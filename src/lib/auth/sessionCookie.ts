import { createSignedCookie } from './cookie.js';
import { SESSION_COOKIE_NAME } from './session.js';
import type { CookieKeySource } from '../cookie/signKey.js';

export const SESSION_COOKIE_TTL_SECONDS = 600;

function toTimestamp(value: Date | number | undefined): number {
  if (typeof value === 'number') {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return Date.now();
}

function buildCookieAttributes(
  value: string,
  ttlSeconds: number,
  issuedAt: number,
): string {
  const expires = new Date(issuedAt + ttlSeconds * 1000);
  return [
    `${SESSION_COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${ttlSeconds}`,
    `Expires=${expires.toUTCString()}`,
  ].join('; ');
}

export interface SessionCookiePayload {
  readonly displayName: string;
  readonly discordId: string;
  readonly consentPublic: boolean;
}

export interface IssueSessionCookieOptions extends SessionCookiePayload {
  readonly keySource: CookieKeySource;
  readonly ttlSeconds?: number;
  readonly now?: Date | number;
}

export interface SessionCookieResult {
  readonly cookie: string;
  readonly signedValue: string;
  readonly payload: {
    readonly display_name: string;
    readonly discord_id: string;
    readonly consent_public: boolean;
    readonly exp: number;
  };
  readonly issuedAt: number;
  readonly expiresAt: number;
}

export async function issueSessionCookie({
  displayName,
  discordId,
  consentPublic,
  keySource,
  ttlSeconds = SESSION_COOKIE_TTL_SECONDS,
  now,
}: IssueSessionCookieOptions): Promise<SessionCookieResult> {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('ttlSeconds must be a positive number');
  }

  const issuedAt = toTimestamp(now);
  const expiresAt = issuedAt + ttlSeconds * 1000;
  const payload = {
    display_name: displayName,
    discord_id: discordId,
    consent_public: consentPublic,
    exp: Math.floor(expiresAt / 1000),
  } as const;

  const signedValue = await createSignedCookie({
    name: SESSION_COOKIE_NAME,
    value: JSON.stringify(payload),
    ttlSeconds,
    now: issuedAt,
    keySource,
  });

  const cookie = buildCookieAttributes(signedValue, ttlSeconds, issuedAt);

  return { cookie, signedValue, payload, issuedAt, expiresAt };
}
