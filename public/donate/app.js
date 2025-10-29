const SESSION_COOKIE_NAME = 'sess';
const AUTH_ERROR_MESSAGE = 'セッション情報を読み取れませんでした。お手数ですが、再度 Discord ログインをお試しください。';

function base64UrlDecode(segment) {
  let base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const remainder = base64.length % 4;
  if (remainder > 0) {
    base64 += '='.repeat(4 - remainder);
  }

  if (typeof atob === 'function') {
    const binary = atob(base64);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let index = 0; index < length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    if (typeof TextDecoder === 'function') {
      return new TextDecoder().decode(bytes);
    }
    let result = '';
    for (const byte of bytes) {
      result += String.fromCharCode(byte);
    }
    return result;
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  throw new Error('Base64 decode is not supported in this environment');
}

function parseSessionCookieValue(cookieValue) {
  if (typeof cookieValue !== 'string' || cookieValue.length === 0) {
    return { type: 'missing' };
  }

  const [encodedPayload] = cookieValue.split('.');
  if (!encodedPayload) {
    return { type: 'invalid' };
  }

  let payloadText;
  try {
    payloadText = base64UrlDecode(encodedPayload);
  } catch (_error) {
    return { type: 'invalid' };
  }

  let payload;
  try {
    payload = JSON.parse(payloadText);
  } catch (_error) {
    return { type: 'invalid' };
  }

  if (!payload || typeof payload !== 'object') {
    return { type: 'invalid' };
  }

  if (payload.name !== SESSION_COOKIE_NAME || typeof payload.value !== 'string') {
    return { type: 'invalid' };
  }

  let session;
  try {
    session = JSON.parse(payload.value);
  } catch (_error) {
    return { type: 'invalid' };
  }

  if (!session || typeof session !== 'object') {
    return { type: 'invalid' };
  }

  const displayName = typeof session.display_name === 'string'
    ? session.display_name.trim()
    : '';
  const consentPublic = session.consent_public === true;

  return {
    type: 'valid',
    session: {
      displayName,
      consentPublic,
    },
  };
}

function getCookieValue(doc, name) {
  if (!doc || typeof doc.cookie !== 'string' || doc.cookie.length === 0) {
    return null;
  }

  const segments = doc.cookie.split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (trimmed.startsWith(`${name}=`)) {
      const rawValue = trimmed.slice(name.length + 1);
      try {
        return decodeURIComponent(rawValue);
      } catch (_error) {
        return rawValue;
      }
    }
  }
  return null;
}

function resolveSession(doc) {
  const cookieValue = getCookieValue(doc, SESSION_COOKIE_NAME);
  if (!cookieValue) {
    return { status: 'signed-out' };
  }

  const parsed = parseSessionCookieValue(cookieValue);
  if (parsed.type !== 'valid') {
    return { status: 'error' };
  }

  return { status: 'signed-in', session: parsed.session };
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
  };
}

export function initializeDonatePage(doc = document) {
  if (!doc || typeof doc.getElementById !== 'function') {
    return;
  }

  const elements = collectElements(doc);
  const state = resolveSession(doc);

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
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeDonatePage(document);
    });
  } else {
    initializeDonatePage(document);
  }
}

export const __test__ = {
  base64UrlDecode,
  parseSessionCookieValue,
  resolveSession,
};
