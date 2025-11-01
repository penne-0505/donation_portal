export interface SessionInfo {
  readonly displayName: string;
  readonly consentPublic: boolean;
  readonly expiresAt: number;
}

export type SessionStatus =
  | { readonly state: 'loading' }
  | { readonly state: 'signed-out' }
  | { readonly state: 'error'; readonly message: string }
  | { readonly state: 'signed-in'; readonly session: SessionInfo };

export interface CheckoutPreset {
  readonly id: string;
  readonly mode: 'payment' | 'subscription';
  readonly label: string;
  readonly description: string;
  readonly amount: number;
  readonly interval: null | 'monthly' | 'yearly';
  readonly variant: 'fixed300' | 'fixed3000';
}

export interface CheckoutState {
  readonly isProcessing: boolean;
  readonly error: string | null;
}
