import type { CookieKeySource } from '../../src/lib/cookie/signKey.js';
import { stateCookieService, STATE_COOKIE_NAME, STATE_COOKIE_TTL_SECONDS } from '../../src/lib/oauth/stateCookie.js';
import { discordOAuth } from '../../src/lib/oauth/discord.js';

type OAuthEnv = CookieKeySource & {
  readonly DISCORD_CLIENT_ID?: string;
  readonly DISCORD_REDIRECT_URI?: string;
};

function parseConsent(value: string | null): boolean | Response {
  if (value === null || value === '') {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return new Response('Invalid consent_public value', { status: 400 });
}

function getEnvValue(env: OAuthEnv, key: 'DISCORD_CLIENT_ID' | 'DISCORD_REDIRECT_URI'): string | undefined {
  if (env[key]) {
    return env[key];
  }
  const processEnv = process.env as Record<string, string | undefined>;
  return processEnv[key];
}

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const consentValue = url.searchParams.get('consent_public');

  const consent = parseConsent(consentValue);
  if (consent instanceof Response) {
    return consent;
  }

  const env = context.env as OAuthEnv;
  const clientId = getEnvValue(env, 'DISCORD_CLIENT_ID');
  const redirectUri = getEnvValue(env, 'DISCORD_REDIRECT_URI');

  if (!clientId || !redirectUri) {
    return new Response('OAuth configuration error', { status: 500 });
  }

  let stateCookieValue: string;
  let nonce: string;
  try {
    const result = await stateCookieService.createStateCookie({
      consentPublic: consent,
      keySource: env,
    });
    stateCookieValue = result.value;
    nonce = result.nonce;
  } catch (error) {
    return new Response('OAuth configuration error', { status: 500 });
  }

  const authorizeUrl = discordOAuth.buildAuthorizeUrl({
    clientId,
    redirectUri,
    state: nonce,
  });

  const headers = new Headers();
  headers.set('Location', authorizeUrl);
  headers.set(
    'Set-Cookie',
    `${STATE_COOKIE_NAME}=${stateCookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_COOKIE_TTL_SECONDS}`,
  );

  return new Response(null, {
    status: 302,
    headers,
  });
};
