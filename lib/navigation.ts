export function safeNextPath(value: unknown, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback
  const origin = 'https://local.invalid'
  try {
    const target = new URL(value, origin)
    return target.origin === origin ? `${target.pathname}${target.search}${target.hash}` : fallback
  } catch {
    return fallback
  }
}
