export const BASE = process.env.SKYDESK_URL ?? `http://127.0.0.1:${process.env.TEST_PORT ?? 3199}`
let cookie = ''

export async function login() {
  if (cookie) return cookie
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'skydesk', 'x-forwarded-for': '10.0.0.1' },
    body: JSON.stringify({ email: 'admin@skydesk.demo', password: 'Admin#2026demo' })
  })
  if (r.status !== 200) throw new Error(`login failed: ${r.status}`)
  cookie = (r.headers.get('set-cookie') ?? '').split(';')[0]!
  return cookie
}

export async function call(method: string, path: string, body?: unknown, opts: { auth?: boolean, headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { 'x-forwarded-for': '10.0.0.1', ...(opts.headers ?? {}) }
  if (!('x-requested-with' in headers)) headers['x-requested-with'] = 'skydesk'
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (opts.auth !== false) headers.cookie = await login()
  const r = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) })
  const text = await r.text()
  let json: any = null
  try { json = JSON.parse(text) } catch { /* html */ }
  return { status: r.status, json, text, headers: r.headers }
}

export const futureLocal = (days: number, hour = 9) => {
  const d = new Date(Date.now() + days * 86_400_000); d.setHours(hour, 0, 0, 0)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`
}
export const futureDate = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

export const validFlight = (over: Record<string, unknown> = {}) => ({
  airline: 'Test Air', flightNumber: 'TA100', origin: 'IST', destination: 'LHR',
  departureAt: futureLocal(5), arrivalAt: futureLocal(5, 14), price: 10000, seatsTotal: 10, ...over
})
export const validHotel = (over: Record<string, unknown> = {}) => ({
  name: 'Test Hotel', city: 'Paris', country: 'France', stars: 4, price: 20000, roomsTotal: 5, ...over
})
export const customer = { customerName: "Ann O'Neil-Lee", customerEmail: 'ann@example.com', customerPhone: '+90 212 555 0100' }
