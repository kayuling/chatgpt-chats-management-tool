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
        realClick(btn);
        await delay(700);
        // Find the move/add-to-project menu item (text differs per site)
        var moveItem = null;
        for (var w = 0; w < 25; w++) {
          var mitems = getVisibleMenuItems();
          moveItem = mitems.find(function(el) {
            var t = normalizeText(el.textContent);
            return SITE.moveMenuItemTexts.some(function(s) { return t.indexOf(s) === 0; });
          });
          if (moveItem) break;
          await delay(150);
        }
        if (!moveItem) {
          setStatus('[' + (queue.index + 1) + '] "Move to project" option not found');
          dismissOpenMenus();
          await delay(300);
          queue.index++;
          writeMoveQueue(queue);
          bcm3QueueRunning = false;
          await processMoveQueue();
          return;
        }
        realHover(moveItem);
        realClick(moveItem);
        await delay(600);
        var projItem = null;
        var pName = normalizeText(queue.projectName || '');
        if (SITE.site === 'claude') {
          // Claude.ai opens a modal with [role="option"] items instead of a submenu
          for (var wm = 0; wm < 20; wm++) {
            var opts = Array.from(document.querySelectorAll('[role="option"]')).filter(isVisibleElement);
            projItem = opts.find(function(el) { return normalizeText(el.textContent) === pName; });
            if (projItem) break;
            await delay(150);
          }
          if (!projItem) {
            setStatus('[' + (queue.index + 1) + '] Project "' + queue.projectName + '" not in modal');
            dismissOpenMenus();
            await delay(300);
            queue.index++;
            writeMoveQueue(queue);
            bcm3QueueRunning = false;
            await processMoveQueue();
            return;
          }
          realClick(projItem);
        } else {
          // ChatGPT: project appears as a submenu item
          for (var w2 = 0; w2 < 18; w2++) {
            var pitems = getVisibleMenuItems();
            projItem = pitems.find(function(el) { return normalizeText(el.textContent) === pName; });
            if (projItem) break;
            await delay(150);
          }
          if (!projItem) {
            setStatus('[' + (queue.index + 1) + '] Project "' + queue.projectName + '" not in submenu');
            dismissOpenMenus();
            await delay(300);
            queue.index++;
            writeMoveQueue(queue);
            bcm3QueueRunning = false;
            await processMoveQueue();
            return;
          }
          realClick(projItem);
        }
        queue.moved++;
        queue.index++;
        writeMoveQueue(queue);
        var liveCb = document.querySelector('.bcm3-cb[data-conv-id="' + item.convId + '"]');
        if (liveCb) liveCb.checked = false;
        updateCount();
        await delay(950);
        if (queue.index < total) {
          bcm3QueueRunning = false;
          await processMoveQueue();
        } else {
          setStatus('Done! Moved ' + queue.moved + '/' + total + ' to "' + queue.projectName + '"');
          clearMoveQueue();
          setTimeout(function() { injectCheckboxes(); updateCount(); }, 1000);
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
  function loadProjects() {
    var projects = fetchAllProjects();
    var sel = document.getElementById('bcm3-project-sel');
    if (!sel) return;
    if (projects.length === 0) {
      sel.innerHTML = '<option value="">No projects found — try Refresh</option>';
      setStatus('No projects found. Try clicking Refresh after the page loads.');
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
      loadProjects();
    });
    document.getElementById('bcm3-move-btn').addEventListener('click', moveSelected);
    document.getElementById('bcm3-delete-btn').addEventListener('click', deleteSelected);
    document.getElementById('bcm3-close-btn').addEventListener('click', function() {
      panel.remove();
      lastClickedCheckbox = null;
      var s = document.getElementById('bcm3-style');
      if (s) s.remove();
      if (window._bcmObserver) { window._bcmObserver.disconnect(); window._bcmObserver = null; }
      if (window._bcmProjectObserver) { window._bcmProjectObserver.disconnect(); window._bcmProjectObserver = null; }
      document.querySelectorAll('.bcm3-wrap').forEach(function(wrap) {
        var link = wrap.querySelector('a');
        if (link) wrap.parentElement.insertBefore(link, wrap);
        wrap.remove();
      });
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
    loadProjects();
    // Resume any pending queue on page load (the core of the reload-per-delete flow)
    setTimeout(processMoveQueue, 2000);
  }
  window._bcmInit = init;
  setTimeout(init, 2000);
  // Re-run on SPA navigation
  var lastUrl = location.href;
  new MutationObserver(function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(function() {
        if (!document.getElementById('bcm3-panel')) init();
      }, 1500);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
