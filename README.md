# ChatGPT Chat Organizer

ChatGPT Chat Organizer is a Chrome MV3 extension for bulk-managing chats on `chatgpt.com` from the ChatGPT sidebar. It adds a control panel that helps you select multiple chats, then run queued move or delete workflows with status feedback and automatic recovery behavior.

## What This Extension Does

This extension adds a popup toggle that shows or hides an in-page management panel on ChatGPT. The panel lets you select chats with checkboxes and run queued actions (move/delete) so multi-chat operations can continue through dynamic sidebar updates and page refresh behavior.

## Features

- Sidebar checkbox injection for chats
- Shift-click range selection
- Select / Deselect all
- Move selected chats to a chosen project
- Delete selected chats with confirmation handling
- Queue persistence/resume during page refresh/re-render
- Auto page reload after queue completion
- Popup stateful panel toggle

## Requirements

- Google Chrome (or a Chromium-based browser with Manifest V3 support)
- An active ChatGPT session on `https://chatgpt.com`

## Installation (Load Unpacked in Chrome)

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the repo folder: `chatgpt-chats-management-tool`.
6. Pin the extension from the extensions toolbar (optional).

## How to Use

1. Open `https://chatgpt.com`.
2. Open the extension popup and turn the **Panel** toggle on.
3. In the ChatGPT sidebar, select chats using checkboxes.
4. You can hold `Shift` and click to select a range.
5. For move workflow:
6. Select a target project from the dropdown.
7. Click **Move Selected to Project**.
8. For delete workflow:
9. Select chats.
10. Click **Delete**.
11. Watch the status text in the panel for progress and outcomes.
12. After the queue completes, the page auto-reloads.

## File Structure

- `manifest.json` - Extension metadata, permissions, host matching, and popup wiring
- `popup.html` - Popup UI markup and styles
- `popup.js` - Popup behavior, panel toggle state detection, and toggle action
- `content.js` - In-page panel, checkbox injection, selection logic, and queued move/delete automation

## Permissions

- `activeTab` - Required to interact with the currently active ChatGPT tab from the popup action
- `scripting` - Required to execute the panel toggle script in the active tab
- `host_permissions` (`https://chatgpt.com/*`) - Restricts extension runtime behavior to ChatGPT pages only

## Known Limitations / Notes

- The extension relies on ChatGPT DOM/menu labels; UI changes on ChatGPT can break selectors.
- Queue logic is best-effort under heavy dynamic re-renders.
- Delete is a destructive workflow; use it carefully.
- This is not an official OpenAI tool.

## Development

1. Edit `manifest.json`, `popup.html`, `popup.js`, and `content.js` directly.
2. Reload the unpacked extension in `chrome://extensions` after changes.
3. Use DevTools on `chatgpt.com` to debug runtime behavior and selector stability.

## Troubleshooting

- Panel not showing:
  - Make sure you are on `https://chatgpt.com`.
  - Open popup and toggle the panel on.
- Projects not listed:
  - Wait for project links to load in ChatGPT.
  - Click **Refresh Projects** in the panel.
- Action stops mid-queue:
  - Refresh ChatGPT and retry selection.
  - Re-run the action once the sidebar is fully rendered.
- Delete not confirming:
  - Make sure the delete confirmation modal appears.
  - Wait until the UI settles, then retry.

## Disclaimer

Use at your own risk. This project is provided without warranty. Be careful with irreversible operations such as deleting chats.
