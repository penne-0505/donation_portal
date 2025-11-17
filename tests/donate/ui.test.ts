import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { CHECKOUT_PRESETS } from '@/lib/ui/checkout-presets';
import { HeroProvider } from '@/lib/ui/contexts/hero-context';
import type { CheckoutPreset } from '@/lib/ui/types';
import {
  createDonationFlowMock,
  resetUIHookMocks,
  setDonationFlowHookMock,
} from '../mocks/ui-hooks';

const { DonatePage } = await import('@/components/pages/donate-page');

function renderDonatePage() {
  return render(createElement(HeroProvider, undefined, createElement(DonatePage)));
}

describe('DonatePage React UI', () => {
  beforeEach(() => {
    resetUIHookMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('未ログイン時はログイン導線を表示し、CTA を無効化する', () => {
    let loginCalls = 0;
    const flow = createDonationFlowMock();
    flow.session.status = { state: 'signed-out' };
    flow.session.login = () => {
      loginCalls += 1;
    };
    setDonationFlowHookMock(flow);

    renderDonatePage();

    const loginButton = screen.getByRole('button', { name: /Discord でログイン/ });
    fireEvent.click(loginButton);
    assert.equal(loginCalls, 1);

    const consentToggle = screen.getByRole('checkbox', {
      name: 'ニックネームの掲示に同意する',
    }) as HTMLInputElement;
    assert.equal(consentToggle.disabled, true);
    assert.equal(consentToggle.checked, false);

    const cta = screen.getByRole('button', {
      name: 'プランを選択して寄付を進める',
    }) as HTMLButtonElement;
    assert.equal(cta.disabled, true);
  });

  it('ログイン済みセッションでは表示名と同意状態を反映する', async () => {
    const flow = createDonationFlowMock();
    flow.isSignedIn = true;
    flow.displayName = 'テストユーザー';
    flow.consent.value = true;
    flow.session.status = {
      state: 'signed-in',
      session: {
        displayName: 'テストユーザー',
        consentPublic: true,
        expiresAt: Date.now() + 60_000,
      },
    };
    setDonationFlowHookMock(flow);

    renderDonatePage();

    await waitFor(() => {
      assert.ok(screen.getByText('ログイン済み'));
    });

    assert.ok(screen.getByText('テストユーザー'));

    const consentToggle = screen.getByRole('checkbox', {
      name: 'ニックネームの掲示に同意する',
    }) as HTMLInputElement;
    await waitFor(() => {
      assert.equal(consentToggle.checked, true);
    });

    const logoutButton = screen.getByRole('button', { name: /ログアウト/ }) as HTMLButtonElement;
    assert.equal(logoutButton.disabled, false);
  });

  it('同意チェックをオンにすると API を呼び出す', async () => {
    const consentCalls: boolean[] = [];
    const consent = createDonationFlowMock().consent;
    consent.value = false;
    consent.toggle = async (nextValue: boolean) => {
      consentCalls.push(nextValue);
      return;
    };
    const flow = createDonationFlowMock();
    flow.isSignedIn = true;
    flow.displayName = 'Consent User';
    flow.consent = consent;
    flow.session.status = {
      state: 'signed-in',
      session: {
        displayName: 'Consent User',
        consentPublic: false,
        expiresAt: Date.now() + 60_000,
      },
    };
    setDonationFlowHookMock(flow);

    renderDonatePage();

    const consentToggle = screen.getByRole('checkbox', {
      name: 'ニックネームの掲示に同意する',
    }) as HTMLInputElement;

    await waitFor(() => {
      assert.equal(consentToggle.checked, false);
    });

    fireEvent.click(consentToggle);

    await waitFor(() => {
      assert.deepEqual(consentCalls, [true]);
    });
  });

  it('プラン選択で selectPreset/checkout.submit を呼び出す', async () => {
    const primaryPreset = CHECKOUT_PRESETS[0];
    const flow = createDonationFlowMock();
    flow.isSignedIn = true;
    flow.selectedPreset = primaryPreset;
    flow.presets = CHECKOUT_PRESETS;
    flow.checkout.isDisabled = false;
    flow.checkout.ctaLabel = `¥${primaryPreset.amount.toLocaleString('ja-JP')} の寄付を進める`;

    const presetsUsed: CheckoutPreset[] = [];
    flow.selectPreset = (preset: CheckoutPreset) => {
      presetsUsed.push(preset);
    };

    let submitCalls = 0;
    flow.checkout.submit = async () => {
      submitCalls += 1;
    };

    setDonationFlowHookMock(flow);

    renderDonatePage();

    const planRadio = screen.getByRole('radio', { name: new RegExp(primaryPreset.label) });
    fireEvent.click(planRadio);
    assert.equal(presetsUsed[0]?.id, primaryPreset.id);

    const cta = screen.getByRole('button', {
      name: new RegExp(`¥${primaryPreset.amount.toLocaleString('ja-JP')}`),
    });
    fireEvent.click(cta);

    await waitFor(() => {
      assert.equal(submitCalls, 1);
    });
  });

  it('Checkout がエラー状態のときはメッセージを表示する', () => {
    const flow = createDonationFlowMock();
    flow.isSignedIn = true;
    flow.checkout.error = 'Stripe Checkout の開始に失敗しました。時間をおいて再試行してください。';
    flow.selectedPreset = CHECKOUT_PRESETS[0];
    setDonationFlowHookMock(flow);

    renderDonatePage();

    assert.ok(
      screen.getByText('Stripe Checkout の開始に失敗しました。時間をおいて再試行してください。'),
    );
  });
});
