# Slack Beautify

[中文](README.md) | English

A userscript for [Violentmonkey](https://github.com/violentmonkey/violentmonkey) that turns Slack messages into bubbles, removes UI noise, and gives a designated support channel its own layout.

- Bubbles: your own messages align right, everyone else's align left;
- Decluttering: hides hover toolbars, timestamp tooltips, profile cards, and deleted messages;
- Dedicated channel: messages collapse to a single line, the composer is hidden;
- Thread panel composer stays pinned to the bottom instead of scrolling with the virtual list.

## Installation

1. Install [Violentmonkey](https://github.com/violentmonkey/violentmonkey) or [Tampermonkey](https://www.tampermonkey.net/);
2. Create a new script and paste the whole of [slack-beautify.user.js](slack-beautify.user.js) into it;
3. Fill in `MY_UID` (required), and `TARGET_ID` if you want the dedicated channel layout;
4. Save, then refresh `app.slack.com`.

### Getting your UID and channel ID

- **UID**: click your avatar → Profile → More (⋮) → Copy member ID.
- **Channel ID**: open the channel in your browser; it's the last segment of `app.slack.com/client/T.../C...` in the address bar.
