const toggleBtn = document.getElementById('toggleBtn');
const statusEl = document.getElementById('status');
const toggleLabel = document.getElementById('toggleLabel');
const popupTitle = document.getElementById('popupTitle');
const popupDesc = document.getElementById('popupDesc');

const SITE_INFO = {
  chatgpt: {
    match: url => url.includes('chatgpt.com'),
    title: 'ChatGPT Chat Organizer',
    desc: 'Select multiple chats in ChatGPT and move them into a Project with one clean workflow.',
  },
  claude: {
    match: url => url.includes('claude.ai'),
    title: 'Claude Chat Organizer',
    desc: 'Select multiple chats in Claude and move them into a Project with one clean workflow.',
  },
};

function setStatus(text, type = '') {
  statusEl.textContent = text;
  statusEl.className = type;
}

function setToggleUI(isOn) {
  toggleBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  toggleLabel.textContent = isOn ? 'On' : 'Off';
}

function detectSite(url) {
  if (!url) return null;
  for (const [key, info] of Object.entries(SITE_INFO)) {
    if (info.match(url)) return key;
  }
  return null;
}

function enabledKeyForSite(site) {
  return `bcm3-enabled:${site}`;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return null;
  const site = detectSite(tab.url);
  if (!site) return null;
  return { tab, site };
}

async function readStoredEnabled(site) {
  const key = enabledKeyForSite(site);
  const data = await chrome.storage.local.get(key);
  return Boolean(data[key]);
}

async function getInjectedState(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const state = window._bcmGetState ? window._bcmGetState() : null;
      return state || {
        enabled: false,
        panelOpen: !!document.getElementById('bcm3-panel'),
        hasPendingQueue: false
      };
    }
  });
  return result && result.result ? result.result : null;
}

async function initToggleState() {
  try {
    const active = await getActiveTab();
    if (!active) {
      setToggleUI(false);
      setStatus('Open chatgpt.com or claude.ai to use the toggle.', 'error');
      return;
    }

    const { tab, site } = active;
    const info = SITE_INFO[site];
    popupTitle.textContent = info.title;
    popupDesc.textContent = info.desc;

    const storedEnabled = await readStoredEnabled(site);
    let injectedState = null;
    try {
      injectedState = await getInjectedState(tab.id);
    } catch (_) {}

    const isOn = injectedState ? Boolean(injectedState.enabled) : storedEnabled;
    setToggleUI(isOn);

    if (injectedState && injectedState.hasPendingQueue && !isOn) {
      setStatus('Off. A queued task is still resuming in this tab.');
    } else {
      setStatus(isOn ? 'Panel is currently enabled.' : 'Panel is currently disabled.');
    }
  } catch (err) {
    setStatus('Could not read extension state.', 'error');
  }
}

toggleBtn.addEventListener('click', async () => {
  toggleBtn.disabled = true;
  setStatus('Updating current tab...');
  try {
    const active = await getActiveTab();
    if (!active) {
      setStatus('Open chatgpt.com or claude.ai and try again.', 'error');
      return;
    }

    const { tab } = active;
    const current = await getInjectedState(tab.id);
    const nextEnabled = !(current && current.enabled);

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (enabled) => {
        if (window._bcmSetEnabled) {
          await window._bcmSetEnabled(enabled);
          return window._bcmGetState ? window._bcmGetState() : { enabled };
        }
        return { enabled: false };
      },
      args: [nextEnabled]
    });

    const state = result && result.result ? result.result : { enabled: nextEnabled };
    setToggleUI(Boolean(state.enabled));
    setStatus(state.enabled ? 'Extension turned on.' : 'Extension turned off.', 'ok');
  } catch (err) {
    setStatus('Could not toggle extension. Retry.', 'error');
  } finally {
    toggleBtn.disabled = false;
  }
});

initToggleState();
