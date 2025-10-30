import { verifySignedCookie, type VerifiedCookie } from './cookie.js';
import type { CookieKeySource } from '../cookie/signKey.js';

export const SESSION_COOKIE_NAME = 'sess';

export interface SessionData {
  readonly displayName: string;
  readonly discordId: string;
  readonly consentPublic: boolean;
  readonly expiresAt: number;
}

export type SessionParseResult =
  | { readonly status: 'missing' }
  | { readonly status: 'invalid'; readonly reason: string }
  | { readonly status: 'ok'; readonly session: SessionData; readonly raw: VerifiedCookie };

function readCookie(headerValue: string | null, name: string): string | undefined {
  if (!headerValue) {
    return undefined;
  }

  const parts = headerValue.split(';');
  for (const part of parts) {
    const [cookieName, ...rest] = part.trim().split('=');
    if (cookieName === name) {
      return rest.join('=');
    }
  }
  return undefined;
}

function sanitizeDisplayName(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed;
}

function parseConsent(value: unknown): boolean {
  return value === true;
}

export async function parseSessionFromCookie({
  cookieHeader,
  keySource,
  now,
}: {
  readonly cookieHeader: string | null;
  readonly keySource: CookieKeySource;
  readonly now?: Date | number;
}): Promise<SessionParseResult> {
  const cookieValue = readCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!cookieValue) {
    return { status: 'missing' };
  }

  let verified: VerifiedCookie;
  try {
    verified = await verifySignedCookie({
      name: SESSION_COOKIE_NAME,
      cookie: cookieValue,
      keySource,
      now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return { status: 'invalid', reason: message };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(verified.value) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid JSON payload';
    return { status: 'invalid', reason: message };
  }

  if (!payload || typeof payload !== 'object') {
    return { status: 'invalid', reason: 'Session payload is not an object' };
  }

  const displayName = sanitizeDisplayName((payload as Record<string, unknown>).display_name);
  const discordId = (payload as Record<string, unknown>).discord_id;
  const consentPublic = parseConsent((payload as Record<string, unknown>).consent_public);
  const exp = (payload as Record<string, unknown>).exp;

  if (!displayName) {
    return { status: 'invalid', reason: 'display_name is missing' };
  }

  if (typeof discordId !== 'string' || discordId.length === 0) {
    return { status: 'invalid', reason: 'discord_id is missing' };
  }

  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return { status: 'invalid', reason: 'exp is not a valid number' };
  }

  return {
    status: 'ok',
    session: {
      displayName,
      discordId,
      consentPublic,
      expiresAt: verified.expiresAt,
    },
    raw: verified,
  };
}
