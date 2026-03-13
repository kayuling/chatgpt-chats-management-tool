(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Site detection — returns config for ChatGPT or Claude.ai
  // ---------------------------------------------------------------------------
  function getSiteConfig() {
    var host = window.location.hostname;
    if (host.indexOf('claude.ai') !== -1) {
      return {
        site: 'claude',
        chatLinkSelector: 'nav a[href*="/chat/"]',
        chatHrefPattern: /\/chat\/([^?#/]+)/,
        projectLinkSelector: 'a[href*="/project/"]',
        projectHrefPattern: /\/project\/([^?#/]+)/,
        moveMenuItemTexts: ['add to project', 'change project'],
        deleteMenuItemText: 'delete',
        panelTitle: 'Claude Chat Organizer',
        panelSubtitle: 'Move selected chats into a project in one pass.'
      };
    }
    return {
      site: 'chatgpt',
      chatLinkSelector: 'nav a[href^="/c/"]',
      chatHrefPattern: /\/c\/([^?#/]+)/,
      projectLinkSelector: 'a[href*="/g/g-p-"]',
      projectHrefPattern: /\/g\/(g-p-[^/?#]+)/,
      moveMenuItemTexts: ['move to project'],
      deleteMenuItemText: 'delete',
      panelTitle: 'ChatGPT Chat Organizer',
      panelSubtitle: 'Move selected chats into a project in one pass.'
    };
  }
  var SITE = getSiteConfig();

  // ---------------------------------------------------------------------------
  function fetchAllProjects() {
    var projects = [];
    // Claude.ai: read project links directly from the sidebar DOM
    if (SITE.site === 'claude') {
      var domLinks = Array.from(document.querySelectorAll(SITE.projectLinkSelector));
      domLinks.forEach(function(a) {
        var m = a.href.match(SITE.projectHrefPattern);
        if (!m) return;
        var id = m[1];
        var name = a.textContent.trim();
        if (name && id && !projects.find(function(x) { return x.id === id; }))
          projects.push({ id: id, name: name });
      });
      return projects;
    }
    // ChatGPT: read from localStorage + DOM links
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || !key.endsWith('snorlax-history')) continue;
        var data = JSON.parse(localStorage.getItem(key));
        var pages = (data && data.value && data.value.pages) || [];
        for (var p = 0; p < pages.length; p++) {
          var items = pages[p].items || [];
          for (var j = 0; j < items.length; j++) {
            var g = items[j] && items[j].gizmo && items[j].gizmo.gizmo;
            if (!g || !g.id || g.id.indexOf('g-p-') !== 0) continue;
            var id = g.short_url || g.id;
            var name = (g.display && g.display.name) || g.name || id;
            if (!projects.find(function(x) { return x.id === id; }))
              projects.push({ id: id, name: name });
          }
        }
      }
    } catch (e) {}
    var domLinks = Array.from(document.querySelectorAll('a[href*="/g/g-p-"]'));
    domLinks.forEach(function(a) {
      var m = a.href.match(/[/]g[/](g-p-[^/?#]+)/);
      if (!m) return;
      var id = m[1];
      var name = a.textContent.trim();
      if (name && id && !projects.find(function(x) { return x.id === id; }))
        projects.push({ id: id, name: name });
    });
    return projects;
  }
  function injectStyle() {
    if (document.getElementById('bcm3-style')) return;
    var style = document.createElement('style');
    style.id = 'bcm3-style';
    style.textContent = [
      ':root { --bcm3-bg:#0a0a0a; --bcm3-panel:#111111; --bcm3-border:#262626; --bcm3-text:#fafafa; --bcm3-muted:#a3a3a3; --bcm3-focus:#525252; }',
      '.bcm3-wrap { display:flex; align-items:center; gap:4px; padding-left:8px; }',
      '.bcm3-wrap > a { flex:1; min-width:0; }',
      '.bcm3-cb { -webkit-appearance:none; appearance:none; width:14px; height:14px; min-width:14px; margin:0 3px 0 2px; flex-shrink:0; z-index:10; cursor:pointer; border:1px solid #3f3f46; border-radius:4px; background:#111111; display:inline-grid; place-content:center; transition:border-color .14s ease, background-color .14s ease, transform .14s ease; }',
      '.bcm3-cb:hover { border-color:#737373; background:#171717; }',
      '.bcm3-cb:focus-visible { outline:2px solid #525252; outline-offset:1px; }',
      '.bcm3-cb:checked { background:#fafafa; border-color:#fafafa; }',
      '.bcm3-cb:checked::after { content:""; width:7px; height:4px; border:2px solid #111111; border-top:0; border-right:0; transform:rotate(-45deg) translate(1px,-1px); }',
      '#bcm3-panel { position:fixed; right:20px; bottom:20px; width:320px; z-index:999999; color:var(--bcm3-text); font-family:"Geist","SF Pro Text","Segoe UI",sans-serif; font-size:13px; border:1px solid var(--bcm3-border); border-radius:14px; padding:14px; background:radial-gradient(560px 200px at -5% -70%, #1f2937 0%, transparent 58%), radial-gradient(420px 170px at 105% 130%, #1f2937 0%, transparent 60%), color-mix(in srgb, var(--bcm3-panel) 94%, transparent); box-shadow:0 16px 44px rgba(0,0,0,0.45); backdrop-filter:blur(8px); }',
      '#bcm3-head { margin-bottom:10px; }',
      '#bcm3-kicker { display:inline-flex; align-items:center; border:1px solid #343434; border-radius:999px; padding:2px 7px; margin-bottom:7px; color:#d4d4d4; font-size:10px; letter-spacing:.06em; text-transform:uppercase; background:#171717; }',
      '#bcm3-panel h3 { margin:0 0 5px; font-size:15px; font-weight:620; letter-spacing:-.01em; }',
      '#bcm3-sub { margin:0; font-size:12px; color:var(--bcm3-muted); line-height:1.4; }',
      '#bcm3-count { margin:0 0 9px; color:#d4d4d4; font-size:12px; }',
      '#bcm3-panel select { width:100%; appearance:none; background:#171717; color:var(--bcm3-text); border:1px solid #333; border-radius:10px; padding:8px 10px; margin-bottom:8px; font-size:12px; }',
      '#bcm3-panel select:focus-visible, #bcm3-panel button:focus-visible { outline:2px solid var(--bcm3-focus); outline-offset:2px; }',
      '#bcm3-panel button { width:100%; border:1px solid #333; border-radius:10px; cursor:pointer; padding:8px 10px; margin-bottom:6px; font-size:12px; font-weight:600; transition:transform .14s ease, opacity .14s ease, box-shadow .14s ease; display:inline-flex; align-items:center; justify-content:center; gap:7px; }',
      '#bcm3-panel .bcm3-btn-icon { width:14px; height:14px; stroke:currentColor; stroke-width:2; fill:none; flex-shrink:0; }',
      '#bcm3-panel button:hover { transform:translateY(-1px); }',
      '#bcm3-panel button:active { transform:translateY(0); }',
      '#bcm3-move-btn { background:#fafafa; color:#111111; border-color:#fafafa; box-shadow:0 1px 0 rgba(255,255,255,.35) inset; }',
      '#bcm3-delete-btn { background:#2a1111; color:#fca5a5; border-color:#5f2020; }',
      '#bcm3-refresh-btn, #bcm3-selall-btn { background:#171717; color:#f5f5f5; }',
      '#bcm3-close-btn { background:transparent; color:#a3a3a3; }',
      '#bcm3-status { margin-top:8px; font-size:11px; min-height:16px; color:#d4d4d4; word-break:break-word; line-height:1.4; }'
    ].join(' ');
    document.head.appendChild(style);
  }
  function delay(ms) {
    return new Promise(function(r) { setTimeout(r, ms); });
  }
  function fireEvents(el, types) {
    var r = el.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true };
    types.forEach(function(t) {
      el.dispatchEvent(new (t.indexOf('pointer') === 0 ? PointerEvent : MouseEvent)(t, opts));
    });
  }
  function realClick(el) {
    fireEvents(el, ['pointerover','pointerenter','mouseover','mouseenter','pointermove','mousemove','pointerdown','mousedown','pointerup','mouseup','click']);
  }
  function realHover(el) {
    fireEvents(el, ['pointerover','pointerenter','mouseover','mouseenter','pointermove','mousemove']);
  }
  function setStatus(msg) {
    var el = document.getElementById('bcm3-status');
    if (el) el.textContent = msg;
  }
  function updateCount() {
    var all = document.querySelectorAll('.bcm3-cb').length;
    var checked = document.querySelectorAll('.bcm3-cb:checked').length;
    var el = document.getElementById('bcm3-count');
    if (el) el.textContent = checked + ' of ' + all + ' chats selected';
  }
  var BCM3_QUEUE_KEY = 'bcm3-task-queue-v1';
    var BCM3_ENABLED_KEY = 'bcm3-enabled:' + SITE.site;
  var bcm3Bootstrapped = false;

  window._bcmState = window._bcmState || {
    enabled: false
  };

  function readEnabledPref() {
    return new Promise(function(resolve) {
      try {
        if (!chrome || !chrome.storage || !chrome.storage.local) {
          resolve(false);
          return;
        }
        chrome.storage.local.get([BCM3_ENABLED_KEY], function(data) {
          resolve(!!(data && data[BCM3_ENABLED_KEY]));
        });
      } catch (e) {
        resolve(false);
      }
    });
  }

  function writeEnabledPref(value) {
    return new Promise(function(resolve) {
      try {
        if (!chrome || !chrome.storage || !chrome.storage.local) {
          resolve();
          return;
        }
        var payload = {};
        payload[BCM3_ENABLED_KEY] = !!value;
        chrome.storage.local.set(payload, function() { resolve(); });
      } catch (e) {
        resolve();
      }
    });
  }

  function isPanelMounted() {
    return !!document.getElementById('bcm3-panel');
  }

  function getPanelEl() {
    return document.getElementById('bcm3-panel');
  }

  function cleanupPanel() {
    var panel = getPanelEl();
    if (panel) panel.remove();

    lastClickedCheckbox = null;

    var s = document.getElementById('bcm3-style');
    if (s) s.remove();

    if (window._bcmObserver) {
      window._bcmObserver.disconnect();
      window._bcmObserver = null;
    }
    if (window._bcmProjectObserver) {
      window._bcmProjectObserver.disconnect();
      window._bcmProjectObserver = null;
    }

    document.querySelectorAll('.bcm3-wrap').forEach(function(wrap) {
      var link = wrap.querySelector('a');
      if (link && wrap.parentElement) wrap.parentElement.insertBefore(link, wrap);
      wrap.remove();
    });
  }

  async function setEnabledState(enabled) {
    enabled = !!enabled;
    window._bcmState.enabled = enabled;
    await writeEnabledPref(enabled);

    if (enabled) {
      if (!isPanelMounted()) init();
    } else {
      cleanupPanel();
    }

    return window._bcmGetState();
  }

  window._bcmSetEnabled = setEnabledState;
  window._bcmGetState = function() {
    return {
      enabled: !!window._bcmState.enabled,
      panelOpen: !!document.getElementById('bcm3-panel'),
      hasPendingQueue: hasPendingQueue()
    };
  };
  
  function hasPendingQueue() {
    var queue = readMoveQueue();
    return !!(queue && queue.items && queue.items.length && queue.index < queue.items.length);
  }
  var bcm3QueueRunning = false;
  function readMoveQueue() {
    try {
      var raw = sessionStorage.getItem(BCM3_QUEUE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeMoveQueue(queue) {
    try { sessionStorage.setItem(BCM3_QUEUE_KEY, JSON.stringify(queue)); } catch (e) {}
  }
  function clearMoveQueue() {
    try { sessionStorage.removeItem(BCM3_QUEUE_KEY); } catch (e) {}
  }
  function convIdFromHref(href) {
    var m = (href || '').match(SITE.chatHrefPattern);
    return m && m[1] || '';
  }
  function findChatLinkByConvId(convId) {
    if (!convId) return null;
    var links = Array.from(document.querySelectorAll(SITE.chatLinkSelector));
    return links.find(function(a) {
      return convIdFromHref(a.getAttribute('href') || a.href) === convId;
    }) || null;
  }
  function enqueueCurrentSelection(action, projectId, projectName) {
    var items = Array.from(document.querySelectorAll('.bcm3-cb:checked')).map(function(cb) {
      return {
        convId: cb.dataset.convId,
        title: (cb.dataset.title || '').substring(0, 25)
      };
    }).filter(function(x) { return !!x.convId; });
    var queue = {
      site: SITE.site,
      action: action || 'move',
      projectId: projectId,
      projectName: projectName,
      items: items,
      index: 0,
      moved: 0,
      startedAt: Date.now()
    };
    writeMoveQueue(queue);
    return queue;
  }
  function getVisibleMenuItems() {
    return Array.from(document.querySelectorAll('[role="menuitem"]')).filter(function(el) {
      var style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  }
  function isVisibleElement(el) {
    if (!el) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function normalizeText(s) {
    return (s || '').trim().replace(/\\s+/g, ' ').toLowerCase();
  }
  function findMenuButtonForChatLink(link) {
    if (!link) return null;
    var row = link.closest('li') || link.parentElement;
    if (!row) return null;
    // Claude.ai: options button uses aria-label="More options for {title}"
    if (SITE.site === 'claude') {
      return row.querySelector('button[aria-label*="More options"]')
        || row.querySelector('button[aria-label*="options" i]')
        || row.querySelector('button');
    }
    // ChatGPT: Primary: button is inside the <a> tag itself
    var btn = link.querySelector('button.__menu-item-trailing-btn')
      || link.querySelector('button[aria-haspopup="menu"]');
    if (btn) return btn;
    // Fallback: check bcm3-wrap parent (after checkbox injection)
    var wrap = link.closest('.bcm3-wrap');
    if (wrap) {
      btn = wrap.querySelector('button.__menu-item-trailing-btn')
        || wrap.querySelector('button[aria-haspopup="menu"]');
      if (btn) return btn;
    }
    return row.querySelector('button.__menu-item-trailing-btn')
      || row.querySelector('button[aria-haspopup="menu"]')
      || row.querySelector('button[aria-label*="options" i]')
      || row.querySelector('button[aria-label*="menu" i]')
      || row.querySelector('button');
  }
  function dismissOpenMenus() {
    var active = document.activeElement || document.body;
    active.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  }
  function hasVisibleDialog() {
    var dlg = document.querySelector('[role="dialog"], [role="alertdialog"], [data-state="open"]');
    return isVisibleElement(dlg);
  }

  function waitFor(conditionFn, timeoutMs, intervalMs) {
    timeoutMs = timeoutMs || 8000;
    intervalMs = intervalMs || 120;
    return new Promise(function(resolve) {
      var started = Date.now();
      (function check() {
        var result = false;
        try { result = conditionFn(); } catch (e) {}
        if (result) { resolve(result); return; }
        if (Date.now() - started >= timeoutMs) { resolve(null); return; }
        setTimeout(check, intervalMs);
      })();
    });
  }

  function waitForDomIdle(idleMs, timeoutMs) {
    idleMs = idleMs || 500;
    timeoutMs = timeoutMs || 7000;

    return new Promise(function(resolve) {
      var done = false;
      var idleTimer = null;
      var timeoutTimer = null;
      var observer = new MutationObserver(function() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(finish, idleMs);
      });

      function finish() {
        if (done) return;
        done = true;
        clearTimeout(idleTimer);
        clearTimeout(timeoutTimer);
        observer.disconnect();
        resolve(true);
      }

      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      idleTimer = setTimeout(finish, idleMs);
      timeoutTimer = setTimeout(finish, timeoutMs);
    });
  }

  async function waitForMenusClosed() {
    await waitFor(function() {
      return getVisibleMenuItems().length === 0 && !hasVisibleDialog();
    }, 5000, 100);
  }

  async function waitForChatLink(convId, timeoutMs) {
    return await waitFor(function() {
      return findChatLinkByConvId(convId);
    }, timeoutMs || 12000, 150);
  }

  async function waitForMenuToOpen() {
    return await waitFor(function() {
      return getVisibleMenuItems().length > 0 || hasVisibleDialog();
    }, 3000, 100);
  }

  async function openMenuForChat(link) {
    if (!link) return null;

    link.scrollIntoView({ behavior: 'instant', block: 'center' });
    await delay(150);
    realHover(link);
    await delay(150);

    var btn = findMenuButtonForChatLink(link);
    if (!btn) return null;

    realHover(btn);
    await delay(80);
    realClick(btn);

    var opened = await waitForMenuToOpen();
    return opened ? btn : null;
  }

  async function findVisibleMenuItemByText(candidates, timeoutMs) {
    candidates = Array.isArray(candidates) ? candidates : [candidates];
    candidates = candidates.map(function(s) { return normalizeText(s); });

    return await waitFor(function() {
      var mitems = getVisibleMenuItems();
      return mitems.find(function(el) {
        var t = normalizeText(el.textContent);
        return candidates.some(function(c) { return t === c || t.indexOf(c) === 0; });
      }) || null;
    }, timeoutMs || 4000, 120);
  }

  async function findVisibleProjectOption(projectName, timeoutMs) {
    var target = normalizeText(projectName);
    return await waitFor(function() {
      if (SITE.site === 'claude') {
        var opts = Array.from(document.querySelectorAll('[role="option"]')).filter(isVisibleElement);
        return opts.find(function(el) { return normalizeText(el.textContent) === target; }) || null;
      }
      var mitems = getVisibleMenuItems();
      return mitems.find(function(el) { return normalizeText(el.textContent) === target; }) || null;
    }, timeoutMs || 5000, 120);
  }

  async function waitForMoveUiToSettle(convId) {
    await waitForMenusClosed();
    await waitForDomIdle(700, 7000);

    // Best-effort: if the row disappears from the current list, great.
    // If it remains because the site is showing an all-chats view, don't fail on that alone.
    await waitFor(function() {
      return !findChatLinkByConvId(convId) || true;
    }, 1200, 120);

    return true;
  }
  function findDeleteConfirmButton() {
    // Try data-testid first
    var exactConfirm = document.querySelector('button[data-testid="delete-conversation-confirm-button"]');
    if (isVisibleElement(exactConfirm)) return exactConfirm;
    // Search inside dialog/modal containers
    var dialogEl = document.querySelector('[role="dialog"]')
      || document.querySelector('[role="alertdialog"]')
      || document.querySelector('[data-state="open"]');
    if (dialogEl) {
      var dialogBtns = Array.from(dialogEl.querySelectorAll('button')).filter(isVisibleElement);
      var found = dialogBtns.find(function(b) {
        var txt = normalizeText(b.textContent);
        return txt === 'delete' || txt === 'delete chat' || txt === 'delete conversation';
      });
      if (found) return found;
    }
    // Last resort: visible "Delete" button not inside a menu
    var allBtns = Array.from(document.querySelectorAll('button')).filter(isVisibleElement);
    return allBtns.find(function(b) {
      var txt = normalizeText(b.textContent);
      return (txt === 'delete' || txt === 'delete chat' || txt === 'delete conversation')
        && !b.closest('[role="menu"]')
        && b.closest('[role="dialog"], [role="alertdialog"], [class*="modal"], [class*="popover"], [data-state="open"]');
    }) || null;
  }
  // Wait until the sidebar has at least one chat link rendered
  function waitForSidebarReady(timeoutMs) {
    timeoutMs = timeoutMs || 15000;
    return new Promise(function(resolve) {
      var elapsed = 0;
      var interval = 500;
      function check() {
        if (document.querySelectorAll(SITE.chatLinkSelector).length > 0) {
          resolve(true);
          return;
        }
        elapsed += interval;
        if (elapsed >= timeoutMs) { resolve(false); return; }
        setTimeout(check, interval);
      }
      check();
    });
  }
  // Re-select checkboxes for all remaining queued items (those not yet processed)
  function reSelectQueuedItems(queue) {
    if (!queue || !queue.items) return;
    for (var i = queue.index; i < queue.items.length; i++) {
      var convId = queue.items[i].convId;
      var cb = document.querySelector('.bcm3-cb[data-conv-id="' + convId + '"]');
      if (cb) cb.checked = true;
    }
    updateCount();
  }
  async function processMoveQueue() {
    if (bcm3QueueRunning) return;
    var queue = readMoveQueue();
    if (queue.site && queue.site !== SITE.site) {
      clearMoveQueue();
      return;
    }
    if (!queue || !queue.items || !queue.items.length) return;
    if (queue.index >= queue.items.length) { clearMoveQueue(); return; }
    bcm3QueueRunning = true;
    try {
      // Wait for sidebar to be fully rendered before doing anything
      setStatus('Waiting for sidebar...');
      var sidebarReady = await waitForSidebarReady(15000);
      if (!sidebarReady) {
        setStatus('Sidebar not ready. Retrying in 3s...');
        bcm3QueueRunning = false;
        setTimeout(processMoveQueue, 3000);
        return;
      }
      // Re-inject checkboxes and re-select remaining queued items so user can see state
      injectCheckboxes();
      reSelectQueuedItems(queue);
      var total = queue.items.length;
      var action = queue.action || 'move';
      var actionWord = action === 'delete' ? 'Delete' : 'Move';
      setStatus('Resuming ' + actionWord.toLowerCase() + ': ' + (queue.index + 1) + '/' + total);
      // Process ONE item per page load for delete action (reload after each deletion),
      // or all items in one pass for move action.
      var item = queue.items[queue.index];
      var title = item.title || item.convId || '';
      // Find the chat link
      var link = null;
      for (var r = 0; r < 30; r++) {
        link = findChatLinkByConvId(item.convId);
        if (link) break;
        await delay(500);
      }
      if (!link) {
        setStatus('[' + (queue.index + 1) + '/' + total + '] Chat not found: "' + title + '" (skip)');
        queue.index++;
        writeMoveQueue(queue);
        // Reload to continue with next item
        if (action === 'delete' && queue.index < total) {
          await delay(500);
          location.reload();
        }
        return;
      }
      link.scrollIntoView({ behavior: 'instant', block: 'center' });
      await delay(300);
      realHover(link);
      await delay(500);
      var btn = findMenuButtonForChatLink(link);
      if (!btn) {
        setStatus('[' + (queue.index + 1) + '/' + total + '] No menu button: "' + title + '" (skip)');
        queue.index++;
        writeMoveQueue(queue);
        if (action === 'delete' && queue.index < total) {
          await delay(500);
          location.reload();
        }
        return;
      }
      setStatus('[' + (queue.index + 1) + '/' + total + '] ' + actionWord + ' "' + title + '"...');
      if (action === 'move') {
        var movedThisItem = false;

        for (var attempt = 1; attempt <= 3 && !movedThisItem; attempt++) {
          dismissOpenMenus();
          await delay(150);

          link = await waitForChatLink(item.convId, 6000);
          if (!link) break;

          var openedBtn = await openMenuForChat(link);
          if (!openedBtn) {
            setStatus('[' + (queue.index + 1) + '/' + total + '] Could not open menu for "' + title + '" (attempt ' + attempt + '/3)');
            await waitForDomIdle(300, 1500);
            continue;
          }

          var moveItem = await findVisibleMenuItemByText(SITE.moveMenuItemTexts, 4000);
          if (!moveItem) {
            setStatus('[' + (queue.index + 1) + '/' + total + '] "Move to project" option not found (attempt ' + attempt + '/3)');
            dismissOpenMenus();
            await waitForDomIdle(300, 1500);
            continue;
          }

          realHover(moveItem);
          await delay(80);
          realClick(moveItem);

          var projItem = await findVisibleProjectOption(queue.projectName, 5000);
          if (!projItem) {
            setStatus('[' + (queue.index + 1) + '/' + total + '] Project "' + queue.projectName + '" not found (attempt ' + attempt + '/3)');
            dismissOpenMenus();
            await waitForDomIdle(300, 1500);
            continue;
          }

          realHover(projItem);
          await delay(80);
          realClick(projItem);

          await waitForMoveUiToSettle(item.convId);

          movedThisItem = true;
        }

        if (!movedThisItem) {
          setStatus('[' + (queue.index + 1) + '/' + total + '] Move failed after retries: "' + title + '" (skip)');
          dismissOpenMenus();
          await waitForDomIdle(400, 2000);
          queue.index++;
          writeMoveQueue(queue);

          if (queue.index < total) {
            bcm3QueueRunning = false;
            await processMoveQueue();
          } else {
            setStatus('Done with skips. Moved ' + queue.moved + '/' + total + ' to "' + queue.projectName + '"');
            clearMoveQueue();
          }
          return;
        }

        queue.moved++;
        queue.index++;
        writeMoveQueue(queue);

        var liveCb = document.querySelector('.bcm3-cb[data-conv-id="' + item.convId + '"]');
        if (liveCb) liveCb.checked = false;
        updateCount();

        await waitForDomIdle(500, 2500);

        if (queue.index < total) {
          bcm3QueueRunning = false;
          await processMoveQueue();
        } else {
          setStatus('Done! Moved ' + queue.moved + '/' + total + ' to "' + queue.projectName + '"');
          clearMoveQueue();
          setTimeout(function() { injectCheckboxes(); updateCount(); }, 700);
        }
      } else if (action === 'delete') {
        realClick(btn);
        await delay(700);
        var deleteItem = null;
        for (var wd = 0; wd < 25; wd++) {
          var ditems = getVisibleMenuItems();
          deleteItem = ditems.find(function(el) {
            return normalizeText(el.textContent) === 'delete';
          });
          if (deleteItem) break;
          await delay(150);
        }
        if (!deleteItem) {
          setStatus('[' + (queue.index + 1) + '/' + total + '] "Delete" not found in menu (skip)');
          dismissOpenMenus();
          await delay(300);
          queue.index++;
          writeMoveQueue(queue);
          // Reload to try next item
          await delay(500);
          location.reload();
          return;
        }
        realHover(deleteItem);
        await delay(100);
        realClick(deleteItem);
        await delay(800);
        var confirmDelete = null;
        for (var wc = 0; wc < 30; wc++) {
          confirmDelete = findDeleteConfirmButton();
          if (confirmDelete) break;
          await delay(150);
        }
        if (!confirmDelete) {
          setStatus('[' + (queue.index + 1) + '/' + total + '] Confirm button not found (skip)');
          dismissOpenMenus();
          await delay(300);
          queue.index++;
          writeMoveQueue(queue);
          await delay(500);
          location.reload();
          return;
        }
        // Click confirm — advance queue BEFORE reload so index is correct on resume
        queue.moved++;
        queue.index++;
        writeMoveQueue(queue);
        realClick(confirmDelete);
        // Wait briefly for the deletion to register, then reload.
        // On reload, processMoveQueue will auto-resume from the updated index.
        await delay(1200);
        if (queue.index < total) {
          setStatus('Deleted ' + queue.moved + '/' + total + '. Reloading for next...');
          location.reload();
        } else {
          // All done — clear queue and reload one final time to clean up
          setStatus('Done! Deleted ' + queue.moved + '/' + total + ' chats. Reloading...');
          clearMoveQueue();
          await delay(800);
          location.reload();
        }
      }
    } finally {
      bcm3QueueRunning = false;
    }
  }
  var lastClickedCheckbox = null;
  function handleCheckboxClick(e, cb) {
    if (e.shiftKey && lastClickedCheckbox && lastClickedCheckbox !== cb) {
      var boxes = Array.from(document.querySelectorAll('.bcm3-cb'));
      var start = boxes.indexOf(lastClickedCheckbox);
      var end = boxes.indexOf(cb);
      if (start !== -1 && end !== -1) {
        var from = Math.min(start, end);
        var to = Math.max(start, end);
        var shouldCheck = cb.checked;
        for (var i = from; i <= to; i++) boxes[i].checked = shouldCheck;
      }
    }
    lastClickedCheckbox = cb;
    updateCount();
  }
  var lastProjectCount = 0;
  // Claude.ai: fetch projects via the internal REST API.
  // Finds the org UUID from network requests already made by the page
  // (performance API), then calls /api/organizations/{uuid}/projects.
  async function fetchProjectsFromClaudeAPI() {
    try {
      var orgId = null;
      // Method 1: extract org UUID from URLs Claude.ai has already fetched.
      // By the time init() runs (2 s after load), the page has definitely
      // made API calls whose URLs contain the UUID.
      try {
        var entries = performance.getEntriesByType('resource');
        for (var ei = 0; ei < entries.length; ei++) {
          var em = entries[ei].name.match(/\/api\/organizations\/([0-9a-f-]{36})/i);
          if (em) { orgId = em[1]; break; }
        }
      } catch(e) {}
      // Method 2: try __remixContext if the performance scan came up empty.
      if (!orgId) {
        try {
          var ctx = window.__remixContext;
          if (ctx) {
            var json = JSON.stringify(ctx.state || ctx);
            var rm = json.match(/["\s]uuid["']?\s*:\s*["']([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["']/i);
            if (rm) orgId = rm[1];
          }
        } catch(e) {}
      }
      // Method 3: ask /api/organizations directly.
      if (!orgId) {
        try {
          var r = await fetch('/api/organizations', { credentials: 'include' });
          if (r.ok) {
            var orgs = await r.json();
            var orgList = Array.isArray(orgs) ? orgs : (orgs.organizations || []);
            if (orgList.length) orgId = orgList[0].uuid || orgList[0].id;
          }
        } catch(e) {}
      }
      if (!orgId) return [];
      var resp = await fetch('/api/organizations/' + orgId + '/projects?limit=100', {
        credentials: 'include'
      });
      if (!resp.ok) return [];
      var data = await resp.json();
      var projectList = Array.isArray(data) ? data : (data.projects || []);
      return projectList.map(function(p) {
        var name = p.name || p.project_name || p.title || '';
        var id = p.uuid || p.id || name;
        return { id: id, name: name };
      }).filter(function(p) { return p.id && p.name; });
    } catch(e) {
      return [];
    }
  }
  // Claude.ai: project links don't live in the sidebar DOM by default.
  // Instead, temporarily open the "Add/Change project" modal on the first
  // available chat, read the [role="option"] project names, then close it.
  async function fetchProjectsViaClaudeModal() {
    var chatLinks = Array.from(document.querySelectorAll(SITE.chatLinkSelector));
    if (!chatLinks.length) return [];
    var link = chatLinks[0];
    link.scrollIntoView({ behavior: 'instant', block: 'center' });
    await delay(200);
    realHover(link);
    await delay(400);
    var row = link.closest('li') || link.parentElement;
    var menuBtn = row && (
      row.querySelector('button[aria-label*="More options"]') ||
      row.querySelector('button[aria-label*="options" i]') ||
      row.querySelector('button')
    );
    if (!menuBtn) return [];
    realClick(menuBtn);
    await delay(600);
    // Find "Add to project" or "Change project" in the context menu
    var menuItem = null;
    for (var i = 0; i < 15; i++) {
      var mitems = getVisibleMenuItems();
      menuItem = mitems.find(function(el) {
        var t = normalizeText(el.textContent);
        return t === 'add to project' || t === 'change project';
      });
      if (menuItem) break;
      await delay(150);
    }
    if (!menuItem) { dismissOpenMenus(); return []; }
    realClick(menuItem);
    await delay(700);
    // Read [role="option"] items from the modal
    var opts = [];
    for (var j = 0; j < 20; j++) {
      opts = Array.from(document.querySelectorAll('[role="option"]')).filter(isVisibleElement);
      if (opts.length) break;
      await delay(150);
    }
    var projects = opts.map(function(opt) {
      var name = opt.textContent.trim();
      return { id: name, name: name }; // name used as ID — matched by text in move workflow
    }).filter(function(p) { return p.name; });
    // Close the modal
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await delay(300);
    return projects;
  }
  async function loadProjects(forceModal) {
    var sel = document.getElementById('bcm3-project-sel');
    if (!sel) return;
    // Fast DOM scan first
    var projects = fetchAllProjects();
    // On Claude.ai, try the internal API next (silent, no UI changes).
    if (!projects.length && SITE.site === 'claude') {
      projects = await fetchProjectsFromClaudeAPI();
    }
    // Last resort: open the project picker modal (only on explicit Refresh).
    if (!projects.length && SITE.site === 'claude' && forceModal) {
      setStatus('Opening project picker to load list...');
      projects = await fetchProjectsViaClaudeModal();
    }
    if (projects.length === 0) {
      sel.innerHTML = '<option value="">No projects found — try Refresh</option>';
      setStatus('No projects found. Click Refresh to load from project picker.');
      lastProjectCount = 0;
      return;
    }
    if (projects.length === lastProjectCount) return;
    lastProjectCount = projects.length;
    var currentVal = sel.value;
    sel.innerHTML = projects.map(function(p) {
      return '<option value="' + p.id + '">' + p.name + '</option>';
    }).join('');
    if (currentVal && sel.querySelector('option[value="' + currentVal + '"]')) {
      sel.value = currentVal;
    }
    setStatus('Loaded ' + projects.length + ' projects');
  }
  function injectCheckboxes() {
    var links = document.querySelectorAll(SITE.chatLinkSelector);
    links.forEach(function(link) {
      if (link.parentElement && link.parentElement.classList.contains('bcm3-wrap')) return;
      var match = link.href.match(SITE.chatHrefPattern);
      var convId = match && match[1];
      if (!convId) return;
      var wrap = document.createElement('div');
      wrap.className = 'bcm3-wrap';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'bcm3-cb';
      cb.dataset.convId = convId;
      cb.dataset.title = link.textContent.trim().replace(/\\s+/g, ' ');
      cb.addEventListener('change', updateCount);
      cb.addEventListener('click', function(e) {
        e.stopPropagation();
        handleCheckboxClick(e, cb);
      });
      link.parentElement.insertBefore(wrap, link);
      wrap.appendChild(cb);
      wrap.appendChild(link);
    });
    updateCount();
  }
  async function startSelectedAction(action) {
    var sel = document.getElementById('bcm3-project-sel');
    var projectId = sel && sel.value;
    var projectName = sel && sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].text || '';
    if (action === 'move' && !projectId) { setStatus('No project selected'); return; }
    var queue = enqueueCurrentSelection(action, projectId, projectName);
    if (!queue.items.length) { setStatus('No chats selected'); clearMoveQueue(); return; }
    if (action === 'delete') {
      setStatus('Starting: ' + queue.items.length + ' chats to delete');
    } else {
      setStatus('Starting: ' + queue.items.length + ' chats to "' + projectName + '"');
    }
    await processMoveQueue();
  }
  async function moveSelected() { await startSelectedAction('move'); }
  async function deleteSelected() { await startSelectedAction('delete'); }
  function init() {
    if (document.getElementById('bcm3-panel')) return;
    injectStyle();
    var panel = document.createElement('div');
    panel.id = 'bcm3-panel';
    panel.innerHTML =
      '<div id="bcm3-head">' +
      '<div id="bcm3-kicker">Extension</div>' +
      '<h3>' + SITE.panelTitle + '</h3>' +
      '<p id="bcm3-sub">' + SITE.panelSubtitle + '</p>' +
      '</div>' +
      '<div id="bcm3-count">Loading...</div>' +
      '<select id="bcm3-project-sel"><option>Loading...</option></select>' +
      '<button id="bcm3-refresh-btn"><svg class="bcm3-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>Refresh Projects</button>' +
      '<button id="bcm3-selall-btn"><svg class="bcm3-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 11 3 3L22 4"></path><path d="m21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2h11"></path></svg>Select / Deselect All</button>' +
      '<button id="bcm3-move-btn"><svg class="bcm3-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 14 3-3 3 3"></path><path d="M12 11v9"></path><path d="M2 10V5a2 2 0 0 1 2-2h3l2 3h11a2 2 0 0 1 2 2v2"></path></svg>Move Selected to Project</button>' +
      '<button id="bcm3-delete-btn"><svg class="bcm3-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>Delete</button>' +
      '<button id="bcm3-close-btn"><svg class="bcm3-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>Close</button>' +
      '<div id="bcm3-status">Ready</div>';
    document.body.appendChild(panel);
    document.getElementById('bcm3-selall-btn').addEventListener('click', function() {
      var cbs = Array.from(document.querySelectorAll('.bcm3-cb'));
      var shouldSelectAll = cbs.some(function(cb) { return !cb.checked; });
      cbs.forEach(function(cb) { cb.checked = shouldSelectAll; });
      updateCount();
    });
    document.getElementById('bcm3-refresh-btn').addEventListener('click', function() {
      lastProjectCount = 0;
      loadProjects(true); // forceModal=true: scrape from picker if DOM/API are empty
    });
    document.getElementById('bcm3-move-btn').addEventListener('click', moveSelected);
    document.getElementById('bcm3-delete-btn').addEventListener('click', deleteSelected);
    document.getElementById('bcm3-close-btn').addEventListener('click', function() {
      setEnabledState(false);
    });
    var injectTimer = null;
    window._bcmObserver = new MutationObserver(function() {
      clearTimeout(injectTimer);
      injectTimer = setTimeout(injectCheckboxes, 300);
    });
    window._bcmObserver.observe(document.querySelector('nav') || document.body, { childList: true, subtree: true });
    injectCheckboxes();
    var projectTimer = null;
    var knownProjectCount = document.querySelectorAll(SITE.projectLinkSelector).length;
    window._bcmProjectObserver = new MutationObserver(function() {
      var currentCount = document.querySelectorAll(SITE.projectLinkSelector).length;
      if (currentCount !== knownProjectCount) {
        knownProjectCount = currentCount;
        clearTimeout(projectTimer);
        projectTimer = setTimeout(function() {
          lastProjectCount = 0;
          loadProjects();
        }, 400);
      }
    });
    window._bcmProjectObserver.observe(document.body, { childList: true, subtree: true });
    // On Claude.ai pass forceModal=true so the modal fallback fires
    // automatically on first open if the DOM scan and API both come up empty.
    loadProjects(false);
    // Resume any pending queue on page load (the core of the reload-per-delete flow)
    setTimeout(processMoveQueue, 2000);
  }
  window._bcmInit = init;

  (async function bootstrapBcm() {
    if (bcm3Bootstrapped) return;
    bcm3Bootstrapped = true;

    var enabled = await readEnabledPref();
    window._bcmState.enabled = !!enabled;

    if (enabled) {
      setTimeout(function() {
        if (!isPanelMounted()) init();
      }, 1200);
    }

    if (hasPendingQueue()) {
      setTimeout(processMoveQueue, 1600);
    }
  })();

  var lastUrl = location.href;
  new MutationObserver(function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;

      setTimeout(function() {
        if (window._bcmState.enabled && !isPanelMounted()) {
          init();
        }
        if (hasPendingQueue()) {
          processMoveQueue();
        }
      }, 1200);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
