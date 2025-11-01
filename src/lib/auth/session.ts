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

interface SessionCookiePayloadV1 {
  readonly display_name?: unknown;
  readonly discord_id?: unknown;
  readonly consent_public?: unknown;
  readonly exp?: unknown;
}

interface SessionCookiePayloadV2 {
  readonly version?: unknown;
  readonly exp?: unknown;
  readonly session?: {
    readonly display_name?: unknown;
    readonly discord_id?: unknown;
    readonly consent_public?: unknown;
  };
}

function extractSessionFields(payload: unknown):
  | {
      readonly ok: true;
      readonly displayName: string;
      readonly discordId: string;
      readonly consentPublic: boolean;
      readonly exp: number;
    }
  | { readonly ok: false; readonly reason: string } {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, reason: 'Session payload is not an object' };
  }

  const record = payload as Record<string, unknown>;
  if (record.version === 2) {
    const v2 = payload as SessionCookiePayloadV2;
    const session = v2.session;
    if (!session || typeof session !== 'object') {
      return { ok: false, reason: 'Session payload is missing session object' };
    }
    const sessionRecord = session as Record<string, unknown>;
    const displayName = sanitizeDisplayName(sessionRecord.display_name);
    if (!displayName) {
      return { ok: false, reason: 'display_name is missing' };
    }
    const discordId = sessionRecord.discord_id;
    if (typeof discordId !== 'string' || discordId.length === 0) {
      return { ok: false, reason: 'discord_id is missing' };
    }
    const consentPublic = parseConsent(sessionRecord.consent_public);
    const exp = v2.exp;
    if (typeof exp !== 'number' || !Number.isFinite(exp)) {
      return { ok: false, reason: 'exp is not a valid number' };
    }
    return { ok: true, displayName, discordId, consentPublic, exp };
  }

  const legacy = payload as SessionCookiePayloadV1;
  const displayName = sanitizeDisplayName(legacy.display_name);
  if (!displayName) {
    return { ok: false, reason: 'display_name is missing' };
  }
  const discordId = legacy.discord_id;
  if (typeof discordId !== 'string' || discordId.length === 0) {
    return { ok: false, reason: 'discord_id is missing' };
  }
  const consentPublic = parseConsent(legacy.consent_public);
  const exp = legacy.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return { ok: false, reason: 'exp is not a valid number' };
  }
  return { ok: true, displayName, discordId, consentPublic, exp };
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

  const extracted = extractSessionFields(payload);
  if (!extracted.ok) {
    return { status: 'invalid', reason: extracted.reason };
  }

  return {
    status: 'ok',
    session: {
      displayName: extracted.displayName,
      discordId: extracted.discordId,
      consentPublic: extracted.consentPublic,
      expiresAt: verified.expiresAt,
    },
    raw: verified,
  };
}
