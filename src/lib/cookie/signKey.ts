import { readEnv } from '../core/env.js';

export interface CookieKeySource {
  readonly COOKIE_SIGN_KEY?: string;
}

export function getCookieSignKey(source?: CookieKeySource): string {
  const value = readEnv('COOKIE_SIGN_KEY', source, process.env);
  if (value) {
    return value;
  }
  throw new Error('COOKIE_SIGN_KEY is not configured. Set it in your environment variables.');
}
