import {
  createSignedCookie,
  verifySignedCookie,
} from '../../src/lib/auth/cookie.js';
import {
  getCookieSignKey,
  type CookieKeySource,
} from '../../src/lib/cookie/signKey.js';

interface OAuthEnv extends CookieKeySource {
  readonly DISCORD_CLIENT_ID?: string;
  readonly DISCORD_CLIENT_SECRET?: string;
}

interface StateCookieValue {
  readonly nonce?: string;
  readonly consent_public?: unknown;
  readonly exp?: unknown;
}

interface DiscordTokenResponse {
  readonly access_token?: string;
  readonly token_type?: string;
}

interface DiscordUserResponse {
  readonly id?: string;
  readonly global_name?: string | null;
  readonly username?: string | null;
}

const DISCORD_API_BASE = 'https://discord.com/api';
const TOKEN_ENDPOINT = `${DISCORD_API_BASE}/oauth2/token`;
const USER_ENDPOINT = `${DISCORD_API_BASE}/users/@me`;
const STATE_COOKIE_NAME = 'state';
const SESSION_COOKIE_NAME = 'sess';
const COOKIE_TTL_SECONDS = 600;

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

function redirect(location: string, cookies: readonly string[] = []): Response {
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: location,
    },
  });

  for (const cookie of cookies) {
    response.headers.append('Set-Cookie', cookie);
  }
  return response;
}

function redirectWithError(code: string): Response {
  return redirect(`/donate?error=${code}`);
}

function logError(code: string, details?: string): void {
  if (details) {
    console.error(`[oauth/callback] ${code}: ${details}`);
  } else {
    console.error(`[oauth/callback] ${code}`);
  }
}

function ensureDiscordCredentials(env: OAuthEnv): {
  readonly clientId: string;
  readonly clientSecret: string;
} {
  const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } = env;
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    throw new Error('Discord OAuth credentials are not configured.');
  }
  return { clientId: DISCORD_CLIENT_ID, clientSecret: DISCORD_CLIENT_SECRET };
}

function parseStateCookie(value: string): StateCookieValue {
  try {
    const parsed = JSON.parse(value) as StateCookieValue;
    return parsed;
  } catch {
    throw new Error('State cookie payload is malformed');
  }
}

function buildCookieAttributes(
  name: string,
  value: string,
  ttlSeconds: number,
  issuedAt: number,
): string {
  const expires = new Date(issuedAt + ttlSeconds * 1000);
  return [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${ttlSeconds}`,
    `Expires=${expires.toUTCString()}`,
  ].join('; ');
}

function buildExpiredCookie(name: string): string {
  const past = new Date(0);
  return [
    `${name}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=0',
    `Expires=${past.toUTCString()}`,
  ].join('; ');
}

function toBasicAuth(clientId: string, clientSecret: string): string {
  const credentials = `${clientId}:${clientSecret}`;
  const encoded = Buffer.from(credentials, 'binary').toString('base64');
  return `Basic ${encoded}`;
}

function sanitizeDisplayName(user: DiscordUserResponse): string {
  const globalName = typeof user.global_name === 'string' ? user.global_name.trim() : '';
  const username = typeof user.username === 'string' ? user.username.trim() : '';
  if (globalName.length > 0) {
    return globalName;
  }
  if (username.length > 0) {
    return username;
  }
  return 'Discord User';
}

export const onRequestGet: PagesFunction = async (context) => {
  const env = context.env as OAuthEnv;
  getCookieSignKey(env);
  const { clientId, clientSecret } = ensureDiscordCredentials(env);

  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  if (!code || !stateParam) {
    logError('invalid_request', 'Missing code or state parameter');
    return redirectWithError('invalid_request');
  }

  const cookieHeader = context.request.headers.get('cookie');
  const stateCookieValue = readCookie(cookieHeader, STATE_COOKIE_NAME);
  if (!stateCookieValue) {
    logError('state_missing');
    return redirectWithError('state_missing');
  }

  let stateData: StateCookieValue;
  try {
    const verified = await verifySignedCookie({
      name: STATE_COOKIE_NAME,
      cookie: stateCookieValue,
      keySource: env,
    });
    stateData = parseStateCookie(verified.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    const codeName = /expired/i.test(message) ? 'state_expired' : 'state_invalid';
    logError(codeName, message);
    return redirectWithError(codeName);
  }

  if (typeof stateData.nonce !== 'string' || stateData.nonce.length === 0) {
    logError('state_invalid', 'Nonce is missing');
    return redirectWithError('state_invalid');
  }

  if (stateData.nonce !== stateParam) {
    logError('state_mismatch', 'State parameter mismatch');
    return redirectWithError('state_mismatch');
  }

  const consentPublic = stateData.consent_public === true;

  const authHeader = toBasicAuth(clientId, clientSecret);
  const redirectUri = `${url.origin}/oauth/callback`;
  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!tokenResponse.ok) {
    logError('discord_token_error', `status=${tokenResponse.status}`);
    return redirectWithError('discord_token_error');
  }

  let tokenData: DiscordTokenResponse;
  try {
    tokenData = (await tokenResponse.json()) as DiscordTokenResponse;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown token parse error';
    logError('discord_token_error', `Invalid token response: ${detail}`);
    return redirectWithError('discord_token_error');
  }

  const accessToken = tokenData.access_token;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    logError('discord_token_error', 'Access token is missing');
    return redirectWithError('discord_token_error');
  }

  const userResponse = await fetch(USER_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    logError('discord_user_error', `status=${userResponse.status}`);
    return redirectWithError('discord_user_error');
  }

  let userData: DiscordUserResponse;
  try {
    userData = (await userResponse.json()) as DiscordUserResponse;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown user parse error';
    logError('discord_user_error', `Invalid user response: ${detail}`);
    return redirectWithError('discord_user_error');
  }

  if (typeof userData.id !== 'string' || userData.id.length === 0) {
    logError('discord_user_error', 'Discord ID is missing');
    return redirectWithError('discord_user_error');
  }

  const displayName = sanitizeDisplayName(userData);
  const now = Date.now();
  const sessionPayload = {
    display_name: displayName,
    discord_id: userData.id,
    consent_public: consentPublic,
    exp: Math.floor((now + COOKIE_TTL_SECONDS * 1000) / 1000),
  } satisfies Record<string, unknown>;

  const signedSession = await createSignedCookie({
    name: SESSION_COOKIE_NAME,
    value: JSON.stringify(sessionPayload),
    ttlSeconds: COOKIE_TTL_SECONDS,
    now,
    keySource: env,
  });

  const sessCookie = buildCookieAttributes(
    SESSION_COOKIE_NAME,
    signedSession,
    COOKIE_TTL_SECONDS,
    now,
  );

  const stateClearCookie = buildExpiredCookie(STATE_COOKIE_NAME);

  return redirect('/donate', [sessCookie, stateClearCookie]);
};
