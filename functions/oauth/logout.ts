import { buildExpiredSessionCookie } from '../../src/lib/auth/sessionCookie.js';

export const onRequestPost: PagesFunction = async () => {
  const expiredSessionCookie = buildExpiredSessionCookie();
  const response = new Response(JSON.stringify({ status: 'logged_out' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  response.headers.set('Set-Cookie', expiredSessionCookie);
  return response;
};

export const onRequestGet: PagesFunction = async () => {
  const expiredSessionCookie = buildExpiredSessionCookie();
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: '/',
    },
  });

  response.headers.set('Set-Cookie', expiredSessionCookie);
  return response;
};
