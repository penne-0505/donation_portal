const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000;
const processedEvents = new Map<string, number>();
const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface StripeWebhookEnv {
  readonly STRIPE_WEBHOOK_SECRET?: string;
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: JsonValue }
  | readonly JsonValue[];

type StripeEvent = {
  readonly id?: string;
  readonly type?: string;
  readonly created?: number;
  readonly livemode?: boolean;
  readonly data?: JsonValue;
};

interface ErrorBody {
  readonly error: {
    readonly code: 'bad_request' | 'unauthorized' | 'not_found' | 'internal';
    readonly message: string;
  };
}

function pruneCache(now: number): void {
  for (const [eventId, expiresAt] of processedEvents) {
    if (expiresAt <= now) {
      processedEvents.delete(eventId);
    }
  }
}

function markProcessed(eventId: string, now: number): boolean {
  pruneCache(now);
  const expiresAt = processedEvents.get(eventId);
  if (typeof expiresAt === 'number' && expiresAt > now) {
    return true;
  }
  processedEvents.set(eventId, now + IDEMPOTENCY_WINDOW_MS);
  return false;
}

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function errorResponse(
  status: number,
  code: ErrorBody['error']['code'],
  message: string,
): Response {
  return jsonResponse({ error: { code, message } }, status);
}

function parseStripeSignature(
  header: string | null,
): { readonly timestamp: string; readonly signatures: readonly string[] } | null {
  if (!header) {
    return null;
  }
  // Stripe Webhook-Signature header format: "t=<timestamp>,v1=<signature>"
  // Although Stripe typically sends one v1 signature, we handle multiple for forward compatibility
  const parts = header.split(',');
  let timestamp: string | null = null;
  const signatures: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't' && value) {
      timestamp = value;
    } else if (key === 'v1' && value) {
      signatures.push(value);
    }
  }
  if (!timestamp || signatures.length === 0) {
    return null;
  }
  return { timestamp, signatures };
}

let cachedKeySecret: string | null = null;
let cachedKey: CryptoKey | null = null;

async function computeSignature(secret: string, payload: string): Promise<string> {
  if (!cachedKey || cachedKeySecret !== secret) {
    cachedKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    cachedKeySecret = secret;
  }
  const signature = await crypto.subtle.sign('HMAC', cachedKey, encoder.encode(payload));
  const bytes = new Uint8Array(signature);
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function parseEvent(body: string): StripeEvent | null {
  try {
    return JSON.parse(body) as StripeEvent;
  } catch {
    return null;
  }
}

function logEvent(event: StripeEvent, message: string): void {
  const summary = {
    id: event.id ?? 'unknown',
    type: event.type ?? 'unknown',
    created: event.created ?? null,
    livemode: event.livemode ?? false,
  } as const;
  console.info(`[stripe-webhook] ${message}`, summary);
}

export const onRequestPost: PagesFunction<StripeWebhookEnv> = async ({ request, env }) => {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return errorResponse(500, 'internal', 'Stripe Webhook secret is not configured.');
  }

  const signatureHeader = request.headers.get('stripe-signature');
  const parsedSignature = parseStripeSignature(signatureHeader);
  if (!parsedSignature) {
    return errorResponse(400, 'bad_request', 'Stripe-Signature ヘッダーの形式が不正です。');
  }

  const rawBodyBuffer = await request.arrayBuffer();
  const rawBody = decoder.decode(rawBodyBuffer);
  const signedPayload = `${parsedSignature.timestamp}.${rawBody}`;
  const expectedSignature = await computeSignature(secret, signedPayload);
  const signatureMatch = parsedSignature.signatures.some((signature) =>
    secureCompare(signature, expectedSignature),
  );
  if (!signatureMatch) {
    return errorResponse(400, 'bad_request', 'Stripe 署名の検証に失敗しました。');
  }

  const event = parseEvent(rawBody);
  if (!event) {
    return errorResponse(400, 'bad_request', 'Stripe イベントの JSON を解析できませんでした。');
  }

  if (typeof event.id !== 'string' || event.id.length === 0) {
    return errorResponse(400, 'bad_request', 'event.id が存在しません。');
  }

  const now = Date.now();
  if (markProcessed(event.id, now)) {
    logEvent(event, 'duplicate event ignored');
    return jsonResponse({ received: true });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
    case 'invoice.paid':
      logEvent(event, 'donation event acknowledged');
      break;
    default:
      logEvent(event, 'event acknowledged without additional action');
      break;
  }

  return jsonResponse({ received: true });
};

export function __resetStripeWebhookStateForTesting(): void {
  processedEvents.clear();
  cachedKey = null;
  cachedKeySecret = null;
}
