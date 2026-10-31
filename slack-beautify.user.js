// ==UserScript==
// @name         Slack 美化
// @namespace    https://github.com/honwebx/slack-beautify
// @version      1.0.1
// @description  气泡消息、界面精简、客服频道专属样式、编辑器固定
// @match        https://app.slack.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/honwebx/slack-beautify
// @supportURL   https://github.com/honwebx/slack-beautify/issues
// ==/UserScript==

(function () {
  "use strict";

  // 自己的 UID（U 开头）
  const MY_UID = "";

  /* 发送者身份
   * 机器人、AI助手、系统消息 */
  const BOT_NAME_HINTS = /system|bot|captain/i;

  // 是否隐藏已删除消息
  const HIDE_DELETED = true;

  // 客服频道 ID
  const TARGET_ID = "";

  // 客服频道标识
  const SCOPE_ATTR = "data-sb-channel";

  // URL 中的频道 ID
  const CHANNEL_ID_RE = /\/(?:client\/[A-Z0-9]+\/|archives\/)(C[A-Z0-9]{6,})/;

  /* 客服频道专属样式
   * %SCOPE% 会替换成该频道的开关选择器 */
  const CHANNEL_CSS = `
    /* 去掉气泡 */
    %SCOPE% .p-view_contents--primary #message-list .c-message_kit__blocks {
      width: auto !important;
      max-width: none !important;
      padding-left: 0 !important;
      background: transparent !important;
    }
    /* 编辑器 */
    %SCOPE% .p-view_contents--primary .workspace__primary_view_footer {
      display: none !important;
    }
    /* Inbox 通知 */
    %SCOPE% .p-view_contents--primary #message-list .p-rich_text_section {
      display: -webkit-box !important;
      -webkit-box-orient: vertical !important;
      -webkit-line-clamp: 1 !important;
      overflow: hidden !important;
    }
    /* 卡片 */
    %SCOPE% .p-view_contents--primary #message-list .c-message_kit__gutter__right {
      border-bottom: 1px solid light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1));
      padding-left: 0 !important;
      margin-left: 0 !important;
      margin-bottom: -8px !important;
    }
    %SCOPE% .p-view_contents--primary #message-list .c-message_kit__background:hover {
      background: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05)) !important;
    }
    %SCOPE% .p-view_contents--primary #message-list .p-message_pane_message__active_thread {
      background: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1)) !important;
    }
    %SCOPE% .p-view_contents--primary #message-list .c-message_kit__background:hover .c-message_kit__gutter__right,
    %SCOPE% .p-view_contents--primary #message-list .p-message_pane_message__active_thread .c-message_kit__gutter__right,
    %SCOPE% .p-view_contents--primary #message-list .c-virtual_list__item:has(+ .c-virtual_list__item .p-message_pane_message__active_thread) .c-message_kit__gutter__right,
    %SCOPE% .p-view_contents--primary #message-list .c-virtual_list__item:has(+ .c-virtual_list__item:hover) .c-message_kit__gutter__right {
      border-color: transparent;
    }
    `;

  // 全局样式
  const GENERAL_CSS = `
    /* ========== 降噪 ==========*/

    /* 连发行悬停时时间 */
    [data-sb-grouped] .c-message_kit__gutter__left .c-timestamp,
    /* 悬停工具条 */
   .c-message_kit__actions .c-message__actions,
   /* 悬停资料卡 */
   .p-member_profile_hover_card__popover,
   /* 提示气泡 */
   .c-tooltip__tip,
   /* 超链接悬停卡片 */
   .ReactModalPortal [class^="urlHoverCardContainer"],
   /* 图片悬停操作区：操作按钮组、删除按钮、增加描述 */
   .c-file_gallery [data-qa="file_remove_from_message"],
   .c-file_gallery button[class^="altBadge"],
   .c-file_gallery .c-file__actions {
      display: none !important;
    }
    /* 已删除消息 */
    [data-sb-deleted],
    [data-sb-empty-day] {
      display: none !important;
    }

    /* ========== 气泡本体（所有消息） ========== */

    /* 悬停背景 */
    .c-message_kit__background,
   .c-message_kit__background:hover {
      background: transparent !important;
    }
    /* 圆角 8px 参照头像；底色用淡灰色。 */
    .c-message_kit__blocks {
      width: fit-content !important;
      max-width: min(68ch, 62vw) !important;
      padding: 7px 12px !important;
      border-radius: 8px !important;
      background: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1)) !important;
    }

    /* ========== 自己的消息：靠右、头像到最右侧 ========== */

    /* 换位用 order 不用 row-reverse：官方靠负外边距把内容列塞向头像，
    * row-reverse 只翻顺序、不翻这些物理外边距，气泡会被头像压住。
    * 用 data 属性不用 class：Slack 悬停时会重写行 className，把我们的类抹掉。 */
    [data-sb-mine] .c-message_kit__gutter__left {
      order: 2;
      margin-right: 0 !important;    /* 官方这 8px 是留给「头像右边的正文」的 */
      margin-left: 8px !important;   /* 换位后挪到内侧 */
    }
    [data-sb-mine] .c-message_kit__gutter__left .c-message_kit__avatar {
      margin-right: 0 !important;
    }
    [data-sb-mine] .c-message_kit__gutter__right {
      order: 1;
      margin-left: auto !important;
      margin-right: 0 !important;
      padding-left: 16px !important;
      padding-right: 0 !important;
    }
    [data-sb-mine] .c-message_kit__blocks {
      margin-left: auto !important;
      background: var(--dt_color-theme-base-hgl-1, #085867) !important;
      color: var(--dt_color-theme-content-hgl-1, #e3ffff) !important;
    }
    [data-sb-mine] .c-message_kit__blocks a,
    [data-sb-mine] .c-message_kit__blocks .p-rich_text_slug {
      color: var(--dt_color-theme-content-hgl-1, #e3ffff) !important;
    }
    /* 附件/文件整体右移 */
    [data-sb-mine] .c-files_container,
    [data-sb-mine] .c-message_kit__attachments {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      margin-left: auto !important;
    }
    [data-sb-mine] .c-message_kit__file + div {
      width: auto !important;
    }
    [data-sb-mine] .c-file_gallery {
      width: auto !important;
    }
    /* 昵称/时间隐藏后气泡上移 */
    [data-sb-mine]:not([data-sb-grouped]) .c-message_kit__blocks {
      margin-top: -12px !important;
    }
    /* 自己的消息不显示昵称和时间 */
    [data-sb-mine] .c-message__sender,
    [data-sb-mine] [data-qa="message_sender_name"],
    [data-sb-mine] .c-timestamp__label {
      display: none !important;
    }

    /* ========== 机器人气泡 ========== */

    [data-sb-machine] .c-message_kit__blocks {
      opacity: 0.5 !important;
    }
    [data-sb-machine] .p-rich_text_section i,
    [data-sb-machine] .p-rich_text_section em {
      font-style: normal !important;
    }
    [data-sb-machine] .c-message_kit__blocks a {
      color: inherit !important;
    }

    /* ========== 消息列编辑器 ========== */
    /* 滚动区让出编辑框高度。
     * hider 自带 transform: translateZ(0)，会让 fixed 被它接管、跟着滚，
     * 这里去掉，fixed 才能相对更外层定位。 */
    .c-virtual_list.sb-pin-input > .c-scrollbar__hider {
      height: calc(100% - var(--sb-pin-h, 0px)) !important;
      transform: none !important;
    }
    /* 节点不搬，只把它 fixed 到让出来的那条带子里 */
    .c-virtual_list.sb-pin-input [data-item-key="input"] {
      position: fixed !important;
      top: var(--sb-pin-top, 0px) !important;
      left: var(--sb-pin-left, 0px) !important;
      width: var(--sb-pin-w, auto) !important;
      bottom: auto !important;
      z-index: 200 !important;
    }
    /* 裁掉 Slack 给输入框预留的滚动高度 */
    .c-virtual_list.sb-pin-input > .c-scrollbar__hider > .c-scrollbar__child > .c-virtual_list__scroll_container {
      height: var(--sb-sc-h, auto) !important;
    }
    /* 滚动条停在编辑框上方 */
    .c-virtual_list.sb-pin-input > .c-scrollbar__track {
      top: 0 !important;
      bottom: var(--sb-pin-h, 0px) !important;
      height: auto !important;
    }
  `;

  // 注入 CSS
  function injectStyle() {
    if (document.getElementById("slack-beautify-style")) return; // 已存在就直接返回，不重复插
    const root = document.head || document.documentElement;
    if (!root) return;
    const style = document.createElement("style");
    style.id = "slack-beautify-style";
    const scoped = channelCss();
    style.textContent = scoped ? GENERAL_CSS + "\n" + scoped : GENERAL_CSS;
    root.appendChild(style);
  }

  // 替换客服频道选择器占位符
  function channelCss() {
    return String(CHANNEL_CSS).replace(/%SCOPE%/g, "html[" + SCOPE_ATTR + "]");
  }

  // 客服频道文档根加标识
  function applyChannelScope() {
    const root = document.documentElement;
    if (!root) return;

    const m = location.pathname.match(CHANNEL_ID_RE);
    const hit = !!m && m[1] === TARGET_ID;

    /* 状态没变就直接返回，避免每次 DOM 变化都重复写属性 */
    if (hit === root.hasAttribute(SCOPE_ATTR)) return;

    if (hit) root.setAttribute(SCOPE_ATTR, "on");
    else root.removeAttribute(SCOPE_ATTR);
  }

  /* ================= 打标记 ================= */

  // 头像中的 UID
  const UID_RE = /(?:^|[-_\/])(U[A-Z0-9]{6,})(?:[-_.\/]|$)/;
  /* 判断是否自己的消息，返回 true / false / null。
   * null = 这一行自己拿不到证据（连发行没头像、头像还没加载），交给上层沿用上一条。 */
  function rowIsMine(row, nameBtn) {
    const uid = (nameBtn && nameBtn.getAttribute("data-message-sender")) || "";
    if (/^U[A-Z0-9]{6,}$/.test(uid)) return uid === MY_UID;

    // 没有 UID 就回头像 URL；头像不可见或 URL 里没有 UID 时不下结论
    const img = row.querySelector(".c-message_kit__gutter__left img");
    if (!img || !img.getClientRects().length) return null;
    const src = img.currentSrc || img.src || "";
    const m = src.match(UID_RE);
    if (!m) return null;
    return m[1] === MY_UID;
  }

  // 官方「应用」角标：Slack 用它统一标记应用、机器人与外部身份
  function isAppish(row) {
    return !!row.querySelector('[data-qa="message_sender_app_badge"], .c-app_badge');
  }

  /* 判断是否「名字命中关键词」的机器消息，返回 true / false / null。
   * 连发行没有昵称，返回 null 交给上层沿用上一条。 */
  function rowIsMachine(row, nameBtn) {
    if (!nameBtn) return null;
    if (!isAppish(row)) return false;
    if (nameBtn.getAttribute("data-message-sender")) return false; // 有 UID 的不是机器人

    const s = row.querySelector('[data-qa="message_sender"]');
    const name = (s && s.getAttribute("data-stringify-text")) || nameBtn.textContent || "";
    return BOT_NAME_HINTS.test(name.trim());
  }

  // 自己的消息
  function markMine(row, nameEl, prev) {
    const mine = nameEl ? rowIsMine(row, nameEl) === true : prev;
    row.toggleAttribute("data-sb-mine", mine);
    return mine;
  }

  // 机器人消息
  function markMachine(row, nameEl, prev) {
    const machine = nameEl ? rowIsMachine(row, nameEl) === true : prev;
    row.toggleAttribute("data-sb-machine", machine);
    return machine;
  }

  // 已删除消息
  function markDeleted(row) {
    const on = HIDE_DELETED && !!row.querySelector(".c-message_kit__tombstone__text");
    row.toggleAttribute("data-sb-deleted", on);
    return on;
  }

  function senderNameEl(row) {
    return row.querySelector('[data-qa="message_sender_name"], .c-message__sender_button');
  }

  // 过滤 Inbox
  function stripInbox(row) {
    if (!document.documentElement.hasAttribute(SCOPE_ATTR)) return;

    const ps = row.querySelector(".p-rich_text_section");
    if (!ps) return;

    const brk = ps.querySelector(".c-mrkdwn__br");
    if (!brk) return;
    if (!/^inbox\s*[:：]/i.test((ps.textContent || "").trim())) return;

    while (brk.previousSibling) brk.previousSibling.remove();
    brk.remove();
  }

  // 扫描所有消息行打标记
  const ROW_SEL = '[data-qa="message_container"]';

  function scanRows() {
    const items = document.querySelectorAll('[data-qa="virtual-list-item"]');

    let mine = false; // 连发继承用
    let machine = false;
    let day = null; // { items: Element[], valid, seenRow }

    const settleDay = () => {
      if (!day) return;
      day.items.forEach((el) => {
        if (day.valid) el.removeAttribute("data-sb-empty-day");
        else el.setAttribute("data-sb-empty-day", "");
      });
      day = null;
    };

    items.forEach((item) => {
      // 日期项：连续出现归同一块，遇到消息后再来的日期项就结算上一块
      if (item.querySelector(".c-message_list__day_divider__label, .c-message_list__day_divider")) {
        if (!day || day.seenRow) {
          settleDay();
          day = { items: [], valid: false, seenRow: false };
        }
        day.items.push(item);
        return;
      }

      const rows = item.querySelectorAll(ROW_SEL);
      if (!rows.length) return;

      rows.forEach((row) => {
        const system = !!row.querySelector(".c-message__body--automated, .c-message__system_message");

        if (system) {
          mine = false;
          machine = false;
        }

        const nameEl = senderNameEl(row);

        if (day) day.seenRow = true;

        if (markDeleted(row)) {
          row.removeAttribute("data-sb-grouped");
          return;
        }

        if (day) day.valid = true;

        mine = markMine(row, nameEl, mine);
        machine = markMachine(row, nameEl, machine);
        row.toggleAttribute("data-sb-grouped", !nameEl);

        stripInbox(row);
      });
    });

    settleDay();
  }

  /* ================= 消息列编辑器 ================= */
  const PANEL_SEL = ".p-threads_flexpane__message_area";

  const observedItems = new WeakSet();

  const composerRO = window.ResizeObserver
    ? new ResizeObserver(function () {
        schedulePin();
      })
    : null;

  /* fixed 的包含块不一定是视口：祖先带 transform、filter、contain 等都会改变参考点。
   * 找到最近的那个祖先，把视口坐标换算成它的内部坐标。 */
  function fixedOrigin(el) {
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      const blocked =
        cs.transform !== "none" ||
        cs.translate !== "none" ||
        cs.rotate !== "none" ||
        cs.scale !== "none" ||
        cs.perspective !== "none" ||
        cs.filter !== "none" ||
        cs.backdropFilter !== "none" ||
        /layout|paint|strict|content/.test(cs.contain) ||
        /transform|translate|rotate|scale|perspective|filter/.test(cs.willChange);

      if (blocked) {
        const r = node.getBoundingClientRect();
        return { x: r.left + node.clientLeft, y: r.top + node.clientTop };
      }
      node = node.parentElement;
    }
    return { x: 0, y: 0 };
  }

  // 只在值真变了才写，避免无谓的样式失效
  function setVar(el, name, value) {
    if (el.style.getPropertyValue(name) === value) return;
    el.style.setProperty(name, value);
  }

  // 同一个 item 的 fixed 包含块不会变，算一次就够
  const originCache = new WeakMap();

  function originOf(item) {
    let o = originCache.get(item);
    if (!o) {
      o = fixedOrigin(item);
      originCache.set(item, o);
    }
    return o;
  }

  /* 只写 CSS 变量：让位、固定、滚动条都由 CSS 完成，不逐帧算位置 */
  function placeComposer(item, list, h) {
    const listRect = list.getBoundingClientRect();
    const origin = originOf(item);
    const slotTop = parseFloat(item.style.top || "");

    setVar(list, "--sb-pin-h", h + "px");
    setVar(list, "--sb-pin-top", Math.round(listRect.bottom - h - origin.y) + "px");
    setVar(list, "--sb-pin-left", Math.round(listRect.left - origin.x) + "px");
    setVar(list, "--sb-pin-w", Math.round(listRect.width) + "px");

    // 滚动内容只保留消息，编辑框的槽位由 fixed 那条带子承担
    if (slotTop > 0) setVar(list, "--sb-sc-h", slotTop + "px");
    else if (list.style.getPropertyValue("--sb-sc-h")) list.style.removeProperty("--sb-sc-h");
  }

  // 当前被固定住的 list，省掉每次全文档重查 .sb-pin-input
  const pinnedLists = new Set();

  function clearPin(list) {
    list.classList.remove("sb-pin-input");
    ["--sb-pin-h", "--sb-pin-top", "--sb-pin-left", "--sb-pin-w", "--sb-sc-h"].forEach(function (n) {
      list.style.removeProperty(n);
    });
    pinnedLists.delete(list);
  }

  function pinComposer() {
    const items = document.querySelectorAll(PANEL_SEL + ' [data-item-key="input"]');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const list = item.closest(".c-virtual_list");
      if (!list) continue;

      // 先用原布局量高度，再加类
      const h = item.offsetHeight;
      if (!h) continue;

      if (!list.classList.contains("sb-pin-input")) list.classList.add("sb-pin-input");
      pinnedLists.add(list);
      placeComposer(item, list, h);

      if (composerRO && !observedItems.has(item)) {
        observedItems.add(item);
        composerRO.observe(item);
      }
    }

    // 面板关闭后清残留
    pinnedLists.forEach(function (list) {
      if (!list.querySelector('[data-item-key="input"]')) clearPin(list);
    });
  }

  // 输入框高度变化（换行、附件）时重算
  let pinRaf = 0;
  function schedulePin() {
    if (pinRaf) return;
    pinRaf = requestAnimationFrame(function () {
      pinRaf = 0;
      pinComposer();
    });
  }

  // 窗口缩放时重算宽度/左侧偏移：Slack 不一定因此产生 DOM 变动
  window.addEventListener("resize", schedulePin);

  /* ================= 调度 ================= */

  // 把密集触发合并到一帧
  let raf = 0;
  let rafRows = true;

  function schedule(needRows) {
    rafRows = rafRows || needRows !== false;
    if (raf) return; // 本帧已排队，吞掉这次
    raf = requestAnimationFrame(function () {
      raf = 0; // 先清零：万一抛错也不卡死下一帧
      const rows = rafRows;
      rafRows = false;
      if (TARGET_ID) applyChannelScope();
      if (rows) scanRows();
      pinComposer();
    });
  }

  /* ================= 启动 ================= */

  let started = false;
  function boot() {
    injectStyle(); // root 不存在时它自己会安静返回
    if (!document.documentElement) return false;

    if (!started) {
      started = true;

      /* DOM 一变就重扫：新消息、切频道、虚拟列表重建。
       * 落在输入框内部的变动（打字）跟消息列表无关，只走 pinComposer。 */
      new MutationObserver(function (records) {
        let needRows = false;
        for (let i = 0; i < records.length; i++) {
          const t = records[i].target;
          if (t.closest && t.closest('[data-item-key="input"]')) continue;
          needRows = true;
          break;
        }
        schedule(needRows);
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }

    schedule();
    return true;
  }

  // document-start 时 <html> 可能还没生成，50ms 轮询到它出现为止
  const timer = setInterval(function () {
    if (boot()) clearInterval(timer);
  }, 50);
})();
