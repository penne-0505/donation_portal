'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHECKOUT_PRESETS } from '@/lib/ui/checkout-presets';
import { useCheckout } from '@/lib/ui/hooks/use-checkout';
import { useConsentMutation } from '@/lib/ui/hooks/use-consent';
import { useSession } from '@/lib/ui/hooks/use-session';
import type { CheckoutPreset } from '@/lib/ui/types';

interface DonationConsentState {
  readonly value: boolean;
  readonly isUpdating: boolean;
  readonly error: string | null;
  readonly toggle: (nextValue: boolean) => Promise<void>;
}

interface DonationCheckoutState {
  readonly isProcessing: boolean;
  readonly error: string | null;
  readonly ctaLabel: string;
  readonly ctaStatusMessage: string;
  readonly isDisabled: boolean;
  readonly submit: () => Promise<void>;
}

export interface DonationFlowState {
  readonly session: ReturnType<typeof useSession>;
  readonly isSignedIn: boolean;
  readonly displayName: string;
  readonly consent: DonationConsentState;
  readonly checkout: DonationCheckoutState;
  readonly presets: readonly CheckoutPreset[];
  readonly selectedPreset: CheckoutPreset | null;
  readonly selectPreset: (preset: CheckoutPreset) => void;
  readonly consentError: string | null;
}

export function useDonationFlow(): DonationFlowState {
  const session = useSession();
  const { startCheckout, state: checkoutState, resetError } = useCheckout();
  const [selectedPreset, setSelectedPreset] = useState<CheckoutPreset | null>(null);
  const [consentValue, setConsentValue] = useState(false);
  const {
    updateConsent,
    isUpdating: isConsentUpdating,
    error: consentError,
  } = useConsentMutation({
    onUpdated: (nextValue: boolean) => {
      setConsentValue(nextValue);
      void session.refresh();
    },
  });

  const status = session.status;
  const signedInSession = status.state === 'signed-in' ? status.session : null;
  const isSignedIn = Boolean(signedInSession);
  const displayName = signedInSession?.displayName ?? '';

  useEffect(() => {
    if (signedInSession) {
      setConsentValue(signedInSession.consentPublic);
    } else {
      setConsentValue(false);
    }
  }, [signedInSession]);

  const handleConsentToggle = useCallback(
    async (nextValue: boolean) => {
      if (!isSignedIn || nextValue === consentValue) {
        return;
      }
      await updateConsent(nextValue);
    },
    [consentValue, isSignedIn, updateConsent],
  );

  const selectPreset = useCallback(
    (preset: CheckoutPreset) => {
      setSelectedPreset(preset);
      resetError();
    },
    [resetError],
  );

  const submitDonation = useCallback(async () => {
    if (!isSignedIn || !selectedPreset) {
      return;
    }
    resetError();
    if (typeof window !== 'undefined') {
      const gtag = (window as { gtag?: (type: string, event: string) => void }).gtag;
      gtag?.('event', 'donate_start');
    }
    await startCheckout(selectedPreset);
  }, [isSignedIn, resetError, selectedPreset, startCheckout]);

  const ctaLabel = useMemo(() => {
    if (selectedPreset) {
      return `¥${selectedPreset.amount.toLocaleString('ja-JP')} の寄付を進める`;
    }
    return 'プランを選択して寄付を進める';
  }, [selectedPreset]);

  const ctaStatusMessage = useMemo(() => {
    if (!isSignedIn) {
      return 'Discord でログインすると寄付ボタンが有効になります。';
    }
    if (!selectedPreset) {
      return 'まずは支援プランを 1 つ選択してください。';
    }
    if (checkoutState.isProcessing) {
      return 'Stripe Checkout を準備しています…';
    }
    return '寄付ボタンを押すと Stripe Checkout に移動します。';
  }, [checkoutState.isProcessing, isSignedIn, selectedPreset]);

  const consent: DonationConsentState = {
    value: consentValue,
    isUpdating: isConsentUpdating,
    error: consentError,
    toggle: handleConsentToggle,
  };

  const checkout: DonationCheckoutState = {
    isProcessing: checkoutState.isProcessing,
    error: checkoutState.error,
    ctaLabel,
    ctaStatusMessage,
    isDisabled: !isSignedIn || !selectedPreset || checkoutState.isProcessing,
    submit: submitDonation,
  };

  return {
    session,
    isSignedIn,
    displayName,
    consent,
    consentError,
    checkout,
    presets: CHECKOUT_PRESETS,
    selectedPreset,
    selectPreset,
  };
}
