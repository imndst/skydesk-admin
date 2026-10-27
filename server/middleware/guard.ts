import { clientIp, readSession } from '../utils/auth'
/**
 * Runs before every API route:
 *  1. per-IP rate limit
 *  2. CSRF defence for state-changing calls (custom header + Origin check, on top of SameSite=Strict cookies)
 *  3. authentication (signed, httpOnly session cookie)
 */
const PUBLIC = new Set(['POST /api/auth/login', 'GET /api/health', 'GET /api/theme', 'HEAD /api/theme'])
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])
const hits = new Map<string, { n: number, reset: number }>()

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) return

  // 1. rate limit (default 600 req / minute / IP)
  const max = Number(process.env.RATE_LIMIT_MAX ?? 600)
  const ip = clientIp(event)
  const now = Date.now()
  let h = hits.get(ip)
  if (!h || h.reset < now) { h = { n: 0, reset: now + 60_000 }; hits.set(ip, h) }
  if (++h.n > max) {
    setHeader(event, 'Retry-After', Math.ceil((h.reset - now) / 1000))
    throw createError({ statusCode: 429, statusMessage: 'تعداد درخواست‌ها بیش از حد مجاز است' })
  }
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k)

  // 2. CSRF
  if (!SAFE.has(event.method)) {
    if (getHeader(event, 'x-requested-with') !== 'skydesk') throw createError({ statusCode: 403, statusMessage: 'درخواست نامعتبر (CSRF)' })
    const origin = getHeader(event, 'origin')
    if (origin) {
      let host = ''
      try { host = new URL(origin).host } catch { /* invalid */ }
      if (host !== getHeader(event, 'host')) throw createError({ statusCode: 403, statusMessage: 'درخواست از دامنه‌ی دیگر مسدود شد' })
    }
  }

  // 3. auth
  if (PUBLIC.has(`${event.method} ${path}`)) return
  const session = readSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'ابتدا وارد شوید' })
  event.context.session = session
})
