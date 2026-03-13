
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

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return null;
  const site = detectSite(tab.url);
  if (!site) return null;
  return { tab, site };
}

async function readCurrentPanelState(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      // Safely check if the panel is currently active in the DOM
      return window._bcmIsActive ? window._bcmIsActive() : false;
    }
  });
  return Boolean(result && result.result);
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
    // Update popup branding to match the active site
    const info = SITE_INFO[site];
    popupTitle.textContent = info.title;
    popupDesc.textContent = info.desc;

    const isOn = await readCurrentPanelState(tab.id);
    setToggleUI(isOn);
    setStatus(isOn ? 'Panel is currently on.' : 'Panel is currently off.');
  } catch (err) {
    setStatus('Could not read panel state.', 'error');
  }
}

toggleBtn.addEventListener('click', async () => {
  toggleBtn.disabled = true;
  setStatus('Checking current tab...');
  try {
    const active = await getActiveTab();
    if (!active) {
      setStatus('Open chatgpt.com or claude.ai and try again.', 'error');
      return;
    }
    const { tab } = active;
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window._bcmIsActive && window._bcmIsActive()) {
          window._bcmTeardown && window._bcmTeardown();
          return false; // Panel is now off
        } else {
          window._bcmInit && window._bcmInit();
          return true; // Panel is now on
        }
      }
    });
    const isOn = Boolean(result && result.result);
    setToggleUI(isOn);
    setStatus(isOn ? 'Panel turned on.' : 'Panel turned off.', 'ok');
  } catch (err) {
    setStatus('Could not toggle panel. Retry.', 'error');
  } finally {
    toggleBtn.disabled = false;
  }
});

initToggleState();
