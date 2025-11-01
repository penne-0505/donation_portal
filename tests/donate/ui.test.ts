import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

interface DonateAppModule {
  readonly initializeDonatePage: (doc?: Document) => Promise<void>;
  readonly __test__: {
    readonly fetchSessionState: () => Promise<
      | { readonly status: 'signed-out' }
      | { readonly status: 'error' }
      | {
          readonly status: 'signed-in';
          readonly session: { readonly displayName: string; readonly consentPublic: boolean };
        }
    >;
    readonly getCheckoutTarget: (element: HTMLElement) => {
      readonly mode: string;
      readonly variant: string;
      readonly interval: string | null;
    } | null;
  };
}

const donateModule = (await import(
  new URL('public/donate/app.js', `file://${process.cwd()}/`).href
)) as DonateAppModule;

const { initializeDonatePage, __test__ } = donateModule;

interface TestElements {
  readonly loginButton: FakeElement;
  readonly logoutLink: FakeElement;
  readonly statusField: FakeElement;
  readonly errorField: FakeElement;
  readonly consentCheckbox: FakeElement;
  readonly checkoutOnceButton: FakeElement;
  readonly checkoutMonthlyButton: FakeElement;
  readonly checkoutYearlyButton: FakeElement;
  readonly checkoutError: FakeElement;
  readonly checkoutLoading: FakeElement;
}

class FakeElement {
  public hidden = false;
  public disabled = false;
  public checked = false;
  public textContent = '';
  public dataset: Record<string, string> = {};
  public attributes = new Map<string, string>();
  public href = '';
  private readonly listeners = new Map<
    string,
    Array<(event: { preventDefault: () => void }) => unknown>
  >();

  constructor(
    public readonly tagName: string,
    public id = '',
  ) {}

  setAttribute(name: string, value: string): void {
    if (name === 'id') {
      this.id = value;
    }
    this.attributes.set(name, value);
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  addEventListener(
    type: string,
    listener: (event: { preventDefault: () => void }) => unknown,
  ): void {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  async dispatchEvent(type: string): Promise<void> {
    const listeners = this.listeners.get(type) ?? [];
    for (const listener of listeners) {
      const event = {
        preventDefault() {
          // noop for tests
        },
      };
      const result = listener(event);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await result;
      }
    }
  }
}

class FakeDocument {
  public cookie = '';
  public body: FakeElement;
  private readonly elements = new Map<string, FakeElement>();

  constructor(elements: TestElements) {
    this.body = new FakeElement('body');
    this.body.dataset = {};
    this.register(elements.loginButton);
    this.register(elements.logoutLink);
    this.register(elements.statusField);
    this.register(elements.errorField);
    this.register(elements.consentCheckbox);
    this.register(elements.checkoutOnceButton);
    this.register(elements.checkoutMonthlyButton);
    this.register(elements.checkoutYearlyButton);
    this.register(elements.checkoutError);
    this.register(elements.checkoutLoading);
  }

  private register(element: FakeElement): void {
    if (element.id.length > 0) {
      this.elements.set(element.id, element);
    }
  }

  getElementById(id: string): FakeElement | null {
    return this.elements.get(id) ?? null;
  }
}

function createDocument(): { document: FakeDocument; elements: TestElements } {
  const loginButton = new FakeElement('a', 'auth-login');
  const logoutLink = new FakeElement('a', 'auth-logout');
  logoutLink.hidden = true;
  const statusField = new FakeElement('p', 'auth-status');
  statusField.textContent = 'Discord へのログインが必要です。';
  const errorField = new FakeElement('div', 'auth-error');
  errorField.hidden = true;
  const consentCheckbox = new FakeElement('input', 'consent-public');
  consentCheckbox.disabled = true;
  consentCheckbox.checked = false;
  const checkoutError = new FakeElement('div', 'checkout-error');
  checkoutError.hidden = true;
  const checkoutLoading = new FakeElement('div', 'checkout-loading');
  checkoutLoading.hidden = true;
  const checkoutOnceButton = new FakeElement('button', 'donate-onetime');
  checkoutOnceButton.dataset = { mode: 'payment', variant: 'fixed300', interval: '' };
  checkoutOnceButton.disabled = true;
  const checkoutMonthlyButton = new FakeElement('button', 'donate-monthly');
  checkoutMonthlyButton.dataset = {
    mode: 'subscription',
    variant: 'fixed300',
    interval: 'monthly',
  };
  checkoutMonthlyButton.disabled = true;
  const checkoutYearlyButton = new FakeElement('button', 'donate-yearly');
  checkoutYearlyButton.dataset = { mode: 'subscription', variant: 'fixed3000', interval: 'yearly' };
  checkoutYearlyButton.disabled = true;

  const elements: TestElements = {
    loginButton,
    logoutLink,
    statusField,
    errorField,
    consentCheckbox,
    checkoutOnceButton,
    checkoutMonthlyButton,
    checkoutYearlyButton,
    checkoutError,
    checkoutLoading,
  };

  const document = new FakeDocument(elements);
  return { document, elements };
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}

describe('donate UI script', () => {
  const ORIGINAL_FETCH = globalThis.fetch;
  const ORIGINAL_LOCATION = globalThis.location;

  beforeEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    if (ORIGINAL_LOCATION) {
      globalThis.location = ORIGINAL_LOCATION;
    } else {
      Reflect.deleteProperty(globalThis, 'location');
    }
  });

