import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { CHECKOUT_PRESETS } from '@/lib/ui/checkout-presets';
import type { CheckoutPreset, CheckoutState } from '@/lib/ui/types';
import {
  createCheckoutMock,
  createConsentMock,
  createSessionMock,
  resetUIHookMocks,
  setCheckoutHookMock,
  setConsentHookMock,
  setSessionHookMock,
} from '../mocks/ui-hooks';

const { DonatePage } = await import('@/components/pages/donate-page');

describe('DonatePage React UI', () => {
  beforeEach(() => {
    resetUIHookMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('未ログイン時はログイン導線を表示し、CTA を無効化する', () => {
    let loginCalls = 0;
    const session = createSessionMock();
    session.status = { state: 'signed-out' };
    session.login = () => {
      loginCalls += 1;
    };
    setSessionHookMock(session);

    render(createElement(DonatePage));

    const loginButton = screen.getByRole('button', { name: /Discord でログイン/ });
    fireEvent.click(loginButton);
    assert.equal(loginCalls, 1);

    const consentToggle = screen.getByRole('switch', {
      name: '支援者ページに表示名を掲載することに同意します',
    }) as HTMLButtonElement;
    assert.equal(consentToggle.disabled, true);
    assert.equal(consentToggle.getAttribute('aria-checked'), 'false');

    const cta = screen.getByRole('button', {
      name: 'プランを選択して寄付を進める',
    }) as HTMLButtonElement;
    assert.equal(cta.disabled, true);
  });

  it('ログイン済みセッションでは表示名と同意状態を反映する', async () => {
    const session = createSessionMock();
    session.status = {
      state: 'signed-in',
      session: {
        displayName: 'テストユーザー',
        consentPublic: true,
        expiresAt: Date.now() + 60_000,
      },
    };
    setSessionHookMock(session);

    render(createElement(DonatePage));

    await waitFor(() => {
      assert.ok(screen.getByText('ログイン済み'));
    });

    assert.ok(screen.getByText('テストユーザー'));

    const consentToggle = screen.getByRole('switch', {
      name: '支援者ページに表示名を掲載することに同意します',
    }) as HTMLButtonElement;
    await waitFor(() => {
      assert.equal(consentToggle.getAttribute('aria-checked'), 'true');
    });

    const logoutButton = screen.getByRole('button', { name: /ログアウト/ }) as HTMLButtonElement;
    assert.equal(logoutButton.disabled, false);
  });

  it('同意チェックをオンにすると API を呼び出す', async () => {
    const session = createSessionMock();
    session.status = {
      state: 'signed-in',
      session: {
        displayName: 'Consent User',
        consentPublic: false,
        expiresAt: Date.now() + 60_000,
      },
    };
    setSessionHookMock(session);

    const consentCalls: boolean[] = [];
    const consent = createConsentMock();
    consent.updateConsent = async (nextValue: boolean) => {
      consentCalls.push(nextValue);
      return true;
    };
    setConsentHookMock(consent);

    render(createElement(DonatePage));

    const consentToggle = screen.getByRole('switch', {
      name: '支援者ページに表示名を掲載することに同意します',
    }) as HTMLButtonElement;

    await waitFor(() => {
      assert.equal(consentToggle.getAttribute('aria-checked'), 'false');
    });

    fireEvent.click(consentToggle);

    await waitFor(() => {
      assert.deepEqual(consentCalls, [true]);
      assert.equal(consentToggle.getAttribute('aria-checked'), 'true');
    });
  });

  it('プラン選択後の CTA で Checkout を開始し、インパクトカードを表示する', async () => {
    const session = createSessionMock();
    session.status = {
      state: 'signed-in',
      session: {
        displayName: 'Checkout User',
        consentPublic: true,
        expiresAt: Date.now() + 60_000,
      },
    };
    setSessionHookMock(session);

    let resetErrorCalls = 0;
    const presetsUsed: CheckoutPreset[] = [];
    const checkout = createCheckoutMock();
    checkout.startCheckout = async (preset: CheckoutPreset) => {
      presetsUsed.push(preset);
    };
    checkout.resetError = () => {
      resetErrorCalls += 1;
    };
    setCheckoutHookMock(checkout);

    render(createElement(DonatePage));

    const primaryPreset = CHECKOUT_PRESETS[0];
    const planRadio = screen.getByRole('radio', { name: new RegExp(primaryPreset.label) });
    fireEvent.click(planRadio);

    const cta = screen.getByRole('button', {
      name: new RegExp(`¥${primaryPreset.amount.toLocaleString('ja-JP')}`),
    });
    fireEvent.click(cta);

    await waitFor(() => {
      assert.equal(presetsUsed.length, 1);
    });

    assert.equal(presetsUsed[0]?.id, primaryPreset.id);
    assert.equal(resetErrorCalls, 1);

    await waitFor(() => {
      assert.ok(screen.getByText(/選択したプラン/));
    });
  });

  it('Checkout フックがエラー状態のときはエラーメッセージを表示する', () => {
    const session = createSessionMock();
    session.status = {
      state: 'signed-in',
      session: {
        displayName: 'Error User',
        consentPublic: true,
        expiresAt: Date.now() + 60_000,
      },
    };
    setSessionHookMock(session);

    const checkout = createCheckoutMock();
    checkout.state = {
      isProcessing: false,
      error: 'Stripe Checkout の開始に失敗しました。時間をおいて再試行してください。',
    } as CheckoutState;
    setCheckoutHookMock(checkout);

    render(createElement(DonatePage));

    assert.ok(
      screen.getByText('Stripe Checkout の開始に失敗しました。時間をおいて再試行してください。'),
    );
  });
});
