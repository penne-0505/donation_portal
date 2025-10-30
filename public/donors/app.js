const SESSION_COOKIE_NAME = 'sess';
const DONORS_ERROR_MESSAGE = 'Donors 情報の取得に失敗しました。時間をおいて再度お試しください。';
const CONSENT_ERROR_MESSAGE = '掲示の撤回に失敗しました。時間をおいて再試行してください。';
const UNAUTHORIZED_MESSAGE = 'セッションが無効になりました。Discord で再ログインしてください。';

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

  const displayName = typeof session.display_name === 'string' ? session.display_name.trim() : '';
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

function collectElements(doc) {
  return {
    body: doc.body,
    donorsStatus: doc.getElementById('donors-status'),
    donorsError: doc.getElementById('donors-error'),
    donorsCount: doc.getElementById('donor-count'),
    donorsList: doc.getElementById('donors-list'),
    reloadButton: doc.getElementById('donors-reload'),
    consentLogin: doc.getElementById('consent-login'),
    consentRevoke: doc.getElementById('consent-revoke'),
    consentStatus: doc.getElementById('consent-status'),
    consentError: doc.getElementById('consent-error'),
    consentNote: doc.getElementById('consent-note'),
  };
}

function setText(element, text) {
  if (!element) {
    return;
  }
  element.textContent = text;
}

function setError(element, message) {
  if (!element) {
    return;
  }

  if (!message) {
    element.textContent = '';
    element.hidden = true;
    return;
  }

  element.textContent = message;
  element.hidden = false;
}

function setVisibility(element, visible) {
  if (!element) {
    return;
  }
  element.hidden = !visible;
}

function renderDonorList(doc, listElement, donors) {
  if (!listElement) {
    return;
  }

  while (listElement.firstChild) {
    listElement.removeChild(listElement.firstChild);
  }

  for (const name of donors) {
    const item = doc.createElement('li');
    item.textContent = name;
    item.dataset.displayName = name;
    listElement.appendChild(item);
  }
}

function removeDonorFromList(listElement, displayName) {
  if (!listElement || !displayName) {
    return false;
  }

  const children = Array.from(listElement.children ?? []);
  for (const child of children) {
    if (child.dataset && child.dataset.displayName === displayName) {
      listElement.removeChild(child);
      return true;
    }
  }

  return false;
}

let latestDonorFetchPromise = null;

function loadDonors(doc, elements) {
  const { donorsStatus, donorsError, donorsCount, donorsList } = elements;
  const promise = (async () => {
    setText(donorsStatus, 'Donors 情報を読み込み中です…');
    setError(donorsError, '');
    try {
      const response = await fetch('/api/donors');
      if (!response.ok) {
        throw new Error(`unexpected status: ${response.status}`);
      }
      const payload = (await response.json()) ?? {};
      const donors = Array.isArray(payload.donors)
        ? payload.donors.filter((value) => typeof value === 'string')
        : [];
      const count = typeof payload.count === 'number' ? payload.count : donors.length;

      renderDonorList(doc, donorsList, donors);
      setText(donorsStatus, donors.length === 0 ? '現在表示中の Donor はいません。' : 'Donors 情報を更新しました。');
      setText(donorsCount, String(count));
    } catch (error) {
      console.error('[donors-page] failed to load donors', error);
      setError(donorsError, DONORS_ERROR_MESSAGE);
      setText(donorsStatus, '最新の Donors 情報を取得できませんでした。');
    }
  })();

  latestDonorFetchPromise = promise;
  return promise;
}

function applySessionState(doc, elements, state) {
  const { body, consentLogin, consentRevoke, consentStatus } = elements;

  if (body && body.dataset) {
    body.dataset.consentState = state.status;
  }

  if (state.status === 'signed-out') {
    setVisibility(consentLogin, true);
    setVisibility(consentRevoke, false);
    setText(consentStatus, 'Discord ログイン後に Donors 掲載の同意を管理できます。');
    return;
  }

  if (state.status === 'error') {
    setVisibility(consentLogin, true);
    setVisibility(consentRevoke, false);
    setText(consentStatus, UNAUTHORIZED_MESSAGE);
    return;
  }

  setVisibility(consentLogin, false);
  if (state.session.consentPublic) {
    setVisibility(consentRevoke, true);
    setText(consentStatus, `${state.session.displayName} さんは Donors 掲載に同意しています。`);
  } else {
    setVisibility(consentRevoke, false);
    setText(consentStatus, '現在 Donors 掲載はオフになっています。寄附ページで同意を変更できます。');
  }
}

function initializeDonorsPage(doc = document) {
  if (!doc) {
    return;
  }

  const elements = collectElements(doc);
  const sessionState = resolveSession(doc);
  applySessionState(doc, elements, sessionState);

  loadDonors(doc, elements).catch((error) => {
    console.error('[donors-page] unexpected load error', error);
  });

  if (elements.reloadButton) {
    elements.reloadButton.addEventListener('click', async (event) => {
      event.preventDefault?.();
      await loadDonors(doc, elements);
    });
  }

  if (elements.consentRevoke) {
    elements.consentRevoke.addEventListener('click', async (event) => {
      event.preventDefault?.();
      if (sessionState.status !== 'signed-in') {
        setError(elements.consentError, UNAUTHORIZED_MESSAGE);
        return;
      }

      setError(elements.consentError, '');
      setText(elements.consentStatus, '掲示を撤回しています…');
      elements.consentRevoke.disabled = true;
      try {
        const response = await fetch('/api/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consent_public: false }),
        });
        if (response.status === 401) {
          setError(elements.consentError, UNAUTHORIZED_MESSAGE);
          setText(elements.consentStatus, '');
          return;
        }
        if (response.status === 404) {
          setError(elements.consentError, '寄附者情報が見つかりませんでした。Stripe での連携状況をご確認ください。');
          setText(elements.consentStatus, '');
          return;
        }
        if (!response.ok && response.status !== 204) {
          throw new Error(`unexpected status: ${response.status}`);
        }

        const removed = removeDonorFromList(
          elements.donorsList,
          sessionState.session.displayName,
        );
        if (removed && elements.donorsList) {
          const childNodes = elements.donorsList.children;
          const nextCount = childNodes && typeof childNodes.length === 'number'
            ? childNodes.length
            : 0;
          setText(elements.donorsCount, String(nextCount));
        }
        sessionState.session.consentPublic = false;
        applySessionState(doc, elements, sessionState);
        setText(elements.consentStatus, 'Donors 掲示を撤回しました。反映まで最大 60 秒かかる場合があります。');
        setText(elements.donorsStatus, '掲示を撤回しました。最新の情報はしばらく後にご確認ください。');
      } catch (error) {
        console.error('[donors-page] failed to revoke consent', error);
        setError(elements.consentError, CONSENT_ERROR_MESSAGE);
        setText(elements.consentStatus, '');
      } finally {
        elements.consentRevoke.disabled = false;
      }
    });
  }
}

if (typeof window !== 'undefined' && window.document) {
  initializeDonorsPage(window.document);
}

export { initializeDonorsPage };

export const __test__ = {
  parseSessionCookieValue,
  getLatestDonorFetchPromise: () => latestDonorFetchPromise,
};
