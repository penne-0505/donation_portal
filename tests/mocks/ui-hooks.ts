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

const state = {
  session: createSessionMock(),
  consent: createConsentMock(),
  checkout: createCheckoutMock(),
  donors: createDonorsMock(),
};

function setSessionHookMock(next: SessionHookMock): void {
  state.session = next;
}

function setConsentHookMock(next: ConsentHookMock): void {
  state.consent = next;
}

function setCheckoutHookMock(next: CheckoutHookMock): void {
  state.checkout = next;
}

function setDonorsHookMock(next: DonorsHookMock): void {
  state.donors = next;
}

function resetUIHookMocks(): void {
  state.session = createSessionMock();
  state.consent = createConsentMock();
  state.checkout = createCheckoutMock();
  state.donors = createDonorsMock();
}

function useSession(): SessionHookMock {
  return state.session;
}

function useConsentMutation(): ConsentHookMock {
  return state.consent;
}

function useCheckout(): CheckoutHookMock {
  return state.checkout;
}

function useDonors(): DonorsHookMock {
  return state.donors;
}

export {
  createCheckoutMock,
  createConsentMock,
  createDonorsMock,
  createSessionMock,
  resetUIHookMocks,
  setCheckoutHookMock,
  setConsentHookMock,
  setDonorsHookMock,
  setSessionHookMock,
  useCheckout,
  useConsentMutation,
  useDonors,
  useSession,
};

export type { CheckoutHookMock, ConsentHookMock, DonorsHookMock, SessionHookMock };
