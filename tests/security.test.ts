import { describe, it, expect } from 'vitest'
import { BASE, call, login, validFlight, validHotel, customer } from './helpers'

const SQLI = [
  "' OR '1'='1", "' OR 1=1--", "'; DROP TABLE flights;--", "1; DELETE FROM bookings", "\" OR \"\"=\"",
  "' UNION SELECT id, email, password_hash, 1,1,1,1,1,1,1 FROM users--", "%' OR 1=1 --", "admin'--", "1' AND SLEEP(5)--", "' OR randomblob(100000000)--"
]
const XSS = [
  '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '"><svg onload=alert(1)>', "javascript:alert(1)//<a href=javascript:alert(1)>",
  '<iframe src=javascript:alert(1)>', '<body onload=alert(1)>', '<scr<script>ipt>alert(1)</scr</script>ipt>'
]
const tooFast = async <T>(fn: () => Promise<T>, ms = 2000) => { const t = performance.now(); const r = await fn(); expect(performance.now() - t).toBeLessThan(ms); return r }

describe('SQL injection', () => {
  it('search parameters are treated as literal text and never break the query', async () => {
    const before = (await call('GET', '/api/flights')).json.total
    for (const p of SQLI) {
      for (const path of ['/api/flights', '/api/hotels', '/api/bookings']) {
        const r = await tooFast(() => call('GET', `${path}?q=${encodeURIComponent(p)}`))
        expect([200, 400, 422], `${path} ${p}`).toContain(r.status)
        if (r.status === 200) expect(r.json.total, `${path} ${p}`).toBe(0)
      }
    }
    expect((await call('GET', '/api/flights')).json.total).toBe(before) // tables intact
  })
  it('LIKE wildcards are escaped (searching "%" does not match everything)', async () => {
    expect((await call('GET', '/api/flights?q=%25')).json.total).toBe(0)
    expect((await call('GET', '/api/flights?q=_')).json.total).toBe(0)
  })
  it('sort and filter parameters are allow-listed', async () => {
    for (const s of ['price_cents;DROP TABLE flights', 'id DESC, (SELECT 1)', '1']) {
      expect((await call('GET', `/api/flights?sort=${encodeURIComponent(s)}`)).status).toBe(200)
    }
    expect((await call('GET', `/api/bookings?status=${encodeURIComponent("confirmed' OR '1'='1")}`)).status).toBe(422)
    expect((await call('GET', `/api/bookings?type=${encodeURIComponent('flight;--')}`)).status).toBe(422)
  })
  it('id path parameters must be integers', async () => {
    for (const id of ["1 OR 1=1", "1;DROP TABLE flights", "abc", "-1", "0", "1.5"]) {
      const r = await call('DELETE', `/api/flights/${encodeURIComponent(id)}`)
      expect(r.status, id).toBe(400)
    }
  })
  it('SQL metacharacters in body text are stored literally via bound parameters', async () => {
    const evil = "Robert'); DROP TABLE hotels;--"
    const c = await call('POST', '/api/hotels', validHotel({ name: evil }))
    expect(c.status).toBe(201)
    expect(c.json.name).toBe(evil)
    const list = await call('GET', '/api/hotels?limit=100')
    expect(list.status).toBe(200)
    expect(list.json.items.some((h: any) => h.name === evil)).toBe(true)
  })
  it('login cannot be bypassed with injection', async () => {
    const a = await call('POST', '/api/auth/login', { email: "admin@skydesk.demo' OR '1'='1", password: 'whatever12' }, { auth: false, headers: { 'x-forwarded-for': '10.0.1.1' } })
    expect(a.status).toBe(422)
    const b = await call('POST', '/api/auth/login', { email: 'admin@skydesk.demo', password: "' OR '1'='1" }, { auth: false, headers: { 'x-forwarded-for': '10.0.1.1' } })
    expect(b.status).toBe(401)
    expect(b.headers.get('set-cookie')).toBeNull()
  })
})

