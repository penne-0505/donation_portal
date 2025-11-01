'use client';

import { useCallback, useState } from 'react';
import type { CheckoutPreset, CheckoutState } from '@/lib/ui/types';

interface CheckoutApiErrorBody {
  readonly error?: {
    readonly message?: string;
  };
}

interface CheckoutApiSuccessBody {
  readonly url?: string;
}

const defaultState: CheckoutState = { isProcessing: false, error: null };

export function useCheckout() {
  const [state, setState] = useState<CheckoutState>(defaultState);

  const startCheckout = useCallback(async (preset: CheckoutPreset) => {
    setState({ isProcessing: true, error: null });
    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mode: preset.mode,
          variant: preset.variant,
          interval: preset.interval,
        }),
      });

      if (!response.ok) {
        let message = 'Stripe Checkout の開始に失敗しました。時間をおいて再試行してください。';
        try {
          const payload = (await response.json()) as CheckoutApiErrorBody;
          if (payload?.error?.message) {
            message = payload.error.message;
          }
        } catch {
          // ignore JSON parse errors
        }
        setState({ isProcessing: false, error: message });
        return;
      }

      const payload = (await response.json()) as CheckoutApiSuccessBody;
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      setState({
        isProcessing: false,
        error: 'Stripe Checkout の開始に失敗しました。時間をおいて再試行してください。',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Stripe Checkout の開始に失敗しました。時間をおいて再試行してください。';
      setState({ isProcessing: false, error: message });
    }
  }, []);

  const resetError = useCallback(() => {
    setState((previous) => ({ ...previous, error: null }));
  }, []);

  return { startCheckout, state, resetError };
}
