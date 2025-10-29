export interface BuildAuthorizeUrlOptions {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly state: string;
}

const DISCORD_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';

export function buildAuthorizeUrl({
  clientId,
  redirectUri,
  state,
}: BuildAuthorizeUrlOptions): string {
  const url = new URL(DISCORD_AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'identify');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return url.toString();
}

export const discordOAuth = {
  buildAuthorizeUrl,
};
