const SESSION_ENDPOINT = '/api/session';
const DONORS_ERROR_MESSAGE = 'Donors 情報の取得に失敗しました。時間をおいて再度お試しください。';
const CONSENT_ERROR_MESSAGE = '掲示の撤回に失敗しました。時間をおいて再試行してください。';
const UNAUTHORIZED_MESSAGE = 'セッションが無効になりました。Discord で再ログインしてください。';

async function fetchSessionState() {
  if (typeof fetch !== 'function') {
    return { status: 'error' };
  }

  try {
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
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
  if (!listElement || !doc) {
    return;
  }

  while (listElement.firstChild) {
    listElement.removeChild(listElement.firstChild);
  }

  const safeDonors = Array.isArray(donors) ? donors : [];
  if (safeDonors.length === 0) {
    const emptyState = doc.createElement('li');
    emptyState.className = 'donor-empty';
    emptyState.textContent = '掲示に同意している Donor はまだいません。';
    emptyState.dataset.state = 'empty';
    listElement.appendChild(emptyState);
    return;
  }

  for (const name of safeDonors) {
    const item = doc.createElement('li');
    item.className = 'donor-card';
    item.dataset.displayName = name;

    const displayName = doc.createElement('span');
    displayName.className = 'donor-card__name';
    displayName.textContent = name;

    const meta = doc.createElement('span');
    meta.className = 'donor-card__meta';
    meta.textContent = '掲示に同意しています';

    item.appendChild(displayName);
    item.appendChild(meta);
    listElement.appendChild(item);
  }
}

function removeDonorFromList(doc, listElement, displayName) {
  if (!doc || !listElement || !displayName) {
    return false;
  }

  const children = Array.from(listElement.children ?? []);
  let removed = false;
  for (const child of children) {
    if (child.dataset && child.dataset.displayName === displayName) {
      listElement.removeChild(child);
      removed = true;
    }
  }

  if (!removed) {
    return false;
  }

  const remainingDonors = Array.from(listElement.children ?? []).filter((child) => {
    return Boolean(child.dataset && child.dataset.displayName);
  });

  if (remainingDonors.length === 0) {
    while (listElement.firstChild) {
      listElement.removeChild(listElement.firstChild);
    }
    const emptyState = doc.createElement('li');
    emptyState.className = 'donor-empty';
    emptyState.textContent = '掲示に同意している Donor はまだいません。';
    emptyState.dataset.state = 'empty';
    listElement.appendChild(emptyState);
  }

  return true;
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

export async function initializeDonorsPage(doc = document) {
  if (!doc) {
    return;
  }

  const elements = collectElements(doc);
  let sessionState = { status: 'signed-out' };

  function setSessionState(nextState) {
    sessionState = nextState;
    applySessionState(doc, elements, sessionState);
  }

  setSessionState(sessionState);

  try {
    const resolved = await fetchSessionState();
    setSessionState(resolved);
  } catch (_error) {
    setSessionState({ status: 'error' });
  }

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
          doc,
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
        setSessionState({
          status: 'signed-in',
          session: {
            displayName: sessionState.session.displayName,
            consentPublic: false,
          },
        });
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
  void initializeDonorsPage(window.document);
}

export const __test__ = {
  fetchSessionState,
  getLatestDonorFetchPromise: () => latestDonorFetchPromise,
};
