'use client';

import { useCallback } from 'react';
import { useConsentMutation } from '@/lib/ui/hooks/use-consent';
import { useDonors } from '@/lib/ui/hooks/use-donors';
import { useSession } from '@/lib/ui/hooks/use-session';

type ConfirmFunction = (message: string) => boolean;

export interface DonorDirectoryOptions {
  readonly confirm?: ConfirmFunction;
}

export interface DonorDirectoryState {
  readonly session: ReturnType<typeof useSession>;
  readonly isSignedIn: boolean;
  readonly consentPublic: boolean;
  readonly donors: readonly string[];
  readonly total: number;
  readonly donorError: string | null;
  readonly isLoading: boolean;
  readonly consentError: string | null;
  readonly isConsentUpdating: boolean;
  readonly refreshDonors: () => Promise<void>;
  readonly refreshSession: () => Promise<void>;
  readonly revokeConsent: () => Promise<void>;
  readonly login: () => void;
  readonly logout: () => void;
}

export function useDonorDirectory(options: DonorDirectoryOptions = {}): DonorDirectoryState {
  const session = useSession();
  const donorsResult = useDonors();
  const {
    updateConsent,
    isUpdating: isConsentUpdating,
    error: consentError,
  } = useConsentMutation({
    onUpdated: () => {
      void session.refresh();
    },
  });

  const status = session.status;
  const signedInSession = status.state === 'signed-in' ? status.session : null;
  const isSignedIn = Boolean(signedInSession);
  const consentPublic = signedInSession?.consentPublic ?? false;

  const confirmFn: ConfirmFunction = useCallback(
    (message: string) => {
      if (options.confirm) {
        return options.confirm(message);
      }
      if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
        return true;
      }
      return window.confirm(message);
    },
    [options.confirm],
  );

  const revokeConsent = useCallback(async () => {
    if (!isSignedIn) {
      return;
    }
    const approved = confirmFn('支援者掲載を撤回しますか？');
    if (!approved) {
      return;
    }
    const success = await updateConsent(false);
    if (success) {
      await donorsResult.refresh();
    }
  }, [confirmFn, donorsResult, isSignedIn, updateConsent]);

  return {
    session,
    isSignedIn,
    consentPublic,
    donors: donorsResult.donors,
    total: donorsResult.total,
    donorError: donorsResult.error,
    isLoading: donorsResult.isLoading,
    consentError,
    isConsentUpdating,
    refreshDonors: donorsResult.refresh,
    refreshSession: session.refresh,
    revokeConsent,
    login: session.login,
    logout: session.logout,
  };
}
