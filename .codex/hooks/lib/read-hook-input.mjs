const MAX_INPUT_BYTES = 1024 * 1024

export async function readHookInput(stream = process.stdin) {
  const chunks = []
  let size = 0
  try {
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8')
      size += buffer.length
      if (size > MAX_INPUT_BYTES) return { ok: false, error: '输入超过 1 MiB 限制。' }
      chunks.push(buffer)
    }
    const text = Buffer.concat(chunks).toString('utf8').trim()
    if (!text) return { ok: false, error: 'stdin 为空。' }
    const value = JSON.parse(text)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'stdin 必须是 JSON 对象。' }
    return { ok: true, value }
  } catch (error) {
    return { ok: false, error: `无法解析 JSON stdin：${error.message}` }
  }
}
