const SUPPORTED_DNS_RESULT_ORDERS = Object.freeze(new Set([
  'verbatim',
  'ipv4first',
  'ipv6first',
]))

const LOOPBACK_PROXY_HOSTS = Object.freeze(new Set([
  '127.0.0.1',
  'localhost',
  '::1',
]))

function trimOrEmpty(value) {
  return String(value ?? '').trim()
}

export function normalizeLocalProxyUrl(value) {
  const normalized = trimOrEmpty(value)
  if (!normalized) return ''
  let url
  try {
    url = new URL(normalized)
  } catch {
    throw new Error(`Invalid local proxy URL: ${value}`)
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported local proxy protocol: ${url.protocol}`)
  }
  if (!LOOPBACK_PROXY_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Local proxy must stay on loopback: ${url.hostname}`)
  }
  return url.toString().replace(/\/$/, '')
}

export function normalizeDnsResultOrder(value = '') {
  const normalized = trimOrEmpty(value).toLowerCase()
  if (!normalized) return ''
  if (!SUPPORTED_DNS_RESULT_ORDERS.has(normalized)) {
    throw new Error(`Unsupported dns result order: ${value}`)
  }
  return normalized
}

export function getRuntimeSettings(args = {}, values = {}) {
  const localProxyUrl = normalizeLocalProxyUrl(
    args['local-proxy'] || values.LILUO_GROK_IMAGE_LOCAL_PROXY_URL || '',
  )
  const dnsResultOrder = normalizeDnsResultOrder(
    args['dns-result-order'] || values.LILUO_GROK_IMAGE_DNS_RESULT_ORDER || '',
  )

  return {
    useEnvProxy: Boolean(localProxyUrl),
    localProxyUrl,
    dnsResultOrder,
  }
}

export function summarizeRuntimeSettings(settings) {
  return {
    useEnvProxy: settings.useEnvProxy,
    localProxyUrl: settings.localProxyUrl || null,
    dnsResultOrder: settings.dnsResultOrder || null,
  }
}

export function createLauncherPlan(settings, targetScript, argv, baseEnv = process.env) {
  const env = { ...baseEnv }
  if (settings.localProxyUrl) {
    env.HTTP_PROXY = settings.localProxyUrl
    env.http_proxy = settings.localProxyUrl
    env.HTTPS_PROXY = settings.localProxyUrl
    env.https_proxy = settings.localProxyUrl
    env.NODE_USE_ENV_PROXY = '1'
  }

  const nodeArgs = []
  if (settings.useEnvProxy) nodeArgs.push('--use-env-proxy')
  if (settings.dnsResultOrder) nodeArgs.push(`--dns-result-order=${settings.dnsResultOrder}`)
  nodeArgs.push(targetScript, ...argv)

  return { env, nodeArgs }
}
