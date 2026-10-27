import { describe, it, expect } from 'vitest'
import { call, validFlight, validHotel, customer, futureDate } from './helpers'

describe('authentication', () => {
  it('protects every API route', async () => {
    for (const [m, p] of [['GET', '/api/flights'], ['GET', '/api/hotels'], ['GET', '/api/bookings'], ['GET', '/api/dashboard'], ['POST', '/api/flights'], ['DELETE', '/api/hotels/1'], ['PATCH', '/api/bookings/1']] as const) {
      const r = await call(m, p, m === 'GET' || m === 'DELETE' ? undefined : {}, { auth: false })
      expect(r.status, `${m} ${p}`).toBe(401)
    }
  })
  it('uses the same generic message for unknown user and wrong password', async () => {
    const a = await call('POST', '/api/auth/login', { email: 'nobody@example.com', password: 'WrongPass123' }, { auth: false })
    const b = await call('POST', '/api/auth/login', { email: 'admin@skydesk.demo', password: 'WrongPass123' }, { auth: false })
    expect(a.status).toBe(401); expect(b.status).toBe(401)
    expect(a.json.statusMessage).toBe(b.json.statusMessage)
  })
  it('returns the session on /me', async () => {
    const r = await call('GET', '/api/auth/me')
    expect(r.json.email).toBe('admin@skydesk.demo')
  })
})

describe('form validation (server side, same zod schemas as the UI)', () => {
  it('rejects an empty flight with a message per field', async () => {
    const r = await call('POST', '/api/flights', {})
    expect(r.status).toBe(422)
    const fields = r.json.data.fieldErrors.map((f: any) => f.path)
    expect(fields).toEqual(expect.arrayContaining(['airline', 'flightNumber', 'origin', 'destination', 'departureAt', 'arrivalAt', 'price', 'seatsTotal']))
  })
  it.each([
    ['same origin and destination', { destination: 'IST' }, 'destination'],
    ['arrival before departure', { arrivalAt: '2020-01-01T00:00' }, 'arrivalAt'],
    ['bad IATA code', { origin: 'ISTANBUL' }, 'origin'],
    ['bad flight number', { flightNumber: 'x' }, 'flightNumber'],
    ['negative price', { price: -5 }, 'price'],
    ['fractional cents', { price: 100.5 }, 'price'],
    ['price as string', { price: '100' }, 'price'],
    ['zero seats', { seatsTotal: 0 }, 'seatsTotal'],
    ['too many seats', { seatsTotal: 100000 }, 'seatsTotal'],
    ['price under 10,000 Toman', { price: 5000 }, 'price']
  ])('flight: %s', async (_n, over, field) => {
    const r = await call('POST', '/api/flights', validFlight(over))
    expect(r.status).toBe(422)
    expect(r.json.data.fieldErrors.map((f: any) => f.path)).toContain(field)
  })
  it('hotel: stars 0 and 6 are rejected', async () => {
    for (const stars of [0, 6]) expect((await call('POST', '/api/hotels', validHotel({ stars }))).status).toBe(422)
  })
  it('rejects malformed JSON with 400', async () => {
    expect((await call('POST', '/api/flights', '{not json')).status).toBe(400)
  })
  it('ignores mass-assignment fields (id, seatsAvailable)', async () => {
    const r = await call('POST', '/api/flights', validFlight({ id: 9999, seatsAvailable: 1, flightNumber: 'MA100' }))
    expect(r.status).toBe(201)
    expect(r.json.id).not.toBe(9999)
    expect(r.json.seatsAvailable).toBe(10)
  })
})

describe('flight lifecycle and bookings', () => {
  it('create, search, update, book, overbook, cancel, protect from delete', async () => {
    const created = await call('POST', '/api/flights', validFlight({ flightNumber: 'LF200', seatsTotal: 4, price: 12345 }))
    expect(created.status).toBe(201)
    const id = created.json.id

    const found = await call('GET', '/api/flights?q=LF200')
    expect(found.json.total).toBe(1)

    const upd = await call('PUT', `/api/flights/${id}`, validFlight({ flightNumber: 'LF200', seatsTotal: 6, price: 12345 }))
    expect(upd.json.seatsAvailable).toBe(6)

    const b = await call('POST', '/api/bookings', { type: 'flight', itemId: id, quantity: 2, total: 1, ...customer })
    expect(b.status).toBe(201)
    expect(b.json.total).toBe(12345 * 2) // server computes price; client-sent total is ignored
    expect(b.json.reference).toMatch(/^SD-[A-Z2-9]{8}$/)

    expect((await call('GET', '/api/flights?q=LF200')).json.items[0].seatsAvailable).toBe(4)

    const over = await call('POST', '/api/bookings', { type: 'flight', itemId: id, quantity: 5, ...customer })
    expect(over.status).toBe(409)

    const shrink = await call('PUT', `/api/flights/${id}`, validFlight({ flightNumber: 'LF200', seatsTotal: 1 }))
    expect(shrink.status).toBe(409)

    expect((await call('DELETE', `/api/flights/${id}`)).status).toBe(409)

    const cancel = await call('PATCH', `/api/bookings/${b.json.id}`, { status: 'cancelled' })
    expect(cancel.json.status).toBe('cancelled')
    expect((await call('GET', '/api/flights?q=LF200')).json.items[0].seatsAvailable).toBe(6)
    expect((await call('PATCH', `/api/bookings/${b.json.id}`, { status: 'cancelled' })).status).toBe(409)
  })
  it('cannot book a departed or unknown flight', async () => {
    expect((await call('POST', '/api/bookings', { type: 'flight', itemId: 999999, quantity: 1, ...customer })).status).toBe(404)
  })
  it('deletes an unused flight', async () => {
    const c = await call('POST', '/api/flights', validFlight({ flightNumber: 'DL300' }))
    expect((await call('DELETE', `/api/flights/${c.json.id}`)).status).toBe(200)
    expect((await call('DELETE', `/api/flights/${c.json.id}`)).status).toBe(404)
  })
})

