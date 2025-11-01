import { getCookieSignKey, type CookieKeySource } from '../cookie/signKey.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface SignedCookiePayload {
  readonly name: string;
  readonly value: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
}

const keyCache = new Map<string, Promise<CryptoKey>>();

function toCryptoKey(secret: string): Promise<CryptoKey> {
  let cached = keyCache.get(secret);
  if (!cached) {
    const keyData = encoder.encode(secret);
    cached = crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, [
      'sign',
      'verify',
    ]);
    keyCache.set(secret, cached);
  }
  return cached;
}

function toBase64Url(bytes: ArrayBuffer): string {
  const array = new Uint8Array(bytes);
  let binary = '';
  for (const byte of array) {
    binary += String.fromCharCode(byte);
  }

  const base64 =
    typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  let base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding > 0) {
    base64 += '='.repeat(4 - padding);
  }

  const binary =
    typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toTimestamp(now?: Date | number): number {
  if (typeof now === 'number') {
    return now;
  }
  if (now instanceof Date) {
    return now.getTime();
  }
  return Date.now();
}

export interface CreateSignedCookieOptions {
  readonly name: string;
  readonly value: string;
  readonly ttlSeconds: number;
  readonly now?: Date | number;
  readonly keySource?: CookieKeySource;
}

export async function createSignedCookie({
  name,
  value,
  ttlSeconds,
  now,
  keySource,
}: CreateSignedCookieOptions): Promise<string> {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('ttlSeconds must be a positive number');
  }

  const issuedAt = toTimestamp(now);
  const expiresAt = issuedAt + ttlSeconds * 1000;

  const payload: SignedCookiePayload = {
    name,
    value,
    issuedAt,
    expiresAt,
  };

  const secret = getCookieSignKey(keySource);
  const key = await toCryptoKey(secret);

  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const encodedPayload = toBase64Url(payloadBytes.buffer);
  const encodedPayloadBytes = encoder.encode(encodedPayload);
  const payloadBufferSource = encodedPayloadBytes.buffer as ArrayBuffer;
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadBufferSource);
  const signature = toBase64Url(signatureBuffer);

  return `${encodedPayload}.${signature}`;
}

export interface VerifySignedCookieOptions {
  readonly name: string;
  readonly cookie: string;
  readonly now?: Date | number;
  readonly keySource?: CookieKeySource;
}

export interface VerifiedCookie {
  readonly name: string;
  readonly value: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
}

export async function verifySignedCookie({
  name,
  cookie,
  now,
  keySource,
}: VerifySignedCookieOptions): Promise<VerifiedCookie> {
  const [encodedPayload, signaturePart, ...rest] = cookie.split('.');
  if (!encodedPayload || !signaturePart || rest.length > 0) {
    throw new Error('Invalid signed cookie format');
  }

  const secret = getCookieSignKey(keySource);
  const key = await toCryptoKey(secret);

  const signatureBytes = fromBase64Url(signaturePart);
  const encodedPayloadBytes = encoder.encode(encodedPayload);
  const signatureBufferSource = signatureBytes.buffer as ArrayBuffer;
  const payloadBufferSource = encodedPayloadBytes.buffer as ArrayBuffer;
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBufferSource,
    payloadBufferSource,
  );

  if (!isValid) {
    throw new Error('Signed cookie signature is invalid');
  }

  const payloadBytes = fromBase64Url(encodedPayload);
  let payload: SignedCookiePayload;
  try {
    payload = JSON.parse(decoder.decode(payloadBytes)) as SignedCookiePayload;
  } catch {
    throw new Error('Signed cookie payload is malformed');
  }

  if (payload.name !== name) {
    throw new Error(`Signed cookie name mismatch: expected ${name}`);
  }

  const current = toTimestamp(now);
  if (current > payload.expiresAt) {
    throw new Error('Signed cookie has expired');
  }

  return payload;
}
