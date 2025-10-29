import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
interface DonateAppModule {
  readonly initializeDonatePage: (doc?: Document) => void;
  readonly __test__: {
    readonly parseSessionCookieValue: (value: string) => {
      readonly type: string;
      readonly session: { readonly displayName: string; readonly consentPublic: boolean };
    };
  };
}

const donateModule = await import(
  new URL('public/donate/app.js', `file://${process.cwd()}/`).href
) as DonateAppModule;

const { initializeDonatePage, __test__ } = donateModule;

interface TestElements {
  readonly loginButton: FakeElement;
  readonly logoutLink: FakeElement;
  readonly statusField: FakeElement;
  readonly errorField: FakeElement;
  readonly consentCheckbox: FakeElement;
}

class FakeElement {
  public hidden = false;
  public disabled = false;
  public checked = false;
  public textContent = '';
  public dataset: Record<string, string> = {};
  public attributes = new Map<string, string>();
  public href = '';

  constructor(public readonly tagName: string, public id = '') {}

  setAttribute(name: string, value: string): void {
    if (name === 'id') {
      this.id = value;
    }
    this.attributes.set(name, value);
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
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

function createSignedCookie(displayName: string, consent: boolean): string {
  const now = Date.now();
  const payload = {
    name: 'sess',
    value: JSON.stringify({
      display_name: displayName,
      consent_public: consent,
      exp: Math.floor(now / 1000) + 600,
    }),
    issuedAt: now,
    expiresAt: now + 600_000,
  } satisfies Record<string, unknown>;
  const encoded = Buffer.from(JSON.stringify(payload))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${encoded}.signature`;
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

  const elements: TestElements = {
    loginButton,
    logoutLink,
    statusField,
    errorField,
    consentCheckbox,
  };

  const document = new FakeDocument(elements);
  return { document, elements };
}

function encodeCookieForDocument(value: string): string {
  return `sess=${encodeURIComponent(value)}`;
}

describe('donate UI script', () => {
  it('OAuth 未ログイン状態ではログイン導線を表示し、同意は無効化される', () => {
    const { document, elements } = createDocument();

    initializeDonatePage(document as unknown as Document);

    assert.equal(elements.loginButton.hidden, false);
    assert.equal(elements.logoutLink.hidden, true);
    assert.equal(elements.consentCheckbox.disabled, true);
    assert.equal(elements.consentCheckbox.checked, false);
    assert.equal(elements.consentCheckbox.attributes.get('aria-checked'), 'false');
    assert.equal(elements.consentCheckbox.attributes.get('aria-disabled'), 'true');
    assert.equal(elements.statusField.textContent, 'Discord へのログインが必要です。');
    assert.equal(elements.errorField.hidden, true);
    assert.equal(document.body.dataset.authState, 'signed-out');
  });

  it('有効な sess Cookie でログイン状態と同意内容が反映される', () => {
    const { document, elements } = createDocument();
    const cookieValue = createSignedCookie('テストユーザー', true);
    document.cookie = encodeCookieForDocument(cookieValue);

    initializeDonatePage(document as unknown as Document);

    assert.equal(elements.loginButton.hidden, true);
    assert.equal(elements.logoutLink.hidden, false);
    assert.equal(elements.statusField.textContent, 'テストユーザー としてログインしています。');
    assert.equal(elements.consentCheckbox.disabled, false);
    assert.equal(elements.consentCheckbox.checked, true);
    assert.equal(elements.consentCheckbox.attributes.get('aria-checked'), 'true');
    assert.equal(elements.consentCheckbox.attributes.has('aria-disabled'), false);
    assert.equal(elements.errorField.hidden, true);
    assert.equal(document.body.dataset.authState, 'signed-in');
  });

  it('同意がオフの sess Cookie はチェック状態を外す', () => {
    const { document, elements } = createDocument();
    const cookieValue = createSignedCookie('Another User', false);
    document.cookie = encodeCookieForDocument(cookieValue);

    initializeDonatePage(document as unknown as Document);

    assert.equal(elements.consentCheckbox.disabled, false);
    assert.equal(elements.consentCheckbox.checked, false);
    assert.equal(elements.consentCheckbox.attributes.get('aria-checked'), 'false');
    assert.equal(elements.statusField.textContent, 'Another User としてログインしています。');
    assert.equal(elements.errorField.hidden, true);
    assert.equal(document.body.dataset.authState, 'signed-in');
  });

  it('Cookie の解析に失敗した場合はエラーメッセージを表示する', () => {
    const { document, elements } = createDocument();
    document.cookie = encodeCookieForDocument('invalid-cookie');

    initializeDonatePage(document as unknown as Document);

    assert.equal(elements.loginButton.hidden, false);
    assert.equal(elements.logoutLink.hidden, true);
    assert.equal(elements.consentCheckbox.disabled, true);
    assert.equal(elements.consentCheckbox.checked, false);
    assert.equal(elements.errorField.hidden, false);
    assert.match(elements.errorField.textContent, /再度 Discord ログイン/);
    assert.equal(document.body.dataset.authState, 'error');
  });

  it('sess Cookie の復号処理は display_name をトリムして利用する', () => {
    const { parseSessionCookieValue } = __test__;
    const cookieValue = createSignedCookie('  Space User  ', true);

    const result = parseSessionCookieValue(cookieValue);

    assert.equal(result.type, 'valid');
    assert.equal(result.session.displayName, 'Space User');
    assert.equal(result.session.consentPublic, true);
  });

  it('HTML に必要なアクセシビリティ属性が含まれている', async () => {
    const fileContent = await readFile(
      new URL('public/donate/index.html', `file://${process.cwd()}/`),
      'utf8',
    );

    assert.match(fileContent, /aria-live="assertive"/);
    assert.match(fileContent, /role="status"/);
    assert.match(fileContent, /id="consent-public"/);
  });
});
