import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

interface DonorsAppModule {
  readonly initializeDonorsPage: (doc?: Document) => Promise<void>;
  readonly __test__: {
    readonly fetchSessionState: () => Promise<
      | { readonly status: 'signed-out' }
      | { readonly status: 'error' }
      | {
          readonly status: 'signed-in';
          readonly session: { readonly displayName: string; readonly consentPublic: boolean };
        }
    >;
    readonly getLatestDonorFetchPromise: () => Promise<void> | null;
  };
}

const donorsModule = (await import(
  new URL('public/donors/app.js', `file://${process.cwd()}/`).href
)) as DonorsAppModule;

const { initializeDonorsPage, __test__ } = donorsModule;

class FakeElement {
  public hidden = false;
  public disabled = false;
  public textContent = '';
  public attributes = new Map<string, string>();
  public href = '';
  public children: FakeElement[] = [];
  public parent: FakeElement | null = null;
  private readonly listeners = new Map<
    string,
    Array<(event: { preventDefault: () => void }) => unknown>
  >();
  #dataset: Record<string, string> = {};

  constructor(
    public readonly tagName: string,
    public id = '',
  ) {}

  public get dataset(): Record<string, string> {
    return this.#dataset;
  }

  public set dataset(value: Record<string, string>) {
    this.#dataset = value;
  }

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

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
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

  it('HTML テンプレートに必要な要素 ID が揃っている', async () => {
    const fileContent = await readFile(
      new URL('public/donors/index.html', `file://${process.cwd()}/`),
      'utf8',
    );

    const requiredElementIds = [
      'donors-status',
      'donors-error',
      'donor-count',
      'donors-list',
      'donors-reload',
      'consent-login',
      'consent-revoke',
      'consent-status',
      'consent-error',
    ] as const;

    for (const id of requiredElementIds) {
      assert.ok(
        fileContent.includes(`id="${id}"`),
        `public/donors/index.html should contain id="${id}"`,
      );
    }
  });

  it('匿名閲覧時はログイン導線を表示し Donors リストを描画する', async () => {
    const { document, elements } = createTestDocument();
    let sessionRequests = 0;
    let donorRequests = 0;

    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url === '/api/session') {
        sessionRequests += 1;
        return jsonResponse({ status: 'signed-out' });
      }
      if (url === '/api/donors') {
        donorRequests += 1;
        return jsonResponse({
          donors: ['Alice', 'Bob'],
          count: 2,
        });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    };

    await initializeDonorsPage(document as unknown as Document);
    await waitForDonorFetch();

    assert.equal(sessionRequests, 1);
    assert.equal(donorRequests, 1);
    assert.equal(elements.consentLogin.hidden, false);
    assert.equal(elements.consentRevoke.hidden, true);
    assert.equal(
      elements.consentStatus.textContent,
      'Discord ログイン後に Donors 掲載の同意を管理できます。',
    );
    assert.equal(elements.donorsList.children.length, 2);
    const firstDonor = elements.donorsList.children[0];
    assert.equal(firstDonor?.dataset.displayName, 'Alice');
    assert.equal(firstDonor?.children[0]?.textContent, 'Alice');
    assert.equal(firstDonor?.children[1]?.textContent, '掲示に同意しています');
    assert.equal(elements.donorsCount.textContent, '2');
    assert.equal(elements.donorsError.hidden, true);
  });

  it('Donors が空の場合は空状態カードを表示する', async () => {
    const { document, elements } = createTestDocument();

    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url === '/api/session') {
        return jsonResponse({ status: 'signed-out' });
      }
      if (url === '/api/donors') {
        return jsonResponse({ donors: [], count: 0 });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    };

    await initializeDonorsPage(document as unknown as Document);
    await waitForDonorFetch();

    assert.equal(elements.donorsList.children.length, 1);
    const emptyState = elements.donorsList.children[0];
    assert.equal(emptyState?.dataset.state, 'empty');
    assert.match(emptyState?.textContent ?? '', /まだいません/);
    assert.equal(elements.donorsCount.textContent, '0');
  });

  it('掲示撤回操作で API を呼び出し、リストと状態を更新する', async () => {
    const { document, elements } = createTestDocument();
    let sessionRequests = 0;
    let consentCalls = 0;

    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url === '/api/session') {
        sessionRequests += 1;
        return jsonResponse({
          status: 'signed-in',
          session: { displayName: 'Alice', consentPublic: true },
        });
      }
      if (url === '/api/donors') {
        return jsonResponse({ donors: ['Alice', 'Bob'], count: 2 });
      }
      if (url === '/api/consent') {
        consentCalls += 1;
        assert.equal(init?.method, 'POST');
        const body = JSON.parse(init?.body as string);
        assert.equal(body.consent_public, false);
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    };

    await initializeDonorsPage(document as unknown as Document);
    await waitForDonorFetch();
    await elements.consentRevoke.dispatchEvent('click');

    assert.equal(sessionRequests, 1);
    assert.equal(consentCalls, 1);
    assert.equal(elements.consentRevoke.hidden, true);
    assert.match(elements.consentStatus.textContent ?? '', /撤回しました/);
    assert.equal(elements.donorsList.children.length, 1);
    const remainingDonor = elements.donorsList.children[0];
    assert.equal(remainingDonor?.dataset.displayName, 'Bob');
    assert.equal(elements.donorsCount.textContent, '1');
    assert.equal(elements.consentError.hidden, true);
  });

  it('Donors API が失敗した場合はエラーメッセージを表示する', async () => {
    const { document, elements } = createTestDocument();

    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url === '/api/session') {
        return jsonResponse({ status: 'signed-out' });
      }
      if (url === '/api/donors') {
        return new Response('error', { status: 500 });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    };

    await initializeDonorsPage(document as unknown as Document);
    await waitForDonorFetch();

    assert.equal(elements.donorsError.hidden, false);
    assert.match(elements.donorsError.textContent ?? '', /失敗しました/);
    assert.ok((elements.donorsStatus.textContent ?? '') !== '');
  });
});