  it('OAuth 未ログイン状態ではログイン導線を表示し、同意は無効化される', async () => {
    const { document, elements } = createDocument();

    globalThis.fetch = async (input) => {
      assert.equal(String(input), '/api/session');
      return jsonResponse({ status: 'signed-out' });
    };

    await initializeDonatePage(document as unknown as Document);

    assert.equal(elements.loginButton.hidden, false);
    assert.equal(elements.logoutLink.hidden, true);
    assert.equal(elements.consentCheckbox.disabled, true);
    assert.equal(elements.consentCheckbox.checked, false);
    assert.equal(elements.consentCheckbox.attributes.get('aria-checked'), 'false');
    assert.equal(elements.consentCheckbox.attributes.get('aria-disabled'), 'true');
    assert.equal(elements.statusField.textContent, 'Discord へのログインが必要です。');
    assert.equal(elements.errorField.hidden, true);
    assert.equal(document.body.dataset.authState, 'signed-out');
    assert.equal(elements.checkoutOnceButton.disabled, true);
    assert.equal(elements.checkoutMonthlyButton.disabled, true);
    assert.equal(elements.checkoutYearlyButton.disabled, true);
    assert.equal(elements.checkoutLoading.hidden, true);
    assert.equal(elements.checkoutError.hidden, true);
  });

  it('有効なセッションでログイン状態と同意内容が反映される', async () => {
    const { document, elements } = createDocument();

    globalThis.fetch = async (input) => {
      assert.equal(String(input), '/api/session');
      return jsonResponse({
        status: 'signed-in',
        session: { displayName: 'テストユーザー', consentPublic: true },
      });
    };

    await initializeDonatePage(document as unknown as Document);

    assert.equal(elements.loginButton.hidden, true);
    assert.equal(elements.logoutLink.hidden, false);
    assert.equal(elements.statusField.textContent, 'テストユーザー としてログインしています。');
    assert.equal(elements.consentCheckbox.disabled, false);
    assert.equal(elements.consentCheckbox.checked, true);
    assert.equal(elements.consentCheckbox.attributes.get('aria-checked'), 'true');
    assert.equal(elements.consentCheckbox.attributes.has('aria-disabled'), false);
    assert.equal(elements.errorField.hidden, true);
    assert.equal(document.body.dataset.authState, 'signed-in');
    assert.equal(elements.checkoutOnceButton.disabled, false);
    assert.equal(elements.checkoutMonthlyButton.disabled, false);
    assert.equal(elements.checkoutYearlyButton.disabled, false);
  });

  it('同意がオフのセッションはチェック状態を外す', async () => {
    const { document, elements } = createDocument();

    globalThis.fetch = async (input) => {
      assert.equal(String(input), '/api/session');
      return jsonResponse({
        status: 'signed-in',
        session: { displayName: 'Another User', consentPublic: false },
      });
    };

    await initializeDonatePage(document as unknown as Document);

    assert.equal(elements.consentCheckbox.disabled, false);
    assert.equal(elements.consentCheckbox.checked, false);
    assert.equal(elements.consentCheckbox.attributes.get('aria-checked'), 'false');
    assert.equal(elements.statusField.textContent, 'Another User としてログインしています。');
    assert.equal(elements.errorField.hidden, true);
    assert.equal(document.body.dataset.authState, 'signed-in');
    assert.equal(elements.checkoutOnceButton.disabled, false);
  });

