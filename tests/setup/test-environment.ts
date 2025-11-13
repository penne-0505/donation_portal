import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const { window } = dom;

function copyProps(target: typeof globalThis, source: typeof window) {
  for (const key of Object.getOwnPropertyNames(source)) {
    if (key in target) {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (descriptor) {
      Object.defineProperty(target, key, descriptor);
    }
  }
}

// Attach essential globals for React Testing Library
Object.defineProperty(globalThis, 'window', {
  value: window,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: window.document,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'navigator', {
  value: window.navigator,
  configurable: true,
  writable: true,
});

// Propagate other window properties (e.g., Element, Node)
copyProps(globalThis, window);

// Provide a minimal matchMedia mock used by some UI components
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

if (typeof window.IntersectionObserver !== 'function') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null;
    readonly rootMargin: string;
    readonly thresholds: ReadonlyArray<number>;

    constructor(
      readonly callback: IntersectionObserverCallback,
      options: IntersectionObserverInit = {},
    ) {
      this.root = options.root ?? null;
      this.rootMargin = options.rootMargin ?? '0px';
      const threshold = options.threshold ?? 0;
      this.thresholds = Array.isArray(threshold) ? threshold : [threshold];
    }

    observe(): void {
      // no-op for test environment
    }

    unobserve(): void {
      // no-op for test environment
    }

    disconnect(): void {
      // no-op for test environment
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    value: MockIntersectionObserver,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    value: MockIntersectionObserver,
    configurable: true,
    writable: true,
  });
}

globalThis.requestAnimationFrame ||= (callback: FrameRequestCallback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame ||= (id: number) => clearTimeout(id);
