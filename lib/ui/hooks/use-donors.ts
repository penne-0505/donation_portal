'use client';

import { useCallback, useEffect, useState } from 'react';

interface DonorsApiSuccessBody {
  readonly donors?: string[];
  readonly count?: number;
}

interface DonorsApiErrorBody {
  readonly error?: {
    readonly message?: string;
  };
}

interface DonorsState {
  readonly donors: string[];
  readonly total: number;
  readonly isLoading: boolean;
  readonly error: string | null;
}

const initialState: DonorsState = {
  donors: [],
  total: 0,
  isLoading: true,
  error: null,
};

export function useDonors() {
  const [state, setState] = useState<DonorsState>(initialState);

  const fetchDonors = useCallback(async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }));
    try {
      const response = await fetch('/api/donors?limit=100', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        let message = '支援者情報の取得に失敗しました。';
        try {
          const payload = (await response.json()) as DonorsApiErrorBody;
          if (payload?.error?.message) {
            message = payload.error.message;
          }
        } catch {
          // ignore JSON parse errors
        }
        setState({ donors: [], total: 0, isLoading: false, error: message });
        return;
      }

      const payload = (await response.json()) as DonorsApiSuccessBody;
      const donors = Array.isArray(payload?.donors) ? payload.donors : [];
      const total = typeof payload?.count === 'number' ? payload.count : donors.length;
      setState({ donors, total, isLoading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : '支援者情報の取得に失敗しました。';
      setState({ donors: [], total: 0, isLoading: false, error: message });
    }
  }, []);

  useEffect(() => {
    void fetchDonors();
  }, [fetchDonors]);

  return {
    donors: state.donors,
    total: state.total,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchDonors,
  };
}
