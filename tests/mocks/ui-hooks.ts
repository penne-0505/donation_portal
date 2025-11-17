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

type DonationFlowHookMock = {
  session: SessionHookMock;
  isSignedIn: boolean;
  displayName: string;
  consent: {
    value: boolean;
    isUpdating: boolean;
    error: string | null;
    toggle: (nextValue: boolean) => Promise<void>;
  };
  consentError: string | null;
  checkout: {
    isProcessing: boolean;
    error: string | null;
    ctaLabel: string;
    ctaStatusMessage: string;
    isDisabled: boolean;
    submit: () => Promise<void>;
  };
  presets: readonly CheckoutPreset[];
  selectedPreset: CheckoutPreset | null;
  selectPreset: (preset: CheckoutPreset) => void;
};

type DonorDirectoryHookMock = {
  session: SessionHookMock;
  isSignedIn: boolean;
  consentPublic: boolean;
  donors: string[];
  total: number;
  donorError: string | null;
  isLoading: boolean;
  consentError: string | null;
  isConsentUpdating: boolean;
  refreshDonors: () => Promise<void>;
  refreshSession: () => Promise<void>;
  revokeConsent: () => Promise<void>;
  login: () => void;
  logout: () => void;
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

function createDonationFlowMock(): DonationFlowHookMock {
  return {
    session: createSessionMock(),
    isSignedIn: false,
    displayName: '',
    consent: {
      value: false,
      isUpdating: false,
      error: null,
      toggle: async () => undefined,
    },
    consentError: null,
    checkout: {
      isProcessing: false,
      error: null,
      ctaLabel: 'プランを選択して寄付を進める',
      ctaStatusMessage: 'Discord でログインすると寄付ボタンが有効になります。',
      isDisabled: true,
      submit: async () => undefined,
    },
    presets: [],
    selectedPreset: null,
    selectPreset: () => undefined,
  };
}

function createDonorDirectoryMock(): DonorDirectoryHookMock {
  return {
    session: createSessionMock(),
    isSignedIn: false,
    consentPublic: false,
    donors: [],
    total: 0,
    donorError: null,
    isLoading: false,
    consentError: null,
    isConsentUpdating: false,
    refreshDonors: async () => undefined,
    refreshSession: async () => undefined,
    revokeConsent: async () => undefined,
    login: () => undefined,
    logout: () => undefined,
  };
}

const state = {
  session: createSessionMock(),
  consent: createConsentMock(),
  checkout: createCheckoutMock(),
  donors: createDonorsMock(),
  donationFlow: createDonationFlowMock(),
  donorDirectory: createDonorDirectoryMock(),
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

function setDonationFlowHookMock(next: DonationFlowHookMock): void {
  state.donationFlow = next;
}

function setDonorDirectoryHookMock(next: DonorDirectoryHookMock): void {
  state.donorDirectory = next;
}

function resetUIHookMocks(): void {
  state.session = createSessionMock();
  state.consent = createConsentMock();
  state.checkout = createCheckoutMock();
  state.donors = createDonorsMock();
  state.donationFlow = createDonationFlowMock();
  state.donorDirectory = createDonorDirectoryMock();
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

function useDonationFlow(): DonationFlowHookMock {
  return state.donationFlow;
}

function useDonorDirectory(): DonorDirectoryHookMock {
  return state.donorDirectory;
}

export {
  createCheckoutMock,
  createConsentMock,
  createDonorsMock,
  createDonorDirectoryMock,
  createDonationFlowMock,
  createSessionMock,
  resetUIHookMocks,
  setCheckoutHookMock,
  setConsentHookMock,
  setDonorsHookMock,
  setDonorDirectoryHookMock,
  setDonationFlowHookMock,
  setSessionHookMock,
  useCheckout,
  useConsentMutation,
  useDonors,
  useDonorDirectory,
  useDonationFlow,
  useSession,
};

export type {
  CheckoutHookMock,
  ConsentHookMock,
  DonorDirectoryHookMock,
  DonationFlowHookMock,
  DonorsHookMock,
  SessionHookMock,
};
