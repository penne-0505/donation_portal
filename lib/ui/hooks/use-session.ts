'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SessionInfo, SessionStatus } from '@/lib/ui/types';

interface SessionApiSuccess {
  readonly status: 'signed-in';
  readonly session: {
    readonly displayName: string;
    readonly consentPublic: boolean;
    readonly expiresAt: number;
  };
}

interface SessionApiSignedOut {
  readonly status: 'signed-out';
}

interface SessionApiError {
  readonly status: 'error';
  readonly error: {
    readonly message: string;
  };
}

type SessionApiResponse = SessionApiSuccess | SessionApiSignedOut | SessionApiError;

function parseSessionResponse(payload: unknown): SessionStatus {
  if (!payload || typeof payload !== 'object') {
    return { state: 'error', message: 'セッション情報の取得に失敗しました。' };
  }

  const body = payload as Partial<SessionApiResponse>;
  if (body.status === 'signed-in' && body.session) {
    const session = body.session as SessionInfo;
    return { state: 'signed-in', session };
  }

  if (body.status === 'signed-out') {
    return { state: 'signed-out' };
  }

  if (body.status === 'error' && body.error && typeof body.error.message === 'string') {
    return { state: 'error', message: body.error.message };
  }

  return { state: 'error', message: 'セッション情報の取得に失敗しました。' };
}

export function useSession() {
  const [status, setStatus] = useState<SessionStatus>({ state: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/session', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        setStatus({ state: 'error', message: 'セッション情報の取得に失敗しました。' });
        return;
      }

      const payload = (await response.json()) as unknown;
      setStatus(parseSessionResponse(payload));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'セッション情報の取得に失敗しました。時間をおいて再度お試しください。';
      setStatus({ state: 'error', message });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(() => {
    window.location.href = '/oauth/start';
  }, []);

  const logout = useCallback(() => {
    window.location.href = '/oauth/logout';
  }, []);

  return { status, refresh, login, logout, isRefreshing };
}
