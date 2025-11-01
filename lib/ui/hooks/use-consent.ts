'use client';

import { useCallback, useState } from 'react';

interface UseConsentOptions {
  readonly onUpdated?: (consent: boolean) => void;
}

interface ConsentApiErrorBody {
  readonly error?: {
    readonly message?: string;
  };
}

export function useConsentMutation({ onUpdated }: UseConsentOptions = {}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateConsent = useCallback(
    async (nextValue: boolean) => {
      setIsUpdating(true);
      setError(null);
      let success = false;
      try {
        const response = await fetch('/api/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ consent_public: nextValue }),
        });

        if (!response.ok) {
          let message = '同意状態の更新に失敗しました。時間をおいて再実行してください。';
          try {
            const payload = (await response.json()) as ConsentApiErrorBody;
            if (payload?.error?.message) {
              message = payload.error.message;
            }
          } catch {
            // ignore JSON parsing errors
          }
          setError(message);
        } else {
          onUpdated?.(nextValue);
          success = true;
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : '同意状態の更新に失敗しました。時間をおいて再実行してください。';
        setError(message);
      } finally {
        setIsUpdating(false);
      }
      return success;
    },
    [onUpdated],
  );

  return { updateConsent, isUpdating, error };
}
