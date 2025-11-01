import { createLogger, type Logger } from '../core/logger.js';
import { httpError } from '../core/response.js';
import {
  buildCustomerMetadata,
  type BaseMetadataOptions,
  type MetadataTimestamps,
} from './metadata.js';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

interface StripeClientOptions {
  readonly apiKey: string;
  readonly fetchImpl?: typeof fetch;
  readonly logger?: Logger;
}

interface StripeCustomerSearchResponse {
  readonly data?: Array<{ readonly id?: string }>;
}

interface StripeCustomerResponse {
  readonly id?: string;
}

export class StripeClient {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly logger: Logger;

  constructor(options: StripeClientOptions) {
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
    this.logger = options.logger ?? createLogger('stripe');
  }

  private async request(
    path: string,
    params: URLSearchParams,
    options: { readonly method?: 'GET' | 'POST' } = {},
  ): Promise<Response> {
    const method = options.method ?? 'POST';
    const url = new URL(`${STRIPE_API_BASE}${path}`);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    const init: RequestInit = { method, headers };

    if (method === 'GET') {
      url.search = params.toString();
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      init.body = params.toString();
    }

    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const response = await this.fetchImpl(url.toString(), init);
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const latencyMs = Math.round(end - start);

    this.logger.debug('stripe_request', {
      path,
      method,
      status: response.status,
      latency_ms: latencyMs,
    });

    if (!response.ok) {
      const bodyText = await response.text();
      this.logger.error('stripe_request_failed', {
        path,
        method,
        status: response.status,
        latency_ms: latencyMs,
        body_preview: bodyText.slice(0, 500),
      });
      throw httpError(500, 'internal', 'Stripe API request failed', {
        details: { path, status: response.status },
      });
    }

    return response;
  }

  async searchCustomerByDiscordId(discordId: string): Promise<string | null> {
    const escapedId = discordId.replace(/"/g, '\\"');
    const params = new URLSearchParams({
      query: `metadata['discord_id']:"${escapedId}"`,
      limit: '1',
    });
    const response = await this.request('/customers/search', params, { method: 'GET' });
    const data = (await response.json()) as StripeCustomerSearchResponse;
    const id = data.data?.[0]?.id;
    return typeof id === 'string' && id.length > 0 ? id : null;
  }

  async updateCustomerMetadata(
    customerId: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    const params = new URLSearchParams(metadata);
    await this.request(`/customers/${customerId}`, params);
  }

  async createCustomer(
    metadata: Record<string, string>,
    options: { readonly name: string },
  ): Promise<string> {
    const params = new URLSearchParams(metadata);
    params.set('name', options.name);
    const response = await this.request('/customers', params);
    const data = (await response.json()) as StripeCustomerResponse;
    if (typeof data.id !== 'string' || data.id.length === 0) {
      throw httpError(500, 'internal', 'Stripe customer creation succeeded without id');
    }
    return data.id;
  }

  async ensureCustomer(
    identity: BaseMetadataOptions,
    timestamps: MetadataTimestamps,
  ): Promise<string> {
    const metadata = buildCustomerMetadata(identity, timestamps);
    const customerId = await this.searchCustomerByDiscordId(identity.discordId);
    if (customerId) {
      await this.updateCustomerMetadata(customerId, metadata);
      return customerId;
    }
    return this.createCustomer(metadata, { name: identity.displayName });
  }

  async createCheckoutSession(params: URLSearchParams): Promise<{ readonly url: string }> {
    const response = await this.request('/checkout/sessions', params);
    const data = (await response.json()) as { readonly url?: string };
    if (typeof data.url !== 'string' || data.url.length === 0) {
      throw httpError(500, 'internal', 'Stripe checkout session returned without url');
    }
    return { url: data.url };
  }
}