describe('XSS and HTML/command injection', () => {
  it('rejects script payloads in every free-text field', async () => {
    for (const p of XSS) {
      expect((await call('POST', '/api/flights', validFlight({ airline: p }))).status, p).toBeGreaterThanOrEqual(400)
      expect((await call('POST', '/api/hotels', validHotel({ name: p }))).status, p).toBeGreaterThanOrEqual(400)
      expect((await call('POST', '/api/hotels', validHotel({ city: p }))).status, p).toBeGreaterThanOrEqual(400)
      expect((await call('POST', '/api/bookings', { type: 'flight', itemId: 1, quantity: 1, ...customer, customerName: p })).status, p).toBeGreaterThanOrEqual(400)
      expect((await call('GET', `/api/flights?q=${encodeURIComponent(p)}`)).status, p).toBeGreaterThanOrEqual(400)
    }
  })
  it('no payload was persisted', async () => {
    const all = JSON.stringify([(await call('GET', '/api/flights?limit=100')).json, (await call('GET', '/api/hotels?limit=100')).json, (await call('GET', '/api/bookings?limit=100')).json])
    expect(all).not.toMatch(/<script|onerror=|onload=|<iframe|<svg/i)
  })
  it('server-rendered HTML never reflects query-string payloads', async () => {
    const r = await fetch(`${BASE}/login?x=${encodeURIComponent('<script>alert(1)</script>')}&q=${encodeURIComponent('"><img src=x onerror=alert(1)>')}`)
    const html = await r.text()
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).not.toContain('onerror=alert(1)')
  })
  it('every inline/external script in SSR HTML carries the CSP nonce', async () => {
    const r = await fetch(`${BASE}/login`)
    const csp = r.headers.get('content-security-policy') ?? ''
    expect(csp).toMatch(/script-src[^;]*'nonce-/)
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)
    const html = await r.text()
    const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map(m => m[0])
    expect(scripts.length).toBeGreaterThan(0)
    for (const s of scripts) expect(s, s).toContain('nonce=')
  })
  it('null bytes and control characters are rejected', async () => {
    expect((await call('POST', '/api/hotels', validHotel({ name: 'Bad\u0000Name' }))).status).toBeGreaterThanOrEqual(400)
    expect((await call('POST', '/api/hotels', validHotel({ name: 'Bad\u001bName' }))).status).toBeGreaterThanOrEqual(400)
  })
  it('prototype pollution attempts have no effect', async () => {
    const r = await call('POST', '/api/hotels', '{"__proto__":{"admin":true},"constructor":{"prototype":{"x":1}},"name":"Proto Inn","city":"Paris","country":"France","stars":3,"price":9000,"roomsTotal":2}')
    expect([201, 400, 422]).toContain(r.status)
    expect(({} as any).admin).toBeUndefined()
  })
})

describe('HTTP hardening', () => {
  it('sends security headers', async () => {
    const r = await fetch(`${BASE}/login`)
    expect(r.headers.get('x-frame-options')).toBe('DENY')
    expect(r.headers.get('x-content-type-options')).toBe('nosniff')
    expect(r.headers.get('referrer-policy')).toBe('no-referrer')
    expect(r.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
    expect(r.headers.get('content-security-policy')).toContain("object-src 'none'")
    expect(r.headers.get('strict-transport-security')).toContain('max-age=')
    expect(r.headers.get('access-control-allow-origin')).toBeNull()
  })
  it('session cookie is HttpOnly + SameSite=Strict', async () => {
    const r = await call('POST', '/api/auth/login', { email: 'admin@skydesk.demo', password: 'Admin#2026demo' }, { auth: false, headers: { 'x-forwarded-for': '10.0.2.1' } })
    const c = r.headers.get('set-cookie') ?? ''
    expect(c).toMatch(/HttpOnly/i); expect(c).toMatch(/SameSite=Strict/i); expect(c).toMatch(/Path=\//)
  })
  it('blocks CSRF: missing header and cross-origin Origin', async () => {
    expect((await call('POST', '/api/flights', validFlight(), { headers: { 'x-requested-with': '' } })).status).toBe(403)
    expect((await call('POST', '/api/flights', validFlight(), { headers: { origin: 'https://evil.example' } })).status).toBe(403)
    expect((await call('DELETE', '/api/flights/1', undefined, { headers: { origin: 'https://evil.example' } })).status).toBe(403)
  })
  it('rejects tampered, forged and truncated session cookies', async () => {
    const good = (await login()).split('=')[1]!
    const [payload, sig] = good.split('.')
    const forged = Buffer.from(JSON.stringify({ uid: 1, email: 'admin@skydesk.demo', exp: 9999999999 })).toString('base64url')
    for (const c of [`${forged}.${sig}`, `${payload}.AAAA`, payload!, 'garbage', `${payload}.${sig}x`]) {
      const r = await fetch(`${BASE}/api/flights`, { headers: { cookie: `sd_session=${c}` } })
      expect(r.status, c).toBe(401)
    }
  })
  it('limits request body size (413)', async () => {
    const r = await call('POST', '/api/hotels', JSON.stringify(validHotel({ name: 'a'.repeat(40_000) })))
    expect(r.status).toBe(413)
  })
  it('does not leak stack traces or file paths in errors', async () => {
    const r = await call('PUT', '/api/flights/abc', validFlight())
    expect(r.status).toBe(400)
    expect(r.text).not.toMatch(/node_modules|\.mjs|at \w+ \(/)
    expect(r.json.stack).toBeUndefined()
  })
  it('blocks brute-force logins after 5 failures (429 + Retry-After), then still blocks the right password', async () => {
    const h = { 'x-forwarded-for': '10.9.9.9' }
    for (let i = 0; i < 5; i++) expect((await call('POST', '/api/auth/login', { email: 'admin@skydesk.demo', password: 'WrongPass' + i + 'xx' }, { auth: false, headers: h })).status).toBe(401)
    const blocked = await call('POST', '/api/auth/login', { email: 'admin@skydesk.demo', password: 'Admin#2026demo' }, { auth: false, headers: h })
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0)
  })
  it('applies a global per-IP rate limit', async () => {
    const h = { 'x-forwarded-for': '10.8.8.8' }
    let limited = false
    for (let i = 0; i < 1600 && !limited; i++) limited = (await fetch(`${BASE}/api/health`, { headers: h })).status === 429
    expect(limited).toBe(true)
  })
})
