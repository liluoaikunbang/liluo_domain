/**
 * Normalize OpenAI-compatible chat completion responses into draft text.
 */

export function stripThinkTags(text) {
  if (typeof text !== 'string') return ''
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

export function extractMessageContent(message) {
  if (!message) return { content: '', reasoning: null }
  if (typeof message === 'string') return { content: message, reasoning: null }
  const reasoning =
    typeof message.reasoning_content === 'string'
      ? message.reasoning_content
      : typeof message.reasoning === 'string'
        ? message.reasoning
        : null
  let content = ''
  if (typeof message.content === 'string') content = message.content
  else if (Array.isArray(message.content)) {
    content = message.content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part.text === 'string') return part.text
        return ''
      })
      .join('')
  }
  return { content, reasoning }
}

export function normalizeChatCompletionResponse(payload, options = {}) {
  const warnings = []
  if (!payload || typeof payload !== 'object') {
    const error = new Error('响应不是 JSON 对象')
    error.code = 'INVALID_RESPONSE_JSON'
    throw error
  }
  const choice = payload.choices?.[0]
  if (!choice) {
    const error = new Error('响应缺少 choices[0]')
    error.code = 'EMPTY_CHOICES'
    throw error
  }
  const { content, reasoning } = extractMessageContent(choice.message ?? choice.delta ?? {})
  let draft = stripThinkTags(content)
  if (!draft && reasoning) {
    const error = new Error('响应仅含 reasoning，无正文')
    error.code = 'REASONING_ONLY'
    throw error
  }
  if (!draft) {
    const error = new Error('响应正文为空')
    error.code = 'EMPTY_DRAFT'
    throw error
  }
  if (/<think>/i.test(content) || reasoning) warnings.push('已剥离推理内容，不进入 draft')
  const usage = payload.usage ?? {}
  return {
    draft,
    usage: {
      promptTokens: usage.prompt_tokens ?? null,
      completionTokens: usage.completion_tokens ?? null,
      totalTokens: usage.total_tokens ?? null,
    },
    reasoningStored: false,
    warnings,
    responseMetadata: {
      id: typeof payload.id === 'string' ? payload.id : null,
      model: typeof payload.model === 'string' ? payload.model : null,
      finishReason: choice.finish_reason ?? null,
      created: typeof payload.created === 'number' ? payload.created : null,
    },
  }
}
