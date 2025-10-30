import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

interface DonorsAppModule {
  readonly initializeDonorsPage: (doc?: Document) => void;
  readonly __test__: {
    readonly parseSessionCookieValue: (value: string) => { type: string };
    readonly getLatestDonorFetchPromise: () => Promise<void> | null;
  };
}

const donorsModule = await import(
  new URL('public/donors/app.js', `file://${process.cwd()}/`).href
) as DonorsAppModule;

const { initializeDonorsPage, __test__ } = donorsModule;

class FakeElement {
  public hidden = false;
  public disabled = false;
  public textContent = '';
  public dataset: Record<string, string> = {};
  public attributes = new Map<string, string>();
  public href = '';
  public children: FakeElement[] = [];
  public parent: FakeElement | null = null;
  private readonly listeners = new Map<string, Array<(event: { preventDefault: () => void }) => unknown>>();

  constructor(public readonly tagName: string, public id = '') {}

  get firstChild(): FakeElement | null {
    return this.children[0] ?? null;
  }

  setAttribute(name: string, value: string): void {
    if (name === 'id') {
      this.id = value;
    }
    this.attributes.set(name, value);
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  appendChild(child: FakeElement): FakeElement {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: FakeElement): FakeElement {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parent = null;
    }
    return child;
  }

  addEventListener(type: string, listener: (event: { preventDefault: () => void }) => unknown): void {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  async dispatchEvent(type: string): Promise<void> {
    const listeners = this.listeners.get(type) ?? [];
    for (const listener of listeners) {
      const event = {
        preventDefault() {
          // noop
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

  constructor(elements: FakeElement[]) {
    this.body = new FakeElement('body');
    this.body.dataset = {};
    for (const element of elements) {
      this.register(element);
    }
  }

  private register(element: FakeElement): void {
    if (element.id.length > 0) {
      this.elements.set(element.id, element);
    }
  }

  getElementById(id: string): FakeElement | null {
    return this.elements.get(id) ?? null;
  }

  createElement(tagName: string): FakeElement {
    return new FakeElement(tagName);
  }
}

interface TestElements {
  readonly donorsStatus: FakeElement;
  readonly donorsError: FakeElement;
  readonly donorsCount: FakeElement;
  readonly donorsList: FakeElement;
  readonly reloadButton: FakeElement;
  readonly consentLogin: FakeElement;
  readonly consentRevoke: FakeElement;
  readonly consentStatus: FakeElement;
  readonly consentError: FakeElement;
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

function encodeCookieForDocument(value: string): string {
  return `sess=${encodeURIComponent(value)}`;
}

function createTestDocument(): { document: FakeDocument; elements: TestElements } {
  const donorsStatus = new FakeElement('p', 'donors-status');
  const donorsError = new FakeElement('div', 'donors-error');
  donorsError.hidden = true;
  const donorsCount = new FakeElement('span', 'donor-count');
  donorsCount.textContent = '0';
  const donorsList = new FakeElement('ul', 'donors-list');
  const reloadButton = new FakeElement('button', 'donors-reload');
  const consentLogin = new FakeElement('a', 'consent-login');
  consentLogin.hidden = true;
  const consentRevoke = new FakeElement('button', 'consent-revoke');
  consentRevoke.hidden = true;
  const consentStatus = new FakeElement('div', 'consent-status');
  const consentError = new FakeElement('div', 'consent-error');
  consentError.hidden = true;

  const elements: TestElements = {
    donorsStatus,
    donorsError,
    donorsCount,
    donorsList,
    reloadButton,
    consentLogin,
    consentRevoke,
    consentStatus,
    consentError,
  };

  const document = new FakeDocument(Object.values(elements));
  return { document, elements };
}

async function waitForDonorFetch(): Promise<void> {
  const promise = __test__.getLatestDonorFetchPromise();
  if (promise) {
    await promise;
  }
}

describe('donors UI script', () => {
  const ORIGINAL_FETCH = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it('匿名閲覧時はログイン導線を表示し Donors リストを描画する', async () => {
    const { document, elements } = createTestDocument();

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ donors: ['Alice', 'Bob'], count: 2 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    initializeDonorsPage(document as unknown as Document);
    await waitForDonorFetch();

    assert.equal(elements.consentLogin.hidden, false);
    assert.equal(elements.consentRevoke.hidden, true);
    assert.equal(elements.donorsCount.textContent, '2');
    assert.equal(elements.donorsList.children.length, 2);
    assert.equal(elements.donorsList.children[0]?.textContent, 'Alice');
    assert.equal(elements.donorsStatus.textContent.includes('更新'), true);
  });

  it('掲示撤回操作で API を呼び出し、リストと状態を更新する', async () => {
    const { document, elements } = createTestDocument();
    const cookieValue = createSignedCookie('Charlie', true);
    document.cookie = encodeCookieForDocument(cookieValue);

    let callCount = 0;
    globalThis.fetch = async (input: RequestInfo | URL) => {
      callCount += 1;
      const url = String(input);
      if (callCount === 1) {
        assert.equal(url, '/api/donors');
        return new Response(
          JSON.stringify({ donors: ['Charlie', 'Delta'], count: 2 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      assert.equal(url, '/api/consent');
      return new Response(null, { status: 204 });
    };

    initializeDonorsPage(document as unknown as Document);
    await waitForDonorFetch();

    assert.equal(elements.consentRevoke.hidden, false);
    await elements.consentRevoke.dispatchEvent('click');

    assert.equal(elements.consentError.hidden, true);
    assert.equal(elements.consentRevoke.hidden, true);
    assert.ok(elements.consentStatus.textContent.includes('撤回しました'));
    assert.equal(elements.donorsList.children.length, 1);
    assert.equal(elements.donorsList.children[0]?.textContent, 'Delta');
  });

  it('Donors API が失敗した場合はエラーメッセージを表示する', async () => {
    const { document, elements } = createTestDocument();

    globalThis.fetch = async () => new Response('error', { status: 500 });

    initializeDonorsPage(document as unknown as Document);
    await waitForDonorFetch();

    assert.equal(elements.donorsError.hidden, false);
    assert.ok(elements.donorsStatus.textContent.includes('取得できません'));
  });
});
