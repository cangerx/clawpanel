/**
 * 消息渠道管理
 * 配置 Telegram / Discord 等外部消息接入，凭证校验后写入 openclaw.json
 */
import { api } from '../lib/tauri-api.js'
import { toast } from '../components/toast.js'
import { showContentModal, showConfirm } from '../components/modal.js'
import { icon } from '../lib/icons.js'
import QRCode from 'qrcode'

const PLUGIN_STATUS_TTL = 30000
const _pluginStatusCache = new Map()

// ── 渠道注册表：定义每个支持的消息渠道的元数据和表单规格 ──

const PLATFORM_REGISTRY = {
  qqbot: {
    label: 'QQ 机器人',
    iconName: 'message-square',
    desc: '内置 QQ 机器人接入能力，通过 QQ 开放平台快速启用',
    guide: [
      '使用手机 QQ 扫描二维码，<a href="https://q.qq.com/qqbot/openclaw/login.html" target="_blank" style="color:var(--accent);text-decoration:underline">打开 QQ 机器人开放平台</a> 完成注册登录',
      '点击「创建机器人」，设置机器人名称和头像',
      '创建完成后，在机器人详情页复制 <b>AppID</b> 和 <b>AppSecret</b>（AppSecret 仅显示一次，请妥善保存）',
      '将 AppID 和 AppSecret 填入下方表单，点击「校验凭证」验证后保存',
      'ClawPanel 会自动安装 QQBot 社区插件并写入配置，保存后 Gateway 自动重载生效',
    ],
    guideFooter: '<div style="margin-top:8px;font-size:var(--font-size-xs);color:var(--text-tertiary)">详细教程：<a href="https://cloud.tencent.com/developer/article/2626045" target="_blank" style="color:var(--accent);text-decoration:underline">腾讯云 - 快速搭建 AI 私人 QQ 助理</a></div>',
    fields: [
      { key: 'appId', label: 'AppID', placeholder: '如 1903224859', required: true },
      { key: 'appSecret', label: 'AppSecret', placeholder: '如 cisldqspngYlyPdc', secret: true, required: true },
    ],
    pluginRequired: '@sliverp/qqbot@latest',
  },
  telegram: {
    label: 'Telegram',
    iconName: 'send',
    desc: '通过 BotFather 创建机器人，用 Bot Token 接入',
    guide: [
      '在 Telegram 中搜索 <a href="https://t.me/BotFather" target="_blank" style="color:var(--accent);text-decoration:underline">@BotFather</a>，发送 <b>/newbot</b> 创建机器人',
      '按提示设置机器人名称和用户名，成功后 BotFather 会返回 <b>Bot Token</b>',
      '获取你的 Telegram 用户 ID：发送消息给 <a href="https://t.me/userinfobot" target="_blank" style="color:var(--accent);text-decoration:underline">@userinfobot</a> 即可查看',
      '将 Bot Token 和用户 ID 填入下方表单，点击「校验凭证」验证后保存',
    ],
    fields: [
      { key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-DEF...', secret: true, required: true },
      { key: 'allowedUsers', label: '允许的用户 ID', placeholder: '多个用逗号分隔，如 12345, 67890', required: true },
    ],
  },
  feishu: {
    label: '飞书',
    iconName: 'message-square',
    desc: '飞书/Lark 企业消息集成，支持文档、多维表格、日历等飞书生态能力',
    guide: [
      '<b>选择插件版本</b>：<br>• <b>内置插件</b>（默认）— OpenClaw 自带，主要做聊天入口，安装简单<br>• <b>飞书官方插件</b> — 飞书团队开发，能以你的身份操作飞书（写文档、建表、约日程）<br><span style="color:var(--text-tertiary)">两者互斥，只能启用一个</span>',
      '前往 <a href="https://open.feishu.cn/app" target="_blank" style="color:var(--accent);text-decoration:underline">飞书开放平台</a>，创建企业自建应用，在「应用能力」中添加<b>机器人</b>能力',
      '在<b>凭证与基础信息</b>页面获取 <b>App ID</b> 和 <b>App Secret</b>',
      '进入<b>权限管理</b>，参照 <a href="https://open.larkoffice.com/document/server-docs/application-scope/scope-list" target="_blank" style="color:var(--accent);text-decoration:underline">权限列表</a> 开通所需权限（<code>im:message</code> 等）',
      '进入<b>事件订阅</b>，选择<b>使用长连接（WebSocket）</b>模式，订阅<b>接收消息</b>和<b>卡片回调</b>事件。如有 user access token 开关请打开',
      '将 App ID 和 App Secret 填入下方表单，校验后保存',
      '保存后在飞书中向机器人发消息，获取配对码；你可以直接在下方"配对审批"区域粘贴配对码完成绑定，也可以在终端执行 <code>openclaw pairing approve feishu &lt;配对码&gt; --notify</code>',
    ],
    guideFooter: '<div style="margin-top:8px;font-size:var(--font-size-xs);color:var(--text-tertiary)">国际版 Lark 用户请将域名切换为 <b>lark</b>。详细教程：<a href="https://www.feishu.cn/content/article/7613711414611463386" target="_blank" style="color:var(--accent);text-decoration:underline">OpenClaw 飞书官方插件使用指南</a> · <a href="https://github.com/AlexAnys/openclaw-feishu" target="_blank" style="color:var(--accent);text-decoration:underline">两个插件怎么选</a></div>',
    fields: [
      { key: 'appId', label: 'App ID', placeholder: 'cli_xxxxxxxxxx', required: true },
      { key: 'appSecret', label: 'App Secret', placeholder: '应用密钥', secret: true, required: true },
      { key: 'domain', label: '域名', placeholder: 'feishu（国际版选 lark）', required: false },
      { key: 'pluginVersion', label: '插件版本', type: 'select', required: false, options: [
        { value: 'builtin', label: '内置插件（默认，聊天入口）' },
        { value: 'official', label: '飞书官方插件（操作文档/日历/任务）' },
      ]},
    ],
    pluginRequired: '@openclaw/feishu@latest',
    pluginId: 'feishu',
    pairingChannel: 'feishu',
    pairingNotify: true,
  },
  dingtalk: {
    label: '钉钉',
    iconName: 'message-square',
    desc: '钉钉企业内部应用 + 机器人 Stream 模式接入',
    guide: [
      '前往 <a href="https://open-dev.dingtalk.com/" target="_blank" style="color:var(--accent);text-decoration:underline">钉钉开放平台</a> 创建企业内部应用，并添加<b>机器人</b>能力',
      '消息接收模式必须选择 <b>Stream 模式</b>，不要选 Webhook',
      '在<b>凭证与基础信息</b>页面复制 <b>Client ID</b> 和 <b>Client Secret</b>；如 Gateway 开启了鉴权，请按 <code>gateway.auth.mode</code> 填写 <b>Gateway Token</b> 或 <b>Gateway Password</b>',
      '在<b>权限管理</b>中至少确认已开通 <code>Card.Streaming.Write</code>、<code>Card.Instance.Write</code>、<code>qyapi_robot_sendmsg</code>，如需文档能力再补文档相关权限',
      '先在钉钉侧<b>发布应用版本</b>，并确认<b>应用可见范围</b>包含你自己和测试成员；否则私聊或加群时可能搜不到机器人',
      '回到 ClawPanel 保存。首次保存会自动安装插件，后续保存只更新配置；如果本机已配置 Gateway 鉴权，系统会自动带出对应的 Token 或 Password',
      '私聊测试时，可在钉钉客户端搜索应用/机器人名称，或从工作台进入应用后发起对话；若找不到，优先检查“已发布”和“可见范围”',
      '如果机器人首次私聊返回的是<b>配对码</b>，你可以直接在下方“配对审批”区域粘贴配对码完成授权，也可以在终端执行 <code>openclaw pairing approve dingtalk-connector &lt;配对码&gt;</code>',
      '群聊测试时，先进入目标群 → <b>群设置</b> → <b>智能群助手 / 机器人</b> → <b>添加机器人</b>，搜索并添加该机器人；回群后建议用 <code>@机器人</code> 再发消息，如仍不响应再检查连接器的 <code>groupPolicy</code> 是否被设为 <code>disabled</code>',
    ],
    guideFooter: '<div style="margin-top:8px;font-size:var(--font-size-xs);color:var(--text-tertiary)">参考资料：<a href="https://open.dingtalk.com/document/dingstart/install-openclaw-locally" target="_blank" style="color:var(--accent);text-decoration:underline">本地安装 OpenClaw</a>、<a href="https://open.dingtalk.com/document/orgapp/use-group-robots" target="_blank" style="color:var(--accent);text-decoration:underline">添加机器人到钉钉群</a>。排障重点：405 通常是 <code>chatCompletions</code> 未启用，401 通常是 Gateway 鉴权字段不匹配。</div>',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'dingxxxxxxxxxx', required: true },
      { key: 'clientSecret', label: 'Client Secret', placeholder: '应用密钥', secret: true, required: true },
      { key: 'gatewayToken', label: 'Gateway Token', placeholder: '如已开启 Gateway token 鉴权则填写', required: false },
      { key: 'gatewayPassword', label: 'Gateway Password', placeholder: '与 token 二选一，可选', secret: true, required: false },
    ],
    pluginRequired: '@dingtalk-real-ai/dingtalk-connector',
    pluginId: 'dingtalk-connector',
    pairingChannel: 'dingtalk-connector',
  },
  discord: {
    label: 'Discord',
    iconName: 'message-circle',
    desc: '通过 Discord Developer Portal 创建 Bot 应用接入',
    guide: [
      '前往 <a href="https://discord.com/developers/applications" target="_blank" style="color:var(--accent);text-decoration:underline">Discord Developer Portal</a>，点击 New Application 创建应用',
      '进入应用 → 左侧 <b>Bot</b> 页面 → 点击 Reset Token 生成 Bot Token，并开启 <b>Message Content Intent</b>',
      '左侧 <b>OAuth2</b> → URL Generator，勾选 bot 权限，复制链接将 Bot 邀请到你的服务器',
      '将 Bot Token 和服务器 ID 填入下方表单，点击「校验凭证」验证后保存',
    ],
    fields: [
      { key: 'token', label: 'Bot Token', placeholder: 'MTIz...', secret: true, required: true },
      { key: 'guildId', label: '服务器 ID', placeholder: '右键服务器 → 复制服务器 ID', required: false },
      { key: 'channelId', label: '频道 ID（可选）', placeholder: '不填则监听所有频道', required: false },
    ],
  },
  // ── 微信 ──
  wechat: {
    label: '微信',
    iconName: 'smartphone',
    desc: '腾讯官方原生微信插件，支持扫码登录、文本/图片/文件收发',
    guide: [
      '点击「安装」，ClawPanel 会自动安装腾讯官方微信插件 <code>@tencent-weixin/openclaw-weixin</code>',
      '安装完成后，使用终端命令 <code>openclaw channels login --channel openclaw-weixin</code> 拉起二维码登录',
      '使用手机微信扫码绑定，绑定成功后即可通过微信与 AI 对话',
      '原生插件支持文本、图片、视频、文件消息收发',
    ],
    guideFooter: '<div style="margin-top:8px;font-size:var(--font-size-xs);color:var(--text-tertiary)">当前使用腾讯官方原生微信插件方案。登录命令：<code>openclaw channels login --channel openclaw-weixin</code></div>',
    fields: [],
    pluginRequired: '@tencent-weixin/openclaw-weixin@latest',
    pluginId: 'openclaw-weixin',
  },
  whatsapp: {
    label: 'WhatsApp',
    iconName: 'phone',
    desc: '扫码登录 WhatsApp，OpenClaw 内置 Web 桥接',
    guide: [
      '保存配置后，OpenClaw 会启动 WhatsApp Web 桥接',
      '使用手机 WhatsApp 扫描终端中显示的二维码完成登录',
      '登录成功后即可通过 WhatsApp 与 AI 对话',
    ],
    fields: [
      { key: 'phoneNumber', label: '手机号（可选）', placeholder: '+86xxxxxxxxx，用于标识账号', required: false },
    ],
  },
  slack: {
    label: 'Slack',
    iconName: 'hash',
    desc: '通过 Slack App 接入工作区，支持 Socket Mode',
    guide: [
      '前往 <a href="https://api.slack.com/apps" target="_blank" style="color:var(--accent);text-decoration:underline">Slack API</a> 创建新 App',
      '在 <b>OAuth & Permissions</b> 中添加 Bot Token Scopes：<code>chat:write</code>、<code>app_mentions:read</code>、<code>im:history</code>',
      '启用 <b>Socket Mode</b>，生成 App-Level Token（<code>connections:write</code> scope）',
      '安装 App 到工作区，复制 <b>Bot Token</b>（xoxb-）和 <b>App Token</b>（xapp-）填入下方',
    ],
    fields: [
      { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-xxxx', secret: true, required: true },
      { key: 'appToken', label: 'App Token', placeholder: 'xapp-xxxx', secret: true, required: true },
      { key: 'signingSecret', label: 'Signing Secret', placeholder: '可选，用于验证请求来源', secret: true, required: false },
    ],
  },
  signal: {
    label: 'Signal',
    iconName: 'shield-check',
    desc: '通过 Signal CLI 或 signal-cli-rest-api 接入',
    guide: [
      '安装并配置 <a href="https://github.com/AsamK/signal-cli" target="_blank" style="color:var(--accent);text-decoration:underline">signal-cli</a> 或使用 Docker 版 REST API',
      '使用 <code>signal-cli register</code> 注册手机号并完成验证',
      '填入手机号和 Signal CLI REST API 地址',
    ],
    fields: [
      { key: 'phoneNumber', label: '手机号', placeholder: '+86xxxxxxxxx', required: true },
      { key: 'signalCliUrl', label: 'Signal CLI URL', placeholder: 'http://localhost:8080', required: true },
    ],
  },
  googlechat: {
    label: 'Google Chat',
    iconName: 'message-circle',
    desc: '通过 Google Workspace Service Account 接入',
    guide: [
      '在 <a href="https://console.cloud.google.com/" target="_blank" style="color:var(--accent);text-decoration:underline">Google Cloud Console</a> 创建项目并启用 Chat API',
      '创建 Service Account 并下载 JSON 密钥文件',
      '在 Google Chat API 配置中设置 Bot，将 JSON 内容和 Space ID 填入下方',
    ],
    fields: [
      { key: 'serviceAccountJson', label: 'Service Account JSON', placeholder: '粘贴 JSON 密钥内容', secret: true, required: true },
      { key: 'spaceId', label: 'Space ID', placeholder: 'spaces/xxxxxx', required: false },
    ],
  },
  bluebubbles: {
    label: 'BlueBubbles',
    iconName: 'message-circle',
    desc: '通过 BlueBubbles Server 接入 iMessage（需 macOS）',
    guide: [
      '在 Mac 上安装 <a href="https://bluebubbles.app" target="_blank" style="color:var(--accent);text-decoration:underline">BlueBubbles Server</a>',
      '启动 Server 后获取连接地址和密码',
      '将 Server URL 和密码填入下方表单',
    ],
    fields: [
      { key: 'serverUrl', label: 'Server URL', placeholder: 'http://localhost:1234', required: true },
      { key: 'password', label: 'Password', placeholder: 'BlueBubbles 服务器密码', secret: true, required: true },
    ],
  },
  webchat: {
    label: 'WebChat',
    iconName: 'layout',
    desc: 'OpenClaw 内置 Web 聊天界面，开箱即用',
    guide: [
      'WebChat 是 OpenClaw 内置的网页聊天界面，无需额外配置',
      '保存后可通过浏览器访问指定端口与 AI 对话',
      '适合快速测试或作为简易客服入口',
    ],
    fields: [
      { key: 'port', label: '端口', placeholder: '3210（默认）', required: false },
      { key: 'title', label: '页面标题（可选）', placeholder: 'AI 助手', required: false },
    ],
  },
  // ── 企业微信 ──
  wecom: {
    label: '企业微信',
    iconName: 'briefcase',
    desc: '企业微信官方 OpenClaw 插件，支持长连接机器人、文档 MCP、群聊等',
    guide: [
      '点击「安装」自动部署企业微信 OpenClaw 插件',
      '前往 <a href="https://work.weixin.qq.com/wework_admin/frame#apps" target="_blank" style="color:var(--accent);text-decoration:underline">企业微信管理后台</a>，创建 AI 机器人并获取 <b>Bot ID</b> 和 <b>Secret</b>',
      '将 Bot ID 和 Secret 填入下方表单，保存后扫码绑定即可使用',
      '支持私聊、群聊、文档创建、智能表格等企业微信生态能力',
    ],
    guideFooter: '<div style="margin-top:8px;font-size:var(--font-size-xs);color:var(--text-tertiary)">详细教程：<a href="https://work.weixin.qq.com/nl/index/openclaw" target="_blank" style="color:var(--accent);text-decoration:underline">企业微信 × OpenClaw 官方指南</a>。插件使用 WebSocket 长连接，无需公网回调地址。</div>',
    fields: [
      { key: 'botId', label: 'Bot ID', placeholder: '企业微信 AI 机器人 ID', required: true },
      { key: 'secret', label: 'Secret', placeholder: '机器人密钥', secret: true, required: true },
    ],
    pluginRequired: '@sunnoy/wecom',
    pluginId: 'wecom',
  },
  irc: {
    label: 'IRC',
    iconName: 'hash',
    desc: '接入 IRC 服务器频道，支持主流 IRC 网络',
    guide: [
      '确定要接入的 IRC 服务器地址和频道',
      '设置机器人昵称，填入下方表单',
      '保存后自动安装 IRC 插件并连接',
    ],
    fields: [
      { key: 'server', label: '服务器', placeholder: 'irc.libera.chat', required: true },
      { key: 'port', label: '端口', placeholder: '6697', required: false },
      { key: 'nick', label: '昵称', placeholder: 'openclaw-bot', required: true },
      { key: 'channel', label: '频道', placeholder: '#mychannel', required: true },
    ],
    pluginRequired: 'openclaw-irc',
    pluginId: 'irc',
  },
  mattermost: {
    label: 'Mattermost',
    iconName: 'message-square',
    desc: '接入 Mattermost 团队协作平台',
    guide: [
      '在 Mattermost 管理后台创建 Bot 账号',
      '获取 Bot Token 和服务器地址',
      '填入下方表单，保存后自动安装插件',
    ],
    fields: [
      { key: 'serverUrl', label: 'Server URL', placeholder: 'https://mattermost.example.com', required: true },
      { key: 'botToken', label: 'Bot Token', placeholder: 'xxxx-xxxx-xxxx', secret: true, required: true },
    ],
    pluginRequired: 'openclaw-mattermost',
    pluginId: 'mattermost',
  },
  teams: {
    label: 'Teams',
    iconName: 'users',
    desc: '接入 Microsoft Teams，通过 Bot Framework 通信',
    guide: [
      '在 <a href="https://dev.teams.microsoft.com/" target="_blank" style="color:var(--accent);text-decoration:underline">Teams Developer Portal</a> 注册 Bot',
      '在 Azure AD 中创建应用注册，获取 App ID 和 Password',
      '填入下方表单，保存后自动安装插件',
    ],
    fields: [
      { key: 'appId', label: 'App ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
      { key: 'appPassword', label: 'App Password', placeholder: '应用密码', secret: true, required: true },
      { key: 'tenantId', label: 'Tenant ID', placeholder: '可选，单租户模式填写', required: false },
    ],
    pluginRequired: 'openclaw-teams',
    pluginId: 'teams',
  },
  line: {
    label: 'LINE',
    iconName: 'smartphone',
    desc: '接入 LINE Messaging API',
    guide: [
      '前往 <a href="https://developers.line.biz/" target="_blank" style="color:var(--accent);text-decoration:underline">LINE Developers</a> 创建 Messaging API Channel',
      '获取 <b>Channel Access Token</b> 和 <b>Channel Secret</b>',
      '填入下方表单，保存后自动安装插件',
    ],
    fields: [
      { key: 'channelAccessToken', label: 'Channel Access Token', placeholder: 'Long-lived token', secret: true, required: true },
      { key: 'channelSecret', label: 'Channel Secret', placeholder: 'Channel secret', secret: true, required: true },
    ],
    pluginRequired: 'openclaw-line',
    pluginId: 'line',
  },
  matrix: {
    label: 'Matrix',
    iconName: 'server',
    desc: '接入 Matrix 去中心化通信协议（Element 等客户端）',
    guide: [
      '在 Matrix homeserver 上创建 Bot 账号',
      '获取 Access Token（可通过 Element 登录后在设置中查看）',
      '填入 Homeserver URL、Access Token 和 Bot 的 User ID',
    ],
    fields: [
      { key: 'homeserverUrl', label: 'Homeserver URL', placeholder: 'https://matrix.org', required: true },
      { key: 'accessToken', label: 'Access Token', placeholder: 'syt_xxxxx', secret: true, required: true },
      { key: 'userId', label: 'User ID', placeholder: '@bot:matrix.org', required: true },
    ],
    pluginRequired: 'openclaw-matrix',
    pluginId: 'matrix',
  },
  twitch: {
    label: 'Twitch',
    iconName: 'tv',
    desc: '接入 Twitch 直播聊天频道',
    guide: [
      '前往 <a href="https://dev.twitch.tv/console" target="_blank" style="color:var(--accent);text-decoration:underline">Twitch Developer Console</a> 注册应用',
      '获取 OAuth Token（可使用 <a href="https://twitchapps.com/tmi/" target="_blank" style="color:var(--accent);text-decoration:underline">TMI Token Generator</a>）',
      '填入 OAuth Token、频道名和 Client ID',
    ],
    fields: [
      { key: 'oauthToken', label: 'OAuth Token', placeholder: 'oauth:xxxxxx', secret: true, required: true },
      { key: 'channel', label: '频道名', placeholder: 'your_channel', required: true },
      { key: 'clientId', label: 'Client ID', placeholder: '可选', required: false },
    ],
    pluginRequired: 'openclaw-twitch',
    pluginId: 'twitch',
  },
}

export async function render() {
  const page = document.createElement('div')
  page.className = 'page'

  page.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">消息渠道</h1>
      <p class="page-desc">支持 20+ 消息渠道接入，包括 QQ、Telegram、Discord、飞书、钉钉、微信、WhatsApp、Slack 等</p>
    </div>
    <div id="platforms-configured" style="margin-bottom:var(--space-lg)"></div>
    <div class="config-section">
      <div class="config-section-title">全部渠道</div>
      <div id="platforms-all" class="platforms-grid"></div>
    </div>
  `

  const state = { configured: [] }
  await loadPlatforms(page, state)

  return page
}

export function cleanup() {}

// ── 数据加载 ──

async function loadPlatforms(page, state) {
  state.pluginStatus = {}
  Object.entries(PLATFORM_REGISTRY).forEach(([pid]) => {
    const cached = _pluginStatusCache.get(pid)
    if (cached && Date.now() - cached.ts < PLUGIN_STATUS_TTL) state.pluginStatus[pid] = cached.value
  })

  const [listRes, runtimeRes, configRes] = await Promise.allSettled([
    api.listConfiguredPlatforms(),
    api.getChannelRuntimeStatus('wechat'),
    api.readOpenclawConfig(),
  ])

  if (listRes.status === 'fulfilled') state.configured = Array.isArray(listRes.value) ? listRes.value : []
  else {
    toast('加载平台列表失败: ' + listRes.reason, 'error')
    state.configured = []
  }

  state.runtimeStatus = {
    wechat: runtimeRes.status === 'fulfilled' ? runtimeRes.value : null,
  }
  state.bindings = configRes.status === 'fulfilled' && Array.isArray(configRes.value?.bindings) ? configRes.value.bindings : []

  renderConfigured(page, state)
  renderAvailable(page, state)
  hydratePluginStatuses(page, state).catch(err => console.warn('[channels] hydrate plugin status failed:', err))
}

async function hydratePluginStatuses(page, state, { force = false } = {}) {
  const targets = Object.entries(PLATFORM_REGISTRY).filter(([, reg]) => reg.pluginRequired)
  const tasks = targets.map(async ([pid, reg]) => {
    const cached = _pluginStatusCache.get(pid)
    if (!force && cached && Date.now() - cached.ts < PLUGIN_STATUS_TTL) {
      state.pluginStatus[pid] = cached.value
      return
    }
    const pluginId = reg.pluginId || pid
    try {
      const status = await api.getChannelPluginStatus(pluginId)
      const next = { installed: !!status?.installed, builtin: !!status?.builtin }
      _pluginStatusCache.set(pid, { ts: Date.now(), value: next })
      state.pluginStatus[pid] = next
    } catch {
      const next = { installed: false, builtin: false }
      _pluginStatusCache.set(pid, { ts: Date.now(), value: next })
      state.pluginStatus[pid] = next
    }
  })
  await Promise.allSettled(tasks)
  if (!page.isConnected) return
  renderAvailable(page, state)
}

// ── 已配置平台渲染 ──

function renderConfigured(page, state) {
  const el = page.querySelector('#platforms-configured')
  if (!state.configured.length) {
    el.innerHTML = ''
    return
  }

  el.innerHTML = `
    <div class="config-section">
      <div class="config-section-title">已接入</div>
      <div class="platforms-grid">
        ${state.configured.map(p => {
          const reg = PLATFORM_REGISTRY[p.id]
          const label = reg?.label || p.id
          const ic = icon(reg?.iconName || 'radio', 22)
          const runtime = state.runtimeStatus?.[p.id] || null
          const channelKey = getChannelBindingKey(p.id)
          const allBindings = (state.bindings || []).filter(b => b.match?.channel === channelKey)
          const boundAgents = allBindings.map(b => b.agentId || 'main')
          // 只有一个 main 绑定时不显示标签（默认行为），多绑定时全部显示
          const showAll = boundAgents.length > 1 || (boundAgents.length === 1 && boundAgents[0] !== 'main')
          const agentBadges = showAll ? boundAgents.map(a =>
            `<span style="font-size:var(--font-size-xs);color:var(--accent);background:var(--accent-muted);padding:1px 6px;border-radius:10px;white-space:nowrap">→ ${escapeAttr(a)}</span>`
          ).join(' ') : ''
          const subStatus = p.id === 'wechat'
            ? `<div style="margin-top:6px;font-size:var(--font-size-xs);color:var(--text-secondary)">${escapeAttr(runtime?.message || (runtime?.connected ? '微信已接入' : '微信状态未知'))}${runtime?.accountCount ? ` · 已登录 ${Number(runtime.accountCount || 0)} 个账号` : ''}</div>`
            : ''
          const runtimeOnlyHint = p.runtimeOnly
            ? `<div style="margin-top:4px;font-size:var(--font-size-xs);color:var(--accent)">当前为运行态接入，状态来自腾讯官方原生微信插件</div>`
            : ''
          return `
            <div class="platform-card ${p.enabled ? 'active' : 'inactive'}" data-pid="${p.id}">
              <div class="platform-card-header">
                <span class="platform-emoji">${ic}</span>
                <span class="platform-name">${label}</span>
                ${agentBadges}
                <span class="platform-status-dot ${p.enabled ? 'on' : 'off'}"></span>
              </div>
              ${subStatus}
              ${runtimeOnlyHint}
              <div class="platform-card-actions">
                <button class="btn btn-sm btn-secondary" data-action="edit">${icon('edit', 14)} 编辑</button>
                <button class="btn btn-sm btn-secondary" data-action="toggle">${p.enabled ? icon('pause', 14) + ' 禁用' : icon('play', 14) + ' 启用'}</button>
                <button class="btn btn-sm btn-danger" data-action="remove">${icon('trash', 14)}</button>
              </div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `

  // 绑定事件
  el.querySelectorAll('.platform-card').forEach(card => {
    const pid = card.dataset.pid
    card.querySelector('[data-action="edit"]').onclick = async (e) => {
      const btn = e.currentTarget
      const prev = btn.innerHTML
      btn.disabled = true
      btn.innerHTML = `${icon('loader', 14)} 打开中...`
      try {
        await openConfigDialog(pid, page, state)
      } finally {
        btn.disabled = false
        btn.innerHTML = prev
      }
    }
    const toggleBtn = card.querySelector('[data-action="toggle"]')
    const removeBtn = card.querySelector('[data-action="remove"]')
    if (toggleBtn) toggleBtn.onclick = async () => {
      const cur = state.configured.find(p => p.id === pid)
      if (!cur) return
      try {
        await api.toggleMessagingPlatform(pid, !cur.enabled)
        toast(`${PLATFORM_REGISTRY[pid]?.label || pid} 已${cur.enabled ? '禁用' : '启用'}`, 'success')
        await loadPlatforms(page, state)
      } catch (e) { toast('操作失败: ' + e, 'error') }
    }
    if (removeBtn) removeBtn.onclick = async () => {
      const yes = await showConfirm(`确定移除 ${PLATFORM_REGISTRY[pid]?.label || pid}？配置将被删除。`)
      if (!yes) return
      try {
        await api.removeMessagingPlatform(pid)
        toast('已移除', 'info')
        await loadPlatforms(page, state)
      } catch (e) { toast('移除失败: ' + e, 'error') }
    }
  })
}

// ── 可接入平台渲染 ──

function renderAvailable(page, state) {
  const configuredIds = new Set(state.configured.map(p => p.id))
  const entries = Object.entries(PLATFORM_REGISTRY)
  const container = page.querySelector('#platforms-all')

  container.innerHTML = entries.map(([pid, reg]) => {
    const done = configuredIds.has(pid)
    const runtime = state.runtimeStatus?.[pid] || null
    const needsPlugin = !!reg.pluginRequired
    const pluginState = state.pluginStatus[pid]
    const pluginKnown = !needsPlugin || !!pluginState
    const pluginOk = !needsPlugin || pluginState?.installed || pluginState?.builtin

    let badge = ''
    let actionLabel = ''
    if (done || runtime?.connected) {
      badge = `<span class="channel-badge channel-badge-active">${icon('check', 12)} 已接入</span>`
      actionLabel = pid === 'wechat' ? '查看接入状态' : '绑定 Agent'
    } else if (pid === 'wechat' && runtime?.installed) {
      badge = `<span class="channel-badge channel-badge-installed">${icon('package', 12)} 已安装${runtime?.pendingQr ? ' · 待扫码' : ''}</span>`
      actionLabel = '查看登录状态'
    } else if (!pluginKnown) {
      badge = `<span class="channel-badge channel-badge-builtin">${icon('loader', 12)} 检测中</span>`
      actionLabel = '加载中'
    } else if (!needsPlugin || pluginOk) {
      badge = needsPlugin
        ? `<span class="channel-badge channel-badge-installed">${icon('package', 12)} 已安装</span>`
        : `<span class="channel-badge channel-badge-builtin">内置</span>`
      actionLabel = '配置接入'
    } else {
      badge = `<span class="channel-badge channel-badge-notinstalled">未安装</span>`
      actionLabel = '安装插件'
    }

    return `
      <button class="platform-pick" data-pid="${pid}">
        <span class="platform-emoji">${icon(reg.iconName, 28)}</span>
        <span class="platform-pick-name">${reg.label}</span>
        <span class="platform-pick-desc">${reg.desc}</span>
        <span class="platform-pick-footer">
          ${badge}
          <span class="platform-pick-action">${actionLabel} →</span>
        </span>
      </button>
    `
  }).join('')

  container.querySelectorAll('.platform-pick').forEach(btn => {
    const pid = btn.dataset.pid
    const done = configuredIds.has(pid)
    const runtime = state.runtimeStatus?.[pid] || null
    const reg = PLATFORM_REGISTRY[pid]
    const needsPlugin = !!reg?.pluginRequired
    const pluginState = state.pluginStatus[pid]
    const pluginKnown = !needsPlugin || !!pluginState
    const pluginOk = !needsPlugin || pluginState?.installed || pluginState?.builtin

    btn.onclick = () => {
      if (!pluginKnown && !done && !runtime?.connected) return
      if (done || runtime?.connected || (pid === 'wechat' && runtime?.installed)) {
        openBindAgentDialog(pid, page, state)
      } else if (!pluginOk) {
        openInstallDialog(pid, page, state)
      } else {
        openConfigDialog(pid, page, state)
      }
    }
  })
}

// ── 快速绑定 Agent 弹窗（已接入平台专用） ──

async function openBindAgentDialog(pid, page, state) {
  const reg = PLATFORM_REGISTRY[pid]
  if (!reg) return
  if (pid === 'wechat') {
    openConfigDialog(pid, page, state)
    return
  }
  let agents = []
  try { agents = await api.listAgents() } catch {}
  if (!Array.isArray(agents)) agents = []

  const channelKey = getChannelBindingKey(pid)
  const existingBindings = (state.bindings || []).filter(b => b.match?.channel === channelKey)
  const boundIds = new Set(existingBindings.map(b => b.agentId || 'main'))

  const availableAgents = agents.filter(a => !boundIds.has(a.id))
  if (!availableAgents.length) {
    toast('所有 Agent 都已绑定到该渠道', 'info')
    return
  }

  const agentOptions = availableAgents.map(a => {
    const label = a.identityName ? a.identityName.split(',')[0].trim() : a.id
    return `<option value="${escapeAttr(a.id)}">${a.id}${a.id !== label ? ' — ' + label : ''}</option>`
  }).join('')

  const modal = showContentModal({
    title: `为 ${reg.label} 绑定新 Agent`,
    content: `
      <div style="margin-bottom:var(--space-md)">
        <div class="form-hint" style="margin-bottom:var(--space-sm)">已绑定: ${[...boundIds].join(', ') || '无'}</div>
        <label class="form-label">选择要绑定的 Agent</label>
        <select class="form-input" id="bind-agent-select">${agentOptions}</select>
        <div class="form-hint" style="margin-top:4px">该渠道的消息将路由到选中的 Agent 处理</div>
      </div>
    `,
    buttons: [
      { label: '绑定', className: 'btn btn-primary', id: 'btn-bind-agent' },
    ],
    width: 400,
  })

  modal.querySelector('#btn-bind-agent').onclick = async () => {
    const agentId = modal.querySelector('#bind-agent-select')?.value
    if (!agentId) { toast('请选择 Agent', 'warning'); return }
    try {
      await saveChannelBinding(pid, agentId)
      toast(`已将 ${reg.label} 绑定到 Agent「${agentId}」`, 'success')
      modal.close?.() || modal.remove?.()
      await loadPlatforms(page, state)
    } catch (e) {
      toast('绑定失败: ' + e, 'error')
    }
  }
}

// ── 插件安装弹窗（安装成功后自动打开配置） ──

async function openInstallDialog(pid, page, state) {
  const reg = PLATFORM_REGISTRY[pid]
  if (!reg || !reg.pluginRequired) return

  let pluginPackage = reg.pluginRequired
  let pluginId = reg.pluginId || pid

  // 飞书特殊处理
  if (pid === 'feishu') {
    const savedVersion = localStorage.getItem('clawpanel-feishu-plugin-version') || 'builtin'
    if (savedVersion === 'official') {
      pluginPackage = 'openclaw-lark'
      pluginId = 'openclaw-lark'
    }
  }

  const guideHtml = reg.guide?.length ? `
    <ol style="margin:0 0 var(--space-md);padding-left:20px;font-size:var(--font-size-sm);color:var(--text-secondary);line-height:1.8">
      ${reg.guide.map(s => `<li>${s}</li>`).join('')}
    </ol>
    ${reg.guideFooter || ''}
  ` : ''

  const modal = showContentModal({
    title: `安装 ${reg.label}`,
    content: `
      <div style="margin-bottom:var(--space-md)">
        <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-md)">
          <span>${icon(reg.iconName, 32)}</span>
          <div>
            <div style="font-weight:600">${reg.label}</div>
            <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">${reg.desc}</div>
          </div>
        </div>
        ${guideHtml}
      </div>
      <div id="install-progress-area"></div>
    `,
    buttons: [
      { label: '开始安装', className: 'btn btn-primary', id: 'btn-start-install' },
    ],
    width: 500,
  })

  // 外部链接用系统浏览器打开
  modal.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]')
    if (!a) return
    const href = a.getAttribute('href')
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      e.preventDefault()
      import('@tauri-apps/plugin-shell').then(({ open }) => open(href)).catch(() => window.open(href, '_blank'))
    }
  })

  const btnInstall = modal.querySelector('#btn-start-install')
  const progressArea = modal.querySelector('#install-progress-area')

  btnInstall.onclick = async () => {
    btnInstall.disabled = true
    btnInstall.textContent = '安装中...'

    progressArea.innerHTML = `
      <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          ${icon('download', 14)}
          <span style="font-size:var(--font-size-sm);font-weight:600">安装插件</span>
          <span id="install-pct" style="font-size:var(--font-size-xs);color:var(--text-tertiary);margin-left:auto">0%</span>
        </div>
        <div style="height:4px;background:var(--bg-secondary);border-radius:2px;overflow:hidden;margin-bottom:8px">
          <div id="install-bar" style="height:100%;background:var(--accent);width:0%;transition:width 0.3s"></div>
        </div>
        <div id="install-log" style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);max-height:150px;overflow-y:auto;line-height:1.6;white-space:pre-wrap;word-break:break-all"></div>
      </div>
    `
    const logBox = progressArea.querySelector('#install-log')
    const bar = progressArea.querySelector('#install-bar')
    const pct = progressArea.querySelector('#install-pct')
    const updateProgress = (v) => { bar.style.width = v + '%'; pct.textContent = v + '%' }
    const appendLog = (line) => { logBox.textContent += line + '\n'; logBox.scrollTop = logBox.scrollHeight }

    let success = false
    const isTauriEnv = !!window.__TAURI_INTERNALS__

    if (isTauriEnv) {
      let unlistenLog, unlistenProgress
      try {
        const { listen } = await import('@tauri-apps/api/event')
        unlistenLog = await listen('plugin-log', (e) => appendLog(e.payload))
        unlistenProgress = await listen('plugin-progress', (e) => updateProgress(e.payload))
      } catch {}
      try {
        if (pid === 'qqbot') await api.installQqbotPlugin()
        else await api.installChannelPlugin(pluginPackage, pluginId)
        success = true
      } catch (e) {
        appendLog('安装失败: ' + e)
      }
      if (unlistenLog) unlistenLog()
      if (unlistenProgress) unlistenProgress()
    } else {
      try {
        await new Promise((resolve, reject) => {
          const handle = api.installChannelPluginStream(pluginPackage, pluginId, {
            onLog: (line) => appendLog(line),
            onProgress: (v) => updateProgress(v),
            onDone: () => resolve(),
            onError: (err) => reject(new Error(err.message || '安装失败')),
          })
          setTimeout(() => { handle.close(); reject(new Error('安装超时')) }, 120000)
        })
        success = true
      } catch (e) {
        appendLog('安装失败: ' + e.message)
      }
    }

    if (success) {
      // 验证安装是否成功
      let verified = false
      try {
        const status = await api.getChannelPluginStatus(pluginId)
        verified = !!status?.installed || !!status?.builtin
      } catch {}

      if (verified) {
        state.pluginStatus[pid] = { installed: true, builtin: false }
        const hasConfigFields = Array.isArray(reg.fields) && reg.fields.length > 0

        progressArea.innerHTML = `
          <div style="background:var(--success-muted);color:var(--success);padding:12px 14px;border-radius:var(--radius-md);font-size:var(--font-size-sm);display:flex;align-items:center;gap:8px">
            ${icon('check', 16)} 安装成功！
          </div>
        `
        await loadPlatforms(page, state)
        btnInstall.textContent = pid === 'wechat' ? '查看登录指引' : (hasConfigFields ? '继续配置' : '完成')
        btnInstall.disabled = false
        btnInstall.className = 'btn btn-primary'
        btnInstall.onclick = () => {
          modal.close?.() || modal.remove?.()
          if (pid === 'wechat' || hasConfigFields) {
            openConfigDialog(pid, page, state)
          }
        }
      } else {
        progressArea.innerHTML += `
          <div style="background:var(--warning-muted, #fef3c7);color:var(--warning, #d97706);padding:10px 14px;border-radius:var(--radius-md);font-size:var(--font-size-sm);margin-top:var(--space-sm)">
            ${icon('alert-triangle', 14)} 安装命令已执行，但未检测到插件。请检查终端输出或手动安装后重试。
          </div>
        `
        btnInstall.textContent = '重试安装'
        btnInstall.disabled = false
        btnInstall.onclick = () => {
          modal.close?.() || modal.remove?.()
          openInstallDialog(pid, page, state)
        }
      }
    } else {
      toast('插件安装失败，请检查网络或手动安装', 'error')
      btnInstall.textContent = '重试安装'
      btnInstall.disabled = false
    }
  }
}

