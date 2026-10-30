# Slack 美化

[English](README.en.md) | 中文

一个 [Violentmonkey](https://github.com/violentmonkey/violentmonkey) 用户脚本，把 Slack 聊天气泡化、去掉界面噪声，并给指定的客服频道单独一套样式。

- 消息气泡化：自己的消息靠右，其他人的靠左；
- 降噪：隐藏悬停工具条、时间提示气泡、资料卡、已删除消息；
- 客服频道专属：一条消息压成一行、隐藏编辑器；
- 线程面板编辑器固定在底部，不跟随虚拟列表滚动。

## 安装

1. 安装 [Violentmonkey](https://github.com/violentmonkey/violentmonkey) 或 [Tampermonkey](https://www.tampermonkey.net/)；
2. 新建脚本，把 [slack-beautify.user.js](slack-beautify.user.js) 的内容整段粘贴进去；
3. 填上 `MY_UID`（必填），需要客服频道样式再填 `TARGET_ID`；
4. 保存后刷新 `app.slack.com`。

### 获取 UID 和频道 ID

- **UID**：点自己的头像 → 个人资料 → 更多（⋮）→ 复制成员 ID
- **频道 ID**：在浏览器里打开该频道，地址栏 `app.slack.com/client/T.../C...` 最后那一段
