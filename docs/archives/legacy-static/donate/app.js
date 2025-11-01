const SESSION_ENDPOINT = '/api/session';
const AUTH_ERROR_MESSAGE = 'セッション情報を読み取れませんでした。お手数ですが、再度 Discord ログインをお試しください。';
const CHECKOUT_ERROR_MESSAGE = 'Stripe Checkout の開始に失敗しました。時間をおいて再試行してください。';

async function fetchSessionState() {
  if (typeof fetch !== 'function') {
    return { status: 'error' };
  }

  try {
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      return { status: 'error' };
    }

    let payload;
    try {
      payload = await response.json();
    } catch (_error) {
      return { status: 'error' };
    }

    if (!payload || typeof payload !== 'object') {
      return { status: 'error' };
    }

    if (payload.status === 'signed-in' && payload.session && typeof payload.session === 'object') {
      const displayNameRaw = typeof payload.session.displayName === 'string'
        ? payload.session.displayName
        : '';
      const displayName = displayNameRaw.trim();
      const consentPublic = payload.session.consentPublic === true;
      return {
        status: 'signed-in',
        session: {
          displayName,
          consentPublic,
        },
      };
    }

    if (payload.status === 'signed-out') {
      return { status: 'signed-out' };
    }

    return { status: 'error' };
  } catch (_error) {
    return { status: 'error' };
  }
}

function setVisibility(element, visible) {
  if (!element) {
    return;
  }
  element.hidden = !visible;
}

function setCheckboxState(checkbox, { disabled, checked }) {
  if (!checkbox) {
    return;
  }

  checkbox.disabled = disabled;
  checkbox.checked = checked;
  checkbox.setAttribute('aria-checked', checked ? 'true' : 'false');
  if (disabled) {
    checkbox.setAttribute('aria-disabled', 'true');
  } else {
    checkbox.removeAttribute('aria-disabled');
  }
}

function updateStatus(statusElement, text) {
  if (!statusElement) {
    return;
  }
  statusElement.textContent = text;
}

function setErrorMessage(errorElement, message) {
  if (!errorElement) {
    return;
  }

  if (!message) {
    errorElement.textContent = '';
    errorElement.hidden = true;
    return;
  }

  errorElement.textContent = message;
  errorElement.hidden = false;
}

function setAuthState(bodyElement, state) {
  if (!bodyElement || !bodyElement.dataset) {
    return;
  }
  bodyElement.dataset.authState = state;
}

function collectElements(doc) {
  return {
    loginButton: doc.getElementById('auth-login'),
    logoutLink: doc.getElementById('auth-logout'),
    statusField: doc.getElementById('auth-status'),
    errorField: doc.getElementById('auth-error'),
    consentCheckbox: doc.getElementById('consent-public'),
    checkoutOnceButton: doc.getElementById('donate-onetime'),
    checkoutMonthlyButton: doc.getElementById('donate-monthly'),
    checkoutYearlyButton: doc.getElementById('donate-yearly'),
    checkoutError: doc.getElementById('checkout-error'),
    checkoutLoading: doc.getElementById('checkout-loading'),
  };
}

function setCheckoutButtonsDisabled(elements, disabled) {
  const buttons = [
    elements.checkoutOnceButton,
    elements.checkoutMonthlyButton,
    elements.checkoutYearlyButton,
  ];

  for (const button of buttons) {
    if (!button) {
      continue;
    }
    button.disabled = disabled;
    if (disabled) {
      button.setAttribute?.('aria-disabled', 'true');
    } else {
      button.removeAttribute?.('aria-disabled');
    }
  }
}

function setCheckoutLoading(element, visible) {
  if (!element) {
    return;
  }
  element.hidden = !visible;
}

function getCheckoutTarget(button) {
  if (!button || !button.dataset) {
    return null;
  }

  const mode = button.dataset.mode;
  const variant = button.dataset.variant;
  if (typeof mode !== 'string' || typeof variant !== 'string') {
    return null;
  }

  const intervalRaw = button.dataset.interval ?? '';
  const interval = intervalRaw === '' ? null : intervalRaw;

  return { mode, variant, interval };
}

function getGlobalLocation() {
  if (typeof window !== 'undefined' && window.location) {
    return window.location;
  }
  if (typeof globalThis !== 'undefined' && globalThis.location) {
    return globalThis.location;
  }
  return null;
}

