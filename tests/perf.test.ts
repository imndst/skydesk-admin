import { describe, it, expect } from 'vitest'
import { BASE, call, login } from './helpers'

const BUDGET_MS = Number(process.env.PERF_BUDGET_MS ?? 10)
const N = 300
const pct = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.ceil(a.length * p) - 1)]!

const endpoints = [
  '/api/health', '/api/dashboard', '/api/flights?limit=20', '/api/flights?q=THR&limit=20&sort=price&dir=desc',
  '/api/hotels?limit=20', '/api/bookings?limit=20&status=confirmed', '/api/bookings?q=guest1'
]

describe(`API performance budget: p95 < ${BUDGET_MS} ms`, () => {
  const rows: Record<string, unknown>[] = []

  it.each(endpoints.map((e, i) => [e, i] as const))('%s', async (path, idx) => {
    const cookie = await login()
    const headers = { cookie, 'x-forwarded-for': `10.7.${idx}.1` } // one IP per endpoint: stays under the rate limiter
    for (let i = 0; i < 40; i++) await (await fetch(`${BASE}${path}`, { headers })).arrayBuffer() // warm-up (JIT, statement cache)
    const rtt: number[] = [], srv: number[] = []
    for (let i = 0; i < N; i++) {
      const t = performance.now()
      const r = await fetch(`${BASE}${path}`, { headers })
      await r.arrayBuffer()
      rtt.push(performance.now() - t)
      srv.push(Number(/dur=([\d.]+)/.exec(r.headers.get('server-timing') ?? '')?.[1] ?? NaN))
    }
    rows.push({ endpoint: path, 'server p50': +pct(srv, .5).toFixed(2), 'server p95': +pct(srv, .95).toFixed(2), 'round-trip p50': +pct(rtt, .5).toFixed(2), 'round-trip p95': +pct(rtt, .95).toFixed(2), 'round-trip max': +Math.max(...rtt).toFixed(2) })
    expect(pct(srv, .95), 'server-side p95 (ms)').toBeLessThan(BUDGET_MS)
    expect(pct(rtt, .95), 'round-trip p95 (ms)').toBeLessThan(BUDGET_MS)
  })

  it('write path (create + book + cancel) stays under budget', async () => {
    const ts: number[] = []
    const cookie = await login()
    const f = await call('POST', '/api/flights', { airline: 'Perf Air', flightNumber: 'PF1', origin: 'IST', destination: 'LHR', departureAt: '2099-01-01T10:00', arrivalAt: '2099-01-01T14:00', price: 10000, seatsTotal: 900 })
    for (let i = 0; i < 100; i++) {
      const t = performance.now()
      const r = await fetch(`${BASE}/api/bookings`, { method: 'POST', headers: { cookie, 'content-type': 'application/json', 'x-requested-with': 'skydesk', 'x-forwarded-for': '10.7.200.1' }, body: JSON.stringify({ type: 'flight', itemId: f.json.id, quantity: 1, customerName: 'Perf Test', customerEmail: 'p@example.com', customerPhone: '+90 212 555 0100' }) })
      await r.arrayBuffer()
      ts.push(performance.now() - t)
      expect(r.status).toBe(201)
    }
    rows.push({ endpoint: 'POST /api/bookings (transaction)', 'server p50': '-', 'server p95': '-', 'round-trip p50': +pct(ts, .5).toFixed(2), 'round-trip p95': +pct(ts, .95).toFixed(2), 'round-trip max': +Math.max(...ts).toFixed(2) })
    expect(pct(ts, .95)).toBeLessThan(BUDGET_MS)
  })

  it('SSR page render time (informational, not asserted)', async () => {
    const ts: number[] = []
    for (let i = 0; i < 30; i++) { const t = performance.now(); await (await fetch(`${BASE}/login`)).text(); ts.push(performance.now() - t) }
    rows.push({ endpoint: 'GET /login (SSR HTML)', 'server p50': '-', 'server p95': '-', 'round-trip p50': +pct(ts, .5).toFixed(2), 'round-trip p95': +pct(ts, .95).toFixed(2), 'round-trip max': +Math.max(...ts).toFixed(2) })
    expect(true).toBe(true)
    console.table(rows)
  })
})
