import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet } from '../../functions/oauth/logout.js';

type Context = {
  request: Request;
  env: Record<string, string>;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: () => Promise<Response>;
};

function createContext(url: string = 'https://donation.example'): Context {
  return {
    request: new Request(url),
    env: {},
    params: {},
    waitUntil: () => {
      // noop
    },
    next: async () => new Response(null, { status: 404 }),
  };
}

describe('functions/oauth/logout', () => {
  it('POST /oauth/logout - セッション Cookie を失効させ 200 を返す', async () => {
    const context = createContext();
    const response = (await onRequestPost(
      context as unknown as Parameters<PagesFunction>[0],
    )) as Response;

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'application/json');

    const cookieHeader = response.headers.get('Set-Cookie');
    assert.ok(cookieHeader, 'Set-Cookie ヘッダが必須');
    assert.match(cookieHeader || '', /sess=/, 'sess Cookie が含まれ');
    assert.match(cookieHeader || '', /Max-Age=0/, 'Max-Age=0 で即時失効');
    assert.match(cookieHeader || '', /HttpOnly/, 'HttpOnly フラグが必須');
    assert.match(cookieHeader || '', /Secure/, 'Secure フラグが必須');
    assert.match(cookieHeader || '', /SameSite=Lax/, 'SameSite=Lax が必須');

    const body = await response.json();
    assert.deepEqual(body, { status: 'logged_out' });
  });

  it('GET /oauth/logout - セッション Cookie を失効させ 302 でリダイレクト', async () => {
    const context = createContext();
    const response = (await onRequestGet(
      context as unknown as Parameters<PagesFunction>[0],
    )) as Response;

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/');

    const cookieHeader = response.headers.get('Set-Cookie');
    assert.ok(cookieHeader, 'Set-Cookie ヘッダが必須');
    assert.match(cookieHeader || '', /sess=/, 'sess Cookie が含まれ');
    assert.match(cookieHeader || '', /Max-Age=0/, 'Max-Age=0 で即時失効');
  });
});
