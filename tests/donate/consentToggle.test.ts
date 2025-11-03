import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement, useState } from 'react';
import { ConsentToggle } from '@/components/consent-toggle';

describe('ConsentToggle', () => {
  beforeEach(() => {
    // no-op
  });

  afterEach(() => {
    cleanup();
  });

  it('aria-checked 属性が受け取った checked 値を反映する', () => {
    render(
      createElement(ConsentToggle, {
        checked: true,
        onCheckedChange: () => undefined,
        'aria-label': '掲示同意',
      }),
    );

    const toggle = screen.getByRole('switch', { name: '掲示同意' });
    assert.equal(toggle.getAttribute('aria-checked'), 'true');
  });

  it('クリックで onCheckedChange を呼び出す', () => {
    const calls: boolean[] = [];
    render(
      createElement(ConsentToggle, {
        checked: false,
        onCheckedChange: (value: boolean) => {
          calls.push(value);
        },
        'aria-label': '掲示同意',
      }),
    );

    const toggle = screen.getByRole('switch', { name: '掲示同意' });
    fireEvent.click(toggle);

    assert.deepEqual(calls, [true]);
  });

  it('制御コンポーネントとして aria-checked が更新される', async () => {
    function ControlledToggle() {
      const [value, setValue] = useState(false);
      return createElement(ConsentToggle, {
        checked: value,
        onCheckedChange: setValue,
        'aria-label': '掲示同意',
      });
    }

    render(createElement(ControlledToggle));

    const toggle = screen.getByRole('switch', { name: '掲示同意' }) as HTMLButtonElement;
    assert.equal(toggle.getAttribute('aria-checked'), 'false');

    fireEvent.click(toggle);

    await screen.findByRole('switch', { name: '掲示同意', checked: true });
    assert.equal(toggle.getAttribute('aria-checked'), 'true');
  });

  it('disabled=true の場合は onCheckedChange を呼び出さない', () => {
    let toggled = false;
    render(
      createElement(ConsentToggle, {
        checked: false,
        disabled: true,
        onCheckedChange: () => {
          toggled = true;
        },
        'aria-label': '掲示同意',
      }),
    );

    const toggle = screen.getByRole('switch', { name: '掲示同意' });
    fireEvent.click(toggle);

    assert.equal(toggled, false);
    assert.equal(toggle.getAttribute('aria-checked'), 'false');
  });
});
