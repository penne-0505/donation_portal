import { getCookieSignKey } from '../../src/lib/cookie/signKey.js';
import type { CookieKeySource } from '../../src/lib/cookie/signKey.js';

export const onRequestGet: PagesFunction = async (context) => {
  getCookieSignKey(context.env as CookieKeySource);

  return new Response('OAuth start is not implemented yet.', { status: 501 });
};
