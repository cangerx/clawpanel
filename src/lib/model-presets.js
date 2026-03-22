/**
 * 共享模型预设配置
 * models.js 和 assistant.js 共用，只需维护一套数据
 */

// API 接口类型选项
export const API_TYPES = [
  { value: 'openai-completions', label: 'OpenAI 兼容 (最常用)' },
  { value: 'anthropic-messages', label: 'Anthropic 原生' },
  { value: 'openai-responses', label: 'OpenAI Responses' },
  { value: 'google-generative-ai', label: 'Google Gemini' },
]

// 服务商快捷预设
export const PROVIDER_PRESETS = [
  { key: 'cangerapi', label: '苍洱API', badge: '推荐', baseUrl: 'https://api.772.ee/v1', api: 'openai-completions', site: 'https://api.772.ee/', desc: 'AI 模型 API 中转平台，支持 OpenAI 和 Anthropic 全系列模型' },
  { key: 'shengsuanyun', label: '胜算云', baseUrl: 'https://router.shengsuanyun.com/api/v1', api: 'openai-completions', site: 'https://www.shengsuanyun.com/?from=CH_4BVI0BM2', desc: '国内知名 AI 模型聚合平台，支持多种主流模型' },
  { key: 'siliconflow', label: '硅基流动', baseUrl: 'https://api.siliconflow.cn/v1', api: 'openai-completions', site: 'https://cloud.siliconflow.cn/i/PFrw2an5', desc: '高性价比推理平台，支持 DeepSeek、Qwen 等开源模型' },
  { key: 'volcengine', label: '火山引擎', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', api: 'openai-completions', site: 'https://volcengine.com/L/Ph1OP5I3_GY', desc: '字节跳动旗下云平台，支持豆包等模型' },
  { key: 'aliyun', label: '阿里云百炼', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', api: 'openai-completions', site: 'https://www.aliyun.com/benefit/ai/aistar?userCode=keahn2zr&clubBiz=subTask..12435175..10263..', desc: '阿里云 AI 大模型平台，支持通义千问全系列' },
  { key: 'zhipu', label: '智谱 AI', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', api: 'openai-completions', site: 'https://www.bigmodel.cn/glm-coding?ic=3F6F9XYKTS', desc: '国产大模型领军企业，支持 GLM-4 全系列' },
  { key: 'minimax', label: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', api: 'openai-completions', site: 'https://platform.minimaxi.com/subscribe/coding-plan?code=7pUc5oLo4K&source=link', desc: '国产多模态大模型，支持 MiniMax-Text 系列' },
  { key: 'openai', label: 'OpenAI 官方', baseUrl: 'https://api.openai.com/v1', api: 'openai-completions' },
  { key: 'anthropic', label: 'Anthropic 官方', baseUrl: 'https://api.anthropic.com', api: 'anthropic-messages' },
  { key: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', api: 'openai-completions' },
  { key: 'google', label: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', api: 'google-generative-ai' },
  { key: 'nvidia', label: 'NVIDIA NIM', baseUrl: 'https://integrate.api.nvidia.com/v1', api: 'openai-completions', desc: '英伟达推理平台，支持 Llama、Mistral 等模型' },
  { key: 'ollama', label: 'Ollama (本地)', baseUrl: 'http://127.0.0.1:11434/v1', api: 'openai-completions' },
]

// 苍洱API 配置
export const CANGERAPI = {
  baseUrl: 'https://api.772.ee/v1',
  defaultKey: '',  // no built-in key, users register to get one
  site: 'https://api.772.ee/',
  checkinUrl: 'https://api.772.ee/',
  usageUrl: 'https://api.772.ee/',
  providerKey: 'cangerapi',
  brandName: '苍洱API',
  api: 'openai-completions',
  models: []
}
export const QTCOOL = CANGERAPI

// 胜算云推广配置
export const SHENGSUANYUN = {
  baseUrl: 'https://router.shengsuanyun.com/api/v1',
  site: 'https://www.shengsuanyun.com/?from=CH_4BVI0BM2',
  providerKey: 'shengsuanyun',
  brandName: '胜算云',
  api: 'openai-completions',
}

// 常用模型预设（按服务商分组）
export const MODEL_PRESETS = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
    { id: 'o3-mini', name: 'o3 Mini', contextWindow: 200000, reasoning: true },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5', contextWindow: 200000 },
    { id: 'claude-haiku-3-5-20241022', name: 'Claude Haiku 3.5', contextWindow: 200000 },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek V3', contextWindow: 64000 },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', contextWindow: 64000, reasoning: true },
  ],
  google: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1000000, reasoning: true },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1000000 },
  ],
  ollama: [
    { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', contextWindow: 32768 },
    { id: 'llama3.2', name: 'Llama 3.2', contextWindow: 8192 },
    { id: 'gemma3', name: 'Gemma 3', contextWindow: 32768 },
  ],
}

/**
 * 动态获取苍洱API模型列表
 * @param {string} [apiKey] - API 密钥，未传则返回空列表
 * @returns {Promise<Array<{id:string, name:string, contextWindow:number, reasoning?:boolean}>>}
 */
export async function fetchCangerModels(apiKey) {
  if (!apiKey) return CANGERAPI.models
  try {
    const resp = await fetch(CANGERAPI.baseUrl + '/models', {
      headers: { 'Authorization': 'Bearer ' + apiKey },
      signal: AbortSignal.timeout(8000)
    })
    if (resp.ok) {
      const data = await resp.json()
      if (data.data && data.data.length) {
        return data.data.map(m => ({
          id: m.id, name: m.id, contextWindow: 128000,
          reasoning: m.id.includes('codex')
        })).sort((a, b) => b.id.localeCompare(a.id))
      }
    }
  } catch { /* use fallback */ }
  return CANGERAPI.models
}
export const fetchQtcoolModels = fetchCangerModels
