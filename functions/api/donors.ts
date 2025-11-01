const STRIPE_API_BASE = 'https://api.stripe.com/v1';

interface DonorsEnv {
  readonly STRIPE_SECRET_KEY?: string;
}

interface StripeCustomerRecord {
  readonly metadata?: { readonly display_name?: unknown };
  readonly created?: number;
}

interface StripeSearchResponse {
  readonly data?: StripeCustomerRecord[];
}

interface DonorsResponseBody {
  readonly donors: string[];
  readonly count: number;
}

type Order = 'asc' | 'desc' | 'random';

interface ErrorBody {
  readonly error: {
    readonly code: 'bad_request' | 'internal';
    readonly message: string;
  };
}

function jsonResponse(body: object, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(headers ?? {}),
    },
  });
}

function errorResponse(
  status: number,
  code: ErrorBody['error']['code'],
  message: string,
): Response {
  return jsonResponse({ error: { code, message } }, status, {
    'cache-control': 'no-store',
  });
}

function parseLimit(raw: string | null):
  | { readonly ok: true; readonly value: number }
  | {
      readonly ok: false;
      readonly message: string;
    } {
  if (raw === null) {
    return { ok: true, value: 100 };
  }

  const numeric = Number.parseInt(raw, 10);
  if (!Number.isFinite(numeric)) {
    return { ok: false, message: 'limit は数値で指定してください (1-200)。' };
  }

  if (numeric < 1 || numeric > 200) {
    return { ok: false, message: 'limit は 1 以上 200 以下で指定してください。' };
  }

  return { ok: true, value: numeric };
}

function parseOrder(raw: string | null):
  | { readonly ok: true; readonly value: Order }
  | {
      readonly ok: false;
      readonly message: string;
    } {
  if (raw === null || raw === 'desc' || raw === 'asc' || raw === 'random') {
    return { ok: true, value: (raw ?? 'desc') as Order };
  }
  return {
    ok: false,
    message: 'order は "desc"、"asc"、"random" のいずれかで指定してください。',
  };
}

function sanitizeDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function callStripe(env: DonorsEnv, params: URLSearchParams): Promise<Response> {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured');
  }

  const url = new URL(`${STRIPE_API_BASE}/customers/search`);
  url.search = params.toString();

  return fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
}

function shuffle(values: readonly string[]): string[] {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const tmp = result[index];
    result[index] = result[randomIndex];
    result[randomIndex] = tmp;
  }
  return result;
}

async function buildResponseBody(
  env: DonorsEnv,
  limit: number,
  order: Order,
): Promise<DonorsResponseBody> {
  const params = new URLSearchParams({
    query: "metadata['consent_public']:'true'",
    limit: limit.toString(),
  });

  const response = await callStripe(env, params);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stripe donor search failed: status=${response.status} body=${body}`);
  }

  const payload = (await response.json()) as StripeSearchResponse;
  const donors = (payload.data ?? [])
    .map((entry) => {
      const name = sanitizeDisplayName(entry.metadata?.display_name);
      if (!name) {
        return null;
      }
      return {
        name,
        created: typeof entry.created === 'number' ? entry.created : null,
      };
    })
    .filter(
      (entry): entry is { readonly name: string; readonly created: number | null } =>
        entry !== null,
    );

  if (order === 'random') {
    const shuffled = shuffle(donors.map((entry) => entry.name)).slice(0, limit);
    return { donors: shuffled, count: donors.length };
  }

  const sorted = donors.slice().sort((a, b) => {
    const left = a.created ?? 0;
    const right = b.created ?? 0;
    if (order === 'asc') {
      return left - right;
    }
    return right - left;
  });

  return {
    donors: sorted.map((entry) => entry.name).slice(0, limit),
    count: donors.length,
  };
}

async function createWeakEtag(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `W/"${hex}"`;
}

export const onRequestGet: PagesFunction<DonorsEnv> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const limitResult = parseLimit(url.searchParams.get('limit'));
  if (!limitResult.ok) {
    return errorResponse(400, 'bad_request', limitResult.message);
  }

  const orderResult = parseOrder(url.searchParams.get('order'));
  if (!orderResult.ok) {
    return errorResponse(400, 'bad_request', orderResult.message);
  }

  try {
    const body = await buildResponseBody(env, limitResult.value, orderResult.value);
    const bodyText = JSON.stringify(body, null, 2);
    const etag = await createWeakEtag(bodyText);

    return new Response(bodyText, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=60',
        etag,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('[donors] failed to fetch donors', message);
    return errorResponse(
      500,
      'internal',
      'Donors 情報の取得に失敗しました。時間をおいて再度お試しください。',
    );
  }
};
