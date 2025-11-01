import { parseSessionFromCookie } from '../../src/lib/auth/session.js';
import { buildExpiredSessionCookie } from '../../src/lib/auth/sessionCookie.js';
import type { CookieKeySource } from '../../src/lib/cookie/signKey.js';

interface SessionEnv extends CookieKeySource {}

interface SessionSuccessBody {
  readonly status: 'signed-in';
  readonly session: {
    readonly displayName: string;
    readonly consentPublic: boolean;
    readonly expiresAt: number;
  };
}

interface SessionSignedOutBody {
  readonly status: 'signed-out';
}

interface SessionErrorBody {
  readonly status: 'error';
  readonly error: {
    readonly code: 'invalid_session';
    readonly message: string;
  };
}

type SessionResponseBody = SessionSuccessBody | SessionSignedOutBody | SessionErrorBody;

function jsonResponse(body: SessionResponseBody, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), { ...init, headers });
}

export const onRequestGet: PagesFunction = async (context) => {
  const env = context.env as SessionEnv;
  const cookieHeader = context.request.headers.get('cookie');

  const result = await parseSessionFromCookie({
    cookieHeader,
    keySource: env,
  });

  switch (result.status) {
    case 'ok': {
      return jsonResponse({
        status: 'signed-in',
        session: {
          displayName: result.session.displayName,
          consentPublic: result.session.consentPublic,
          expiresAt: result.session.expiresAt,
        },
      });
    }
    case 'invalid': {
      const headers = new Headers();
      headers.append('Set-Cookie', buildExpiredSessionCookie());
      return jsonResponse(
        {
          status: 'error',
          error: {
            code: 'invalid_session',
            message: 'Session cookie is invalid or expired.',
          },
        },
        { headers },
      );
    }
    default: {
      return jsonResponse({ status: 'signed-out' });
    }
  }
};