  it('セッション取得に失敗した場合はエラーメッセージを表示する', async () => {
    const { document, elements } = createDocument();

    globalThis.fetch = async (input) => {
      assert.equal(String(input), '/api/session');
      return jsonResponse({ status: 'error', error: { code: 'invalid_session' } });
    };

    await initializeDonatePage(document as unknown as Document);

    assert.equal(elements.loginButton.hidden, false);
    assert.equal(elements.logoutLink.hidden, true);
    assert.equal(elements.consentCheckbox.disabled, true);
    assert.equal(elements.consentCheckbox.checked, false);
    assert.equal(elements.errorField.hidden, false);
    assert.match(elements.errorField.textContent, /再度 Discord ログイン/);
    assert.equal(document.body.dataset.authState, 'error');
    assert.equal(elements.checkoutOnceButton.disabled, true);
    assert.equal(elements.checkoutError.hidden, true);
  });

  it('セッション情報の表示名はトリムされる', async () => {
    const { document, elements } = createDocument();

    globalThis.fetch = async (input) => {
      assert.equal(String(input), '/api/session');
      return jsonResponse({
        status: 'signed-in',
        session: { displayName: '  Space User  ', consentPublic: true },
      });
    };

    await initializeDonatePage(document as unknown as Document);

    assert.equal(elements.statusField.textContent, 'Space User としてログインしています。');
  });

  it('getCheckoutTarget は dataset の interval を null に正規化する', () => {
    const { getCheckoutTarget } = __test__;
    const button = new FakeElement('button');
    button.dataset = { mode: 'payment', variant: 'fixed300', interval: '' };

    const result = getCheckoutTarget(button as unknown as HTMLElement);

    assert.deepEqual(result, { mode: 'payment', variant: 'fixed300', interval: null });
  });

  it('HTML に必要なアクセシビリティ属性が含まれている', async () => {
    const fileContent = await readFile(
      new URL('public/donate/index.html', `file://${process.cwd()}/`),
      'utf8',
    );

    assert.match(fileContent, /aria-live="assertive"/);
    assert.match(fileContent, /role="status"/);
    assert.match(fileContent, /id="consent-public"/);
    const requiredElementIds = [
      'auth-login',
      'auth-logout',
      'auth-status',
      'auth-error',
      'consent-public',
      'donate-onetime',
      'donate-monthly',
      'donate-yearly',
      'checkout-error',
      'checkout-loading',
    ] as const;
    for (const id of requiredElementIds) {
      assert.ok(
        fileContent.includes(`id="${id}"`),
        `public/donate/index.html should contain id="${id}"`,
      );
    }
  });

  it('寄附ボタンのクリックで Checkout API を呼び出し URL に遷移する', async () => {
    const { document, elements } = createDocument();
    let sessionRequests = 0;
    let checkoutRequests = 0;

    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url === '/api/session') {
        sessionRequests += 1;
        return jsonResponse({
          status: 'signed-in',
          session: { displayName: '寄附ユーザー', consentPublic: true },
        });
      }
      if (url === '/api/checkout/session') {
        checkoutRequests += 1;
        assert.equal(init?.method, 'POST');
        const body = JSON.parse(init?.body as string);
        assert.equal(body.mode, 'payment');
        assert.equal(body.variant, 'fixed300');
        assert.equal(body.interval, null);
        return jsonResponse({ url: 'https://checkout.example/session' });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    };

    globalThis.location = {
      href: '',
      assign(this: { href: string }, url: string) {
        this.href = url;
      },
    } as unknown as Location;

    await initializeDonatePage(document as unknown as Document);
    await elements.checkoutOnceButton.dispatchEvent('click');

    assert.equal(sessionRequests, 1);
    assert.equal(checkoutRequests, 1);
    assert.equal(globalThis.location.href, 'https://checkout.example/session');
    assert.equal(elements.checkoutError.hidden, true);
    assert.equal(elements.checkoutLoading.hidden, true);
    assert.equal(elements.checkoutOnceButton.disabled, false);
  });

  it('Checkout API が失敗した場合はエラーメッセージを表示しボタンを再び有効化する', async () => {
    const { document, elements } = createDocument();

    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url === '/api/session') {
        return jsonResponse({
          status: 'signed-in',
          session: { displayName: '寄附ユーザー', consentPublic: true },
        });
      }
      if (url === '/api/checkout/session') {
        return jsonResponse(
          {
            error: { code: 'bad_request', message: '入力内容を確認してください。' },
          },
          { status: 400 },
        );
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    };

    await initializeDonatePage(document as unknown as Document);
    await elements.checkoutMonthlyButton.dispatchEvent('click');

    assert.equal(elements.checkoutError.hidden, false);
    assert.equal(elements.checkoutError.textContent, '入力内容を確認してください。');
    assert.equal(elements.checkoutLoading.hidden, true);
    assert.equal(elements.checkoutMonthlyButton.disabled, false);
  });
});