describe('hotel lifecycle and bookings', () => {
  it('books nights x rooms and releases rooms on cancel', async () => {
    const h = await call('POST', '/api/hotels', validHotel({ name: 'Lifecycle Inn', roomsTotal: 3, price: 15000 }))
    expect(h.status).toBe(201)
    const b = await call('POST', '/api/bookings', { type: 'hotel', itemId: h.json.id, quantity: 2, checkIn: futureDate(10), checkOut: futureDate(13), ...customer })
    expect(b.status).toBe(201)
    expect(b.json.total).toBe(15000 * 3 * 2)
    expect((await call('GET', '/api/hotels?q=Lifecycle')).json.items[0].roomsAvailable).toBe(1)
    expect((await call('POST', '/api/bookings', { type: 'hotel', itemId: h.json.id, quantity: 2, checkIn: futureDate(10), checkOut: futureDate(11), ...customer })).status).toBe(409)
    await call('PATCH', `/api/bookings/${b.json.id}`, { status: 'cancelled' })
    expect((await call('GET', '/api/hotels?q=Lifecycle')).json.items[0].roomsAvailable).toBe(3)
  })
  it('validates stay dates', async () => {
    const h = await call('POST', '/api/hotels', validHotel({ name: 'Dates Inn' }))
    const base = { type: 'hotel', itemId: h.json.id, quantity: 1, ...customer }
    expect((await call('POST', '/api/bookings', { ...base, checkIn: futureDate(5), checkOut: futureDate(4) })).status).toBe(422)
    expect((await call('POST', '/api/bookings', { ...base, checkIn: futureDate(5), checkOut: futureDate(40) })).status).toBe(422)
    const past = await call('POST', '/api/bookings', { ...base, checkIn: '2020-01-01', checkOut: '2020-01-03' })
    expect(past.status).toBe(422)
    expect(past.json.data.fieldErrors[0].path).toBe('checkIn')
  })
  it('accepts Persian names (with ZWNJ) and Persian digits in phone numbers', async () => {
    const f = await call('POST', '/api/flights', validFlight({ flightNumber: 'FA700' }))
    const r = await call('POST', '/api/bookings', { type: 'flight', itemId: f.json.id, quantity: 1, customerName: 'مهسا رضایی\u200cنژاد', customerEmail: 'm@example.com', customerPhone: '۰۹۱۲۳۴۵۶۷۸۹' })
    expect(r.status).toBe(201)
    expect(r.json.customerPhone).toBe('09123456789')
  })
  it.each([
    ['name with digits', { customerName: 'Bob 123' }],
    ['bad email', { customerEmail: 'not-an-email' }],
    ['bad phone', { customerPhone: 'call me' }],
    ['0 passengers', { quantity: 0 }],
    ['10 passengers', { quantity: 10 }]
  ])('booking validation: %s', async (_n, over) => {
    const r = await call('POST', '/api/bookings', { type: 'flight', itemId: 1, quantity: 1, ...customer, ...over })
    expect(r.status).toBe(422)
  })
})

describe('lists and dashboard', () => {
  it('paginates and caps the page size', async () => {
    const r = await call('GET', '/api/flights?limit=5&page=2')
    expect(r.json.items.length).toBeLessThanOrEqual(5)
    expect((await call('GET', '/api/flights?limit=1000')).status).toBe(422)
    expect((await call('GET', '/api/flights?page=0')).status).toBe(422)
  })
  it('filters bookings by status and type', async () => {
    const r = await call('GET', '/api/bookings?status=cancelled&type=hotel&limit=100')
    for (const b of r.json.items) { expect(b.status).toBe('cancelled'); expect(b.type).toBe('hotel') }
  })
  it('returns dashboard figures', async () => {
    const r = await call('GET', '/api/dashboard')
    expect(r.json.last7).toHaveLength(7)
    expect(r.json.revenue).toBe(r.json.flightRevenue + r.json.hotelRevenue)
  })
})