async function startCheckout(button, elements) {
  const target = getCheckoutTarget(button);
  if (!target) {
    setErrorMessage(elements.checkoutError, CHECKOUT_ERROR_MESSAGE);
    return;
  }

  if (typeof fetch !== 'function') {
    setErrorMessage(elements.checkoutError, CHECKOUT_ERROR_MESSAGE);
    return;
  }

  setErrorMessage(elements.checkoutError, null);
  setCheckoutLoading(elements.checkoutLoading, true);
  setCheckoutButtonsDisabled(elements, true);

  try {
    const response = await fetch('/api/checkout/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        mode: target.mode,
        variant: target.variant,
        interval: target.interval,
      }),
    });

    if (!response.ok) {
      let message = CHECKOUT_ERROR_MESSAGE;
      try {
        const body = await response.json();
        if (body && typeof body === 'object' && body.error && typeof body.error.message === 'string') {
          message = body.error.message;
        }
      } catch (_error) {
        // ignore json parse errors
      }
      setErrorMessage(elements.checkoutError, message);
      return;
    }

    let payload;
    try {
      payload = await response.json();
    } catch (_error) {
      setErrorMessage(elements.checkoutError, CHECKOUT_ERROR_MESSAGE);
      return;
    }

    if (!payload || typeof payload.url !== 'string' || payload.url.length === 0) {
      setErrorMessage(elements.checkoutError, CHECKOUT_ERROR_MESSAGE);
      return;
    }

    const locationTarget = getGlobalLocation();
    if (locationTarget && typeof locationTarget.assign === 'function') {
      locationTarget.assign(payload.url);
    } else if (locationTarget && typeof locationTarget === 'object') {
      locationTarget.href = payload.url;
    } else {
      setErrorMessage(elements.checkoutError, `Checkout URL: ${payload.url}`);
    }
  } catch (_error) {
    setErrorMessage(elements.checkoutError, CHECKOUT_ERROR_MESSAGE);
  } finally {
    setCheckoutLoading(elements.checkoutLoading, false);
    setCheckoutButtonsDisabled(elements, false);
  }
}

function attachCheckoutHandlers(doc, elements) {
  const buttons = [
    elements.checkoutOnceButton,
    elements.checkoutMonthlyButton,
    elements.checkoutYearlyButton,
  ];

  for (const button of buttons) {
    if (!button || typeof button.addEventListener !== 'function') {
      continue;
    }

    if (button.dataset && button.dataset.checkoutBound === 'true') {
      continue;
    }

    if (button.dataset) {
      button.dataset.checkoutBound = 'true';
    }

    button.addEventListener('click', (event) => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (button.disabled) {
        return;
      }
      return startCheckout(button, elements);
    });
  }
}

function updateCheckoutAvailability(elements, enabled) {
  setCheckoutButtonsDisabled(elements, !enabled);
  if (!enabled) {
    setCheckoutLoading(elements.checkoutLoading, false);
    setErrorMessage(elements.checkoutError, null);
  }
}

function applySessionState(doc, elements, state) {
  switch (state.status) {
    case 'signed-in': {
      const displayName = state.session.displayName.length > 0
        ? state.session.displayName
        : 'Discord アカウント';
      setVisibility(elements.loginButton, false);
      setVisibility(elements.logoutLink, true);
      updateStatus(elements.statusField, `${displayName} としてログインしています。`);
      setCheckboxState(elements.consentCheckbox, {
        disabled: false,
        checked: state.session.consentPublic,
      });
      setErrorMessage(elements.errorField, null);
      setAuthState(doc.body, 'signed-in');
      updateCheckoutAvailability(elements, true);
      break;
    }
    case 'error': {
      setVisibility(elements.loginButton, true);
      setVisibility(elements.logoutLink, false);
      updateStatus(elements.statusField, 'Discord へのログインが必要です。');
      setCheckboxState(elements.consentCheckbox, {
        disabled: true,
        checked: false,
      });
      setErrorMessage(elements.errorField, AUTH_ERROR_MESSAGE);
      setAuthState(doc.body, 'error');
      updateCheckoutAvailability(elements, false);
      break;
    }
    default: {
      setVisibility(elements.loginButton, true);
      setVisibility(elements.logoutLink, false);
      updateStatus(elements.statusField, 'Discord へのログインが必要です。');
      setCheckboxState(elements.consentCheckbox, {
        disabled: true,
        checked: false,
      });
      setErrorMessage(elements.errorField, null);
      setAuthState(doc.body, 'signed-out');
      updateCheckoutAvailability(elements, false);
    }
  }
}

async function resolveAndApplySession(doc, elements) {
  const state = await fetchSessionState();
  applySessionState(doc, elements, state);
}

export async function initializeDonatePage(doc = document) {
  if (!doc || typeof doc.getElementById !== 'function') {
    return;
  }

  const elements = collectElements(doc);
  attachCheckoutHandlers(doc, elements);
  applySessionState(doc, elements, { status: 'signed-out' });
  await resolveAndApplySession(doc, elements);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void initializeDonatePage(document);
    });
  } else {
    void initializeDonatePage(document);
  }
}

export const __test__ = {
  fetchSessionState,
  getCheckoutTarget,
};
