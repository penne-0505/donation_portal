import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import {
  createConsentMock,
  createDonorsMock,
  createSessionMock,
  resetUIHookMocks,
  setConsentHookMock,
  setDonorsHookMock,
  setSessionHookMock,
} from '../mocks/ui-hooks';

const { DonorsPage } = await import('@/components/pages/donors-page');

const originalConfirm = window.confirm;

describe('DonorsPage React UI', () => {
  beforeEach(() => {
    resetUIHookMocks();
    window.confirm = originalConfirm;
  });

  afterEach(() => {
    cleanup();
    window.confirm = originalConfirm;
  });

  it('未ログイン時はログイン導線を表示し、支援者一覧を読み込む', () => {
    let loginCalls = 0;
    const session = createSessionMock();
    session.status = { state: 'signed-out' };
    session.login = () => {
      loginCalls += 1;
    };
    setSessionHookMock(session);

    const donors = createDonorsMock();
    donors.donors = ['Alice', 'Bob'];
    donors.total = 2;
    setDonorsHookMock(donors);

    render(createElement(DonorsPage));

    const loginButton = screen.getByRole('button', { name: /Discord でログイン/ });
    fireEvent.click(loginButton);
    assert.equal(loginCalls, 1);

    assert.ok(screen.getByText('Alice'));
    assert.ok(screen.getByText('Bob'));
    assert.equal(screen.queryByRole('button', { name: /掲示を撤回する/ }), null);
  });

  it('支援者 API がエラーの場合はメッセージを表示する', () => {
    const session = createSessionMock();
    session.status = { state: 'signed-out' };
    setSessionHookMock(session);

    const donors = createDonorsMock();
    donors.error = '支援者情報の取得に失敗しました。';
    donors.isLoading = false;
    setDonorsHookMock(donors);

    render(createElement(DonorsPage));

    assert.ok(screen.getByText('支援者情報の取得に失敗しました。'));
  });

  it('掲示撤回操作で確認ダイアログと API 呼び出しを行う', async () => {
    const session = createSessionMock();
    session.status = {
      state: 'signed-in',
      session: {
        displayName: 'Alice',
        consentPublic: true,
        expiresAt: Date.now() + 60_000,
      },
    };
    setSessionHookMock(session);

    const donors = createDonorsMock();
    donors.donors = ['Alice', 'Bob'];
    donors.total = 2;
    setDonorsHookMock(donors);

    let refreshCalls = 0;
    donors.refresh = async () => {
      refreshCalls += 1;
    };

    const consentCalls: boolean[] = [];
    const consent = createConsentMock();
    consent.updateConsent = async (nextValue: boolean) => {
      consentCalls.push(nextValue);
      return true;
    };
    setConsentHookMock(consent);

    let confirmCalls = 0;
    window.confirm = (() => {
      confirmCalls += 1;
      return true;
    }) as typeof window.confirm;

    render(createElement(DonorsPage));

    const revokeButton = await screen.findByRole('button', { name: /掲示を撤回する/ });
    fireEvent.click(revokeButton);

    await waitFor(() => {
      assert.equal(confirmCalls, 1);
      assert.deepEqual(consentCalls, [false]);
      assert.equal(refreshCalls, 1);
    });
  });

  it('更新ボタンで支援者情報を再取得する', async () => {
    const session = createSessionMock();
    session.status = { state: 'signed-out' };
    setSessionHookMock(session);

    const donors = createDonorsMock();
    donors.donors = ['Alice'];
    donors.total = 1;
    setDonorsHookMock(donors);

    let refreshCalls = 0;
    donors.refresh = async () => {
      refreshCalls += 1;
    };

    render(createElement(DonorsPage));

    const refreshButton = screen.getByRole('button', { name: '更新' });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      assert.equal(refreshCalls, 1);
    });
  });
});
