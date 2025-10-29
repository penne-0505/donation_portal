import type { CookieKeySource } from '../cookie/signKey.js';
import { createSignedCookie } from '../auth/cookie.js';

export const STATE_COOKIE_NAME = 'state';
export const STATE_COOKIE_TTL_SECONDS = 600;

export interface CreateStateCookieOptions {
  readonly consentPublic: boolean;
  readonly keySource?: CookieKeySource;
  readonly now?: Date | number;
}

export interface StateCookiePayload {
  readonly nonce: string;
  readonly consent_public: boolean;
}

export interface CreateStateCookieResult {
  readonly value: string;
  readonly nonce: string;
}

export async function createStateCookie({
  consentPublic,
  keySource,
  now,
}: CreateStateCookieOptions): Promise<CreateStateCookieResult> {
  const nonce = crypto.randomUUID();

  const payload: StateCookiePayload = {
    nonce,
    consent_public: consentPublic,
  };

  const value = await createSignedCookie({
    name: STATE_COOKIE_NAME,
    value: JSON.stringify(payload),
    ttlSeconds: STATE_COOKIE_TTL_SECONDS,
    now,
    keySource,
  });

  return { value, nonce };
}

export const stateCookieService = {
  createStateCookie,
};
