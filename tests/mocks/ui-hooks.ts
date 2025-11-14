import { createElement, Fragment } from 'react';
import type { ReactNode } from 'react';
import type { CheckoutPreset, CheckoutState, SessionStatus } from '@/lib/ui/types';

type SessionHookMock = {
  status: SessionStatus;
  login: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
};

type ConsentHookMock = {
  updateConsent: (nextValue: boolean) => Promise<boolean>;
  isUpdating: boolean;
  error: string | null;
};

type ConsentHookOptions = {
  onUpdated?: (consent: boolean) => void;
};

type CheckoutHookMock = {
  startCheckout: (preset: CheckoutPreset) => Promise<void>;
  state: CheckoutState;
  resetError: () => void;
};

type DonorsHookMock = {
  donors: string[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type HeroContextMock = {
  heroInView: boolean;
  setHeroInView: (inView: boolean) => void;
  heroRef: (node: HTMLElement | null) => void;
  hasHeroSection: boolean;
  shouldDeemphasizeButton: boolean;
  setShouldDeemphasizeButton: (value: boolean) => void;
  buttonShouldBeDeemphasized: boolean;
};

function createSessionMock(): SessionHookMock {
  return {
    status: { state: 'loading' },
    login: () => undefined,
    logout: () => undefined,
    refresh: async () => undefined,
    isRefreshing: false,
  };
}

function createConsentMock(): ConsentHookMock {
  return {
    updateConsent: async () => false,
    isUpdating: false,
    error: null,
  };
}

function createCheckoutMock(): CheckoutHookMock {
  return {
    startCheckout: async () => undefined,
    state: { isProcessing: false, error: null },
    resetError: () => undefined,
  };
}

function createDonorsMock(): DonorsHookMock {
  return {
    donors: [],
    total: 0,
    isLoading: false,
    error: null,
    refresh: async () => undefined,
  };
}

function createHeroContextMock(): HeroContextMock {
  const hero: HeroContextMock = {
    heroInView: false,
    setHeroInView: (inView: boolean) => {
      hero.heroInView = inView;
      hero.buttonShouldBeDeemphasized = inView || hero.shouldDeemphasizeButton;
    },
    heroRef: () => undefined,
    hasHeroSection: false,
    shouldDeemphasizeButton: false,
    setShouldDeemphasizeButton: (value: boolean) => {
      hero.shouldDeemphasizeButton = value;
      hero.buttonShouldBeDeemphasized = value || hero.heroInView;
    },
    buttonShouldBeDeemphasized: false,
  };

  return hero;
}

const state = {
  session: createSessionMock(),
  consent: createConsentMock(),
  checkout: createCheckoutMock(),
  donors: createDonorsMock(),
  hero: createHeroContextMock(),
  checkoutResetCleared: false,
};

function setSessionHookMock(next: SessionHookMock): void {
  state.session = next;
}

function setConsentHookMock(next: ConsentHookMock): void {
  state.consent = next;
}

function setCheckoutHookMock(next: CheckoutHookMock): void {
  state.checkout = next;
  state.checkoutResetCleared = false;
}

function setDonorsHookMock(next: DonorsHookMock): void {
  state.donors = next;
}

function setHeroContextMock(next: HeroContextMock): void {
  state.hero = next;
}

function resetUIHookMocks(): void {
  state.session = createSessionMock();
  state.consent = createConsentMock();
  state.checkout = createCheckoutMock();
  state.donors = createDonorsMock();
  state.hero = createHeroContextMock();
  state.checkoutResetCleared = false;
}

function useSession(): SessionHookMock {
  return state.session;
}

function useConsentMutation(options: ConsentHookOptions = {}): ConsentHookMock {
  const getConsent = () => state.consent;

  return {
    async updateConsent(nextValue: boolean) {
      const result = await getConsent().updateConsent(nextValue);
      if (result) {
        options.onUpdated?.(nextValue);
      }
      return result;
    },
    get isUpdating() {
      return getConsent().isUpdating;
    },
    get error() {
      return getConsent().error;
    },
  };
}

function useCheckout(): CheckoutHookMock {
  const getCheckout = () => state.checkout;

  return {
    async startCheckout(preset: CheckoutPreset) {
      state.checkoutResetCleared = false;
      await getCheckout().startCheckout(preset);
    },
    get state() {
      return getCheckout().state;
    },
    resetError() {
      const checkout = getCheckout();
      if (state.checkoutResetCleared && checkout.state.error === null) {
        return;
      }
      checkout.resetError();
      state.checkoutResetCleared = checkout.state.error === null;
    },
  };
}

function useDonors(): DonorsHookMock {
  return state.donors;
}

function useHeroContext(): HeroContextMock {
  return state.hero;
}

function HeroProvider({ children }: { readonly children: ReactNode }) {
  return createElement(Fragment, null, children);
}

export {
  createCheckoutMock,
  createConsentMock,
  createDonorsMock,
  createHeroContextMock,
  createSessionMock,
  resetUIHookMocks,
  setCheckoutHookMock,
  setConsentHookMock,
  setDonorsHookMock,
  setHeroContextMock,
  setSessionHookMock,
  useCheckout,
  useConsentMutation,
  useDonors,
  useHeroContext,
  HeroProvider,
  useSession,
};

export type { CheckoutHookMock, ConsentHookMock, DonorsHookMock, HeroContextMock, SessionHookMock };
