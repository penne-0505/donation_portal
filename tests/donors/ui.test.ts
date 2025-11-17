import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import {
  createDonorDirectoryMock,
  resetUIHookMocks,
  setDonorDirectoryHookMock,
} from '../mocks/ui-hooks';

const { DonorsPage } = await import('@/components/pages/donors-page');

describe('DonorsPage React UI', () => {
  beforeEach(() => {
    resetUIHookMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('未ログイン時はログイン導線を表示し、支援者一覧を読み込む', () => {
    const directory = createDonorDirectoryMock();
    directory.isSignedIn = false;
    directory.donors = ['Alice', 'Bob'];
    directory.total = 2;
    let loginCalls = 0;
    directory.login = () => {
      loginCalls += 1;
    };
    setDonorDirectoryHookMock(directory);

    render(createElement(DonorsPage));

    const loginButton = screen.getByRole('button', { name: /Discord でログイン/ });
    fireEvent.click(loginButton);
    assert.equal(loginCalls, 1);

    assert.ok(screen.getByText('Alice'));
    assert.ok(screen.getByText('Bob'));
    assert.equal(screen.queryByRole('button', { name: /掲示を撤回する/ }), null);
  });

  it('支援者 API がエラーの場合はメッセージを表示する', () => {
    const directory = createDonorDirectoryMock();
    directory.donorError = '支援者情報の取得に失敗しました。';
    setDonorDirectoryHookMock(directory);

    render(createElement(DonorsPage));

    assert.ok(screen.getByText('支援者情報の取得に失敗しました。'));
  });

  it('掲示撤回ボタンでフックの revokeConsent を呼び出す', async () => {
    const directory = createDonorDirectoryMock();
    directory.isSignedIn = true;
    directory.consentPublic = true;
    directory.donors = ['Alice', 'Bob'];
    directory.total = 2;
    let revokeCalls = 0;
    directory.revokeConsent = async () => {
      revokeCalls += 1;
    };
    setDonorDirectoryHookMock(directory);

    render(createElement(DonorsPage));

    const revokeButton = await screen.findByRole('button', { name: /掲示を撤回する/ });
    fireEvent.click(revokeButton);

    await waitFor(() => {
      assert.equal(revokeCalls, 1);
    });
  });

  it('更新ボタンで支援者情報を再取得する', async () => {
    const directory = createDonorDirectoryMock();
    directory.donors = ['Alice'];
    directory.total = 1;
    let refreshCalls = 0;
    directory.refreshDonors = async () => {
      refreshCalls += 1;
    };
    setDonorDirectoryHookMock(directory);

    render(createElement(DonorsPage));

    const refreshButton = screen.getByRole('button', { name: '更新' });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      assert.equal(refreshCalls, 1);
    });
  });
});