// ── 配置弹窗（新增 / 编辑共用） ──

async function openConfigDialog(pid, page, state) {
  const reg = PLATFORM_REGISTRY[pid]
  if (!reg) { toast('未知平台', 'error'); return }

  // 尝试加载已有配置
  let existing = {}
  let isEdit = false
  let agents = []
  let currentBinding = ''
  const runtime = state.runtimeStatus?.[pid] || null
  try {
    const [platformRes, agentList] = await Promise.all([
      api.readPlatformConfig(pid).catch(() => null),
      api.listAgents().catch(() => []),
    ])
    if (platformRes?.values) existing = platformRes.values
    if (platformRes?.exists) isEdit = true
    agents = Array.isArray(agentList) ? agentList : []
  } catch {}

  try {
    const bindings = Array.isArray(state.bindings) ? state.bindings : []
    const channelKey = getChannelBindingKey(pid)
    const found = bindings.find(b => b.match?.channel === channelKey)
    if (found) currentBinding = found.agentId || ''
  } catch {}

  const formId = 'platform-form-' + Date.now()

  // Agent 绑定选择器
  const agentOptions = agents.map(a => {
    const label = a.identityName ? a.identityName.split(',')[0].trim() : a.id
    return `<option value="${escapeAttr(a.id)}" ${a.id === currentBinding ? 'selected' : ''}>${a.id}${a.id !== label ? ' — ' + label : ''}</option>`
  }).join('')
  const supportsMultiAccount = ['feishu', 'dingtalk', 'dingtalk-connector'].includes(pid)
  const accountIdHtml = supportsMultiAccount ? `
    <div class="form-group">
      <label class="form-label">账号标识（多账号模式）</label>
      <input class="form-input" name="__accountId" placeholder="如 sales、support（留空则为默认账号）" value="">
      <div class="form-hint">为同一平台接入多个应用时，每个应用需要一个唯一的账号标识。不同账号可绑定不同 Agent</div>
    </div>
  ` : ''
  const agentBindingHtml = `
    ${accountIdHtml}
    <div class="form-group">
      <label class="form-label">绑定 Agent</label>
      <select class="form-input" name="__agentBinding">
        <option value="" ${!currentBinding ? 'selected' : ''}>默认（main）</option>
        ${agentOptions}
      </select>
      <div class="form-hint">选择该渠道消息路由到哪个 Agent 处理。留空则使用默认 Agent（main）</div>
    </div>
  `

  // 飞书编辑弹窗优先复用已保存/本地选择，避免每次打开都额外探测插件状态
  if (pid === 'feishu' && !existing.pluginVersion) {
    existing.pluginVersion = localStorage.getItem('clawpanel-feishu-plugin-version') || 'builtin'
  }
  if (pid === 'wechat' && runtime && (runtime.connected || runtime.installed || runtime.pendingQr)) {
    isEdit = true
  }

  const fieldsHtml = reg.fields.map((f, i) => {
    const val = existing[f.key] || ''
    if (f.type === 'select' && f.options) {
      return `
        <div class="form-group">
          <label class="form-label">${f.label}${f.required ? ' *' : ''}</label>
          <select class="form-input" name="${f.key}" data-name="${f.key}">
            ${f.options.map(o => `<option value="${o.value}" ${val === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
      `
    }
    return `
      <div class="form-group">
        <label class="form-label">${f.label}${f.required ? ' *' : ''}</label>
        <div style="display:flex;gap:8px">
          <input class="form-input" name="${f.key}" type="${f.secret ? 'password' : 'text'}"
                 value="${escapeAttr(val)}" placeholder="${f.placeholder || ''}"
                 ${i === 0 ? 'autofocus' : ''} style="flex:1">
          ${f.secret ? `<button type="button" class="btn btn-sm btn-secondary toggle-vis" data-field="${f.key}">显示</button>` : ''}
        </div>
      </div>
    `
  }).join('')

  const guideHtml = reg.guide?.length ? `
    <details style="background:var(--bg-tertiary);padding:12px 16px;border-radius:var(--radius-md);margin-bottom:var(--space-md)">
      <summary style="font-weight:600;font-size:var(--font-size-sm);cursor:pointer;user-select:none">接入步骤 <span style="color:var(--text-tertiary);font-weight:400">（点击展开）</span></summary>
      <ol style="margin:8px 0 0;padding-left:20px;font-size:var(--font-size-sm);color:var(--text-secondary);line-height:1.8">
        ${reg.guide.map(s => `<li>${s}</li>`).join('')}
      </ol>
      ${reg.guideFooter || ''}
    </details>
  ` : ''
  const runtimeStatusHtml = pid === 'wechat' ? `
    <div style="background:${runtime?.connected ? 'var(--success-muted)' : 'var(--bg-tertiary)'};color:${runtime?.connected ? 'var(--success)' : 'var(--text-secondary)'};padding:10px 14px;border-radius:var(--radius-md);font-size:var(--font-size-sm);margin-bottom:var(--space-md)">
      ${icon(runtime?.connected ? 'check' : 'info', 14)}
      ${escapeAttr(runtime?.message || '微信状态未知')}
      ${(runtime?.botId || runtime?.userId) ? `<div style="margin-top:6px;font-size:12px;color:var(--text-secondary)">Bot: ${escapeAttr(runtime?.botId || '-')}<br>User: ${escapeAttr(runtime?.userId || '-')}</div>` : ''}
      ${runtime?.loginCommand ? `<div style="margin-top:6px;font-size:12px;color:var(--text-secondary)">扫码命令: <code>${escapeAttr(runtime.loginCommand)}</code></div>` : ''}
      ${runtime?.pluginError ? `<div style="margin-top:6px;font-size:12px;color:var(--error)">插件错误: ${escapeAttr(runtime.pluginError)}</div>` : ''}
    </div>
  ` : ''
  const wechatQrHtml = pid === 'wechat' ? `
    <div id="wechat-qr-panel" style="background:var(--bg-tertiary);padding:12px 14px;border-radius:var(--radius-md);margin-bottom:var(--space-md)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
        <div style="font-weight:600;font-size:var(--font-size-sm)">扫码绑定微信</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-sm btn-primary" id="btn-wechat-start-qr">${runtime?.connected ? '重新绑定' : '生成二维码'}</button>
          <button type="button" class="btn btn-sm btn-secondary" id="btn-wechat-check-qr" disabled>检查状态</button>
        </div>
      </div>
      <div id="wechat-qr-status" style="font-size:var(--font-size-xs);color:var(--text-secondary);line-height:1.7">安装插件后可以直接在这里生成二维码并扫码绑定，不需要再手敲终端命令。</div>
      <div id="wechat-qr-view" style="display:none;margin-top:12px;text-align:center">
        <img id="wechat-qr-image" alt="微信登录二维码" style="width:260px;max-width:100%;border-radius:16px;border:1px solid var(--border-primary);background:#fff;padding:10px">
        <div id="wechat-qr-link" style="margin-top:8px;font-size:12px;color:var(--text-secondary);word-break:break-all"></div>
      </div>
    </div>
  ` : ''

  const pairingHtml = reg.pairingChannel ? `
    <div style="margin-top:var(--space-md);padding:12px 14px;background:var(--bg-tertiary);border-radius:var(--radius-md)">
      <div style="font-weight:600;font-size:var(--font-size-sm);margin-bottom:6px">配对审批</div>
      <div style="font-size:var(--font-size-xs);color:var(--text-secondary);line-height:1.7;margin-bottom:8px">当机器人提示 <code>access not configured</code>、<code>Pairing code</code> 或要求执行 <code>openclaw pairing approve</code> 时，可直接在这里完成批准。</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input class="form-input" name="pairingCode" placeholder="例如 R3ZFPWZP" style="flex:1;min-width:180px">
        <button type="button" class="btn btn-sm btn-secondary" id="btn-pairing-list">查看待审批</button>
        <button type="button" class="btn btn-sm btn-primary" id="btn-pairing-approve">批准配对码</button>
      </div>
      <div id="pairing-result" style="margin-top:8px"></div>
    </div>
  ` : ''

  const content = `
    ${runtimeStatusHtml}
    ${wechatQrHtml}
    ${guideHtml}
    ${!isEdit && (existing.gatewayToken || existing.gatewayPassword) ? `<div style="background:var(--bg-tertiary);color:var(--text-secondary);padding:8px 14px;border-radius:var(--radius-md);font-size:var(--font-size-sm);margin-bottom:var(--space-md)">已从当前 Gateway 鉴权配置中自动带出 ${existing.gatewayToken ? 'Token' : 'Password'}，通常无需手填</div>` : ''}
    ${isEdit ? `<div style="background:var(--accent-muted);color:var(--accent);padding:8px 14px;border-radius:var(--radius-md);font-size:var(--font-size-sm);margin-bottom:var(--space-md)">当前已有配置，修改后点击保存即可覆盖</div>` : ''}
    <form id="${formId}">
      ${fieldsHtml}
      ${agentBindingHtml}
    </form>
    ${pairingHtml}
    <div id="verify-result" style="margin-top:var(--space-sm)"></div>
  `

  const modal = showContentModal({
    title: `${isEdit ? '编辑' : '接入'} ${reg.label}`,
    content,
    buttons: [
      { label: '校验凭证', className: 'btn btn-secondary', id: 'btn-verify' },
      { label: isEdit ? '保存' : '接入并保存', className: 'btn btn-primary', id: 'btn-save' },
    ],
    width: 520,
  })

  // 外部链接用系统浏览器打开
  modal.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]')
    if (!a) return
    const href = a.getAttribute('href')
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      e.preventDefault()
      import('@tauri-apps/plugin-shell').then(({ open }) => open(href)).catch(() => window.open(href, '_blank'))
    }
  })

  // 密码显隐
  modal.querySelectorAll('.toggle-vis').forEach(btn => {
    btn.onclick = () => {
      const input = modal.querySelector(`input[name="${btn.dataset.field}"]`)
      if (!input) return
      const show = input.type === 'password'
      input.type = show ? 'text' : 'password'
      btn.textContent = show ? '隐藏' : '显示'
    }
  })

  // 收集表单值
  const collectForm = () => {
    const obj = {}
    reg.fields.forEach(f => {
      const el = modal.querySelector(`input[name="${f.key}"]`) || modal.querySelector(`select[name="${f.key}"]`)
      if (el) obj[f.key] = el.value.trim()
    })
    return obj
  }

  // 校验按钮
  const btnVerify = modal.querySelector('#btn-verify')
  const btnSave = modal.querySelector('#btn-save')
  const resultEl = modal.querySelector('#verify-result')
  const pairingInput = modal.querySelector('input[name="pairingCode"]')
  const pairingResultEl = modal.querySelector('#pairing-result')
  const btnPairingList = modal.querySelector('#btn-pairing-list')
  const btnPairingApprove = modal.querySelector('#btn-pairing-approve')
  const btnWechatStartQr = modal.querySelector('#btn-wechat-start-qr')
  const btnWechatCheckQr = modal.querySelector('#btn-wechat-check-qr')
  const wechatQrStatusEl = modal.querySelector('#wechat-qr-status')
  const wechatQrViewEl = modal.querySelector('#wechat-qr-view')
  const wechatQrImageEl = modal.querySelector('#wechat-qr-image')
  const wechatQrLinkEl = modal.querySelector('#wechat-qr-link')
  let wechatQrSessionKey = ''
  let wechatQrPolling = false
  let wechatQrStopped = false

  const setWechatQrStatus = (text, tone = '') => {
    if (!wechatQrStatusEl) return
    const color = tone === 'error'
      ? 'var(--error)'
      : tone === 'success'
        ? 'var(--success)'
        : tone === 'accent'
          ? 'var(--accent)'
          : 'var(--text-secondary)'
    wechatQrStatusEl.innerHTML = `<span style="color:${color}">${escapeAttr(text)}</span>`
  }
  const showWechatQr = async (qrUrl) => {
    if (!wechatQrViewEl || !wechatQrImageEl || !wechatQrLinkEl) return
    if (!qrUrl) {
      wechatQrViewEl.style.display = 'none'
      wechatQrImageEl.removeAttribute('src')
      wechatQrLinkEl.innerHTML = ''
      return
    }
    let renderedSrc = qrUrl
    try {
      renderedSrc = qrUrl.startsWith('data:image/')
        ? qrUrl
        : await QRCode.toDataURL(qrUrl, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: 'M',
        })
    } catch (e) {
      console.warn('[channels] render wechat qr failed:', e)
    }
    wechatQrViewEl.style.display = 'block'
    wechatQrImageEl.src = renderedSrc
    wechatQrLinkEl.innerHTML = `二维码链接：<a href="${escapeAttr(qrUrl)}" target="_blank" style="color:var(--accent);text-decoration:underline">${escapeAttr(qrUrl)}</a>`
  }
  const stopWechatQrPolling = () => {
    wechatQrStopped = true
    wechatQrPolling = false
  }
  const pollWechatQrStatus = async () => {
    if (wechatQrPolling || wechatQrStopped || !wechatQrSessionKey || !modal.isConnected) return
    wechatQrPolling = true
    try {
      const res = await api.waitWechatQrLogin(wechatQrSessionKey, 1200)
      if (wechatQrStopped || !modal.isConnected) return
      if (res?.qrDataUrl) await showWechatQr(res.qrDataUrl)
      if (res?.message) {
        const tone = res?.connected ? 'success' : (res?.expired ? 'error' : (res?.scanned ? 'accent' : ''))
        setWechatQrStatus(res.message, tone)
      }
      if (res?.connected) {
        btnWechatCheckQr && (btnWechatCheckQr.disabled = true)
        btnWechatStartQr && (btnWechatStartQr.textContent = '重新绑定')
        toast('微信绑定成功', 'success')
        await loadPlatforms(page, state)
        return
      }
    } catch (e) {
      setWechatQrStatus(`扫码状态检查失败: ${String(e)}`, 'error')
    } finally {
      wechatQrPolling = false
    }
    if (!wechatQrStopped && modal.isConnected && wechatQrSessionKey) {
      setTimeout(() => { pollWechatQrStatus().catch(() => {}) }, 1500)
    }
  }

  if (btnWechatStartQr && pid === 'wechat') {
    btnWechatStartQr.onclick = async () => {
      btnWechatStartQr.disabled = true
      btnWechatCheckQr && (btnWechatCheckQr.disabled = true)
      btnSave.disabled = true
      btnVerify.disabled = true
      btnWechatStartQr.textContent = '生成中...'
      try {
        const form = collectForm()
        const accountId = modal.querySelector('input[name="__accountId"]')?.value?.trim() || null
        const selectedAgent = modal.querySelector('select[name="__agentBinding"]')?.value || ''
        await api.saveMessagingPlatform(pid, form, accountId)
        await saveChannelBinding(pid, selectedAgent, null, accountId)
        const startRes = await api.startWechatQrLogin(true)
        wechatQrStopped = false
        wechatQrSessionKey = startRes?.sessionKey || ''
        await showWechatQr(startRes?.qrDataUrl || '')
        setWechatQrStatus(startRes?.message || '二维码已生成，请扫码。', 'accent')
        btnWechatStartQr.textContent = '刷新二维码'
        btnWechatCheckQr && (btnWechatCheckQr.disabled = !wechatQrSessionKey)
        await loadPlatforms(page, state)
        pollWechatQrStatus().catch(() => {})
      } catch (e) {
        setWechatQrStatus(`生成二维码失败: ${String(e)}`, 'error')
        await showWechatQr('')
        btnWechatStartQr.textContent = runtime?.connected ? '重新绑定' : '生成二维码'
      } finally {
        btnWechatStartQr.disabled = false
        btnSave.disabled = false
        btnVerify.disabled = false
      }
    }
  }

  if (btnWechatCheckQr && pid === 'wechat') {
    btnWechatCheckQr.onclick = () => {
      if (!wechatQrSessionKey) {
        toast('请先生成二维码', 'warning')
        return
      }
      pollWechatQrStatus().catch(() => {})
    }
  }

  if (btnPairingList && pairingResultEl) {
    btnPairingList.onclick = async () => {
      btnPairingList.disabled = true
      btnPairingList.textContent = '读取中...'
      pairingResultEl.innerHTML = ''
      try {
        const output = await api.pairingListChannel(reg.pairingChannel)
        pairingResultEl.innerHTML = `
          <div style="background:var(--bg-secondary);border:1px solid var(--border-primary);border-radius:var(--radius-md);padding:10px 12px">
            <div style="font-size:var(--font-size-xs);color:var(--text-tertiary);margin-bottom:6px">待审批请求</div>
            <pre style="margin:0;white-space:pre-wrap;word-break:break-word;font-size:12px;color:var(--text-secondary);font-family:var(--font-mono)">${escapeAttr(output || '暂无待审批请求')}</pre>
          </div>`
      } catch (e) {
        pairingResultEl.innerHTML = `<div style="color:var(--error);font-size:var(--font-size-sm)">读取失败: ${escapeAttr(String(e))}</div>`
      } finally {
        btnPairingList.disabled = false
        btnPairingList.textContent = '查看待审批'
      }
    }
  }

  if (btnPairingApprove && pairingInput && pairingResultEl) {
    btnPairingApprove.onclick = async () => {
      const code = pairingInput.value.trim().toUpperCase()
      if (!code) {
        toast('请输入配对码', 'warning')
        pairingInput.focus()
        return
      }
      btnPairingApprove.disabled = true
      btnPairingApprove.textContent = '批准中...'
      pairingResultEl.innerHTML = ''
      try {
        const output = await api.pairingApproveChannel(reg.pairingChannel, code, !!reg.pairingNotify)
        pairingResultEl.innerHTML = `
          <div style="background:var(--success-muted);color:var(--success);padding:10px 14px;border-radius:var(--radius-md);font-size:var(--font-size-sm)">
            ${icon('check', 14)} 配对已批准
            <div style="margin-top:6px;font-size:12px;white-space:pre-wrap;word-break:break-word;color:var(--text-secondary)">${escapeAttr(output || '操作完成')}</div>
          </div>`
        pairingInput.value = ''
        toast('配对已批准', 'success')
      } catch (e) {
        pairingResultEl.innerHTML = `<div style="background:var(--error-muted, #fee2e2);color:var(--error);padding:10px 14px;border-radius:var(--radius-md);font-size:var(--font-size-sm)">批准失败: ${escapeAttr(String(e))}</div>`
      } finally {
        btnPairingApprove.disabled = false
        btnPairingApprove.textContent = '批准配对码'
      }
    }
  }

  btnVerify.onclick = async () => {
    const form = collectForm()
    // 前端基础检查
    for (const f of reg.fields) {
      if (f.required && !form[f.key]) {
        toast(`请填写「${f.label}」`, 'warning')
        return
      }
    }
    btnVerify.disabled = true
    btnVerify.textContent = '校验中...'
    resultEl.innerHTML = ''
    try {
      const res = await api.verifyBotToken(pid, form)
      if (res.valid) {
        const details = (res.details || []).join(' · ')
        resultEl.innerHTML = `
          <div style="background:var(--success-muted);color:var(--success);padding:10px 14px;border-radius:var(--radius-md);font-size:var(--font-size-sm)">
            ${icon('check', 14)} 凭证有效${details ? ' — ' + details : ''}
          </div>`
      } else {
        const errs = (res.errors || ['校验失败']).join('<br>')
        resultEl.innerHTML = `
          <div style="background:var(--error-muted, #fee2e2);color:var(--error);padding:10px 14px;border-radius:var(--radius-md);font-size:var(--font-size-sm)">
            ${icon('x', 14)} ${errs}
          </div>`
      }
    } catch (e) {
      resultEl.innerHTML = `<div style="color:var(--error);font-size:var(--font-size-sm)">校验请求失败: ${e}</div>`
    } finally {
      btnVerify.disabled = false
      btnVerify.textContent = '校验凭证'
    }
  }

  // 保存按钮
  btnSave.onclick = async () => {
    const form = collectForm()
    for (const f of reg.fields) {
      if (f.required && !form[f.key]) {
        toast(`请填写「${f.label}」`, 'warning')
        return
      }
    }
    btnSave.disabled = true
    btnVerify.disabled = true
    btnSave.textContent = '保存中...'

    try {
      // 插件检查：如果需要插件但未安装，提示先安装
      if (reg.pluginRequired) {
        let pluginId = reg.pluginId || pid
        if (pid === 'feishu') {
          const pluginVersionField = modal.querySelector('[data-name="pluginVersion"]')
          const pluginVersion = pluginVersionField?.value || 'builtin'
          localStorage.setItem('clawpanel-feishu-plugin-version', pluginVersion)
          if (pluginVersion === 'official') pluginId = 'openclaw-lark'
        }
        const pluginStatus = await api.getChannelPluginStatus(pluginId)
        if (!pluginStatus?.installed && !pluginStatus?.builtin) {
          toast('请先安装插件后再配置', 'warning')
          btnSave.disabled = false
          btnVerify.disabled = false
          btnSave.textContent = isEdit ? '保存' : '接入并保存'
          return
        }
      }

      // 写入配置（多账号模式传 accountId）
      btnSave.textContent = '写入配置...'
      const accountId = modal.querySelector('input[name="__accountId"]')?.value?.trim() || null
      await api.saveMessagingPlatform(pid, form, accountId)

      // 写入 Agent 绑定到 openclaw.json bindings（多账号时 binding.match 包含 accountId）
      const selectedAgent = modal.querySelector('select[name="__agentBinding"]')?.value || ''
      try {
        await saveChannelBinding(pid, selectedAgent, null, accountId)
      } catch (e) {
        console.warn('[channels] 保存 Agent 绑定失败:', e)
      }

      toast(`${reg.label} 配置已保存，Gateway 正在重载`, 'success')
      modal.close?.() || modal.remove?.()
      await loadPlatforms(page, state)
    } catch (e) {
      toast('保存失败: ' + e, 'error')
    } finally {
      btnSave.disabled = false
      btnVerify.disabled = false
      btnSave.textContent = isEdit ? '保存' : '接入并保存'
    }
  }

  const originalClose = modal.close?.bind(modal)
  if (originalClose) {
    modal.close = (...args) => {
      stopWechatQrPolling()
      return originalClose(...args)
    }
  }
}

/** 将平台 ID 映射为 openclaw bindings 中的 channel key */
function getChannelBindingKey(pid) {
  const map = {
    qqbot: 'qqbot',
    telegram: 'telegram',
    discord: 'discord',
    feishu: 'feishu',
    dingtalk: 'dingtalk-connector',
    wechat: 'openclaw-weixin',
  }
  return map[pid] || pid
}

/** 保存渠道→Agent 绑定到 openclaw.json 的 bindings 数组
 * 支持同一渠道多个 Agent 绑定（不同 agentId）
 * oldAgentId: 编辑时替换老绑定
 */
async function saveChannelBinding(pid, agentId, oldAgentId, accountId) {
  const config = await api.readOpenclawConfig()
  if (!config) return
  const channelKey = getChannelBindingKey(pid)
  let bindings = Array.isArray(config.bindings) ? [...config.bindings] : []

  // 构建匹配条件
  const matchesBinding = (b) => {
    if (b.match?.channel !== channelKey) return false
    if (accountId) return (b.match?.accountId || '') === accountId
    return !b.match?.accountId
  }

  // 编辑模式：移除旧绑定
  if (oldAgentId) {
    bindings = bindings.filter(b => !(matchesBinding(b) && (b.agentId || 'main') === oldAgentId))
  }

  // 避免重复
  const effectiveAgent = agentId || 'main'
  bindings = bindings.filter(b => !(matchesBinding(b) && (b.agentId || 'main') === effectiveAgent))

  // 添加新绑定（包含 accountId 用于多账号路由）
  if (agentId) {
    const match = { channel: channelKey }
    if (accountId) match.accountId = accountId
    bindings.push({ agentId, match })
  }

  config.bindings = bindings
  await api.writeOpenclawConfig(config)
}

function escapeAttr(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
