import { createSignedCookie } from './cookie.js';
import { SESSION_COOKIE_NAME } from './session.js';
import type { CookieKeySource } from '../cookie/signKey.js';
import { toEpochMilliseconds, toEpochSeconds } from '../core/time.js';

export const SESSION_COOKIE_TTL_SECONDS = 600;

function buildCookieAttributes(value: string, ttlSeconds: number, issuedAt: number): string {
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

export interface SessionCookieIdentity {
  readonly displayName: string;
  readonly discordId: string;
  readonly consentPublic: boolean;
}

export interface SessionCookiePayloadV2 {
  readonly version: 2;
  readonly exp: number;
  readonly session: {
    readonly display_name: string;
    readonly discord_id: string;
    readonly consent_public: boolean;
  };
}

export interface IssueSessionCookieOptions extends SessionCookieIdentity {
  readonly keySource: CookieKeySource;
  readonly ttlSeconds?: number;
  readonly now?: Date | number;
}

export interface SessionCookieResult {
  readonly cookie: string;
  readonly signedValue: string;
  readonly payload: SessionCookiePayloadV2;
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

  const issuedAt = toEpochMilliseconds(now);
  const expiresAt = issuedAt + ttlSeconds * 1000;
  const payload: SessionCookiePayloadV2 = {
    version: 2,
    exp: toEpochSeconds(expiresAt),
    session: {
      display_name: displayName,
      discord_id: discordId,
      consent_public: consentPublic,
    },
  };

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

export function buildExpiredSessionCookie(now?: Date | number): string {
  const issuedAt = toEpochMilliseconds(now);
  const expires = new Date(issuedAt - 86_400_000);
  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=0',
    `Expires=${expires.toUTCString()}`,
  ].join('; ');
}
