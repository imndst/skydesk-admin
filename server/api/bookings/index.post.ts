import { bookingSchema } from '#shared/schemas'
import { parseBody } from '../../utils/http'
import { getDb, newReference, stmt } from '../../utils/db'
import { BOOKING_SELECT } from '../../utils/queries'

type Flight = { price: number, seats: number, dep: string }
type Hotel = { price: number, rooms: number }

export default defineEventHandler(async (event) => {
  const v = await parseBody(event, bookingSchema)
  const id = getDb().transaction(() => {
    let total: number
    let flightId: number | null = null, hotelId: number | null = null
    let checkIn: string | null = null, checkOut: string | null = null
    if (v.type === 'flight') {
      const f = stmt('SELECT price, seats_available seats, departure_at dep FROM flights WHERE id = ?').get(v.itemId) as Flight | undefined
      if (!f) throw createError({ statusCode: 404, statusMessage: 'پرواز پیدا نشد' })
      if (Date.parse(f.dep) < Date.now()) throw createError({ statusCode: 409, statusMessage: 'این پرواز انجام شده است' })
      const upd = stmt('UPDATE flights SET seats_available = seats_available - ? WHERE id = ? AND seats_available >= ?').run(v.quantity, v.itemId, v.quantity)
      if (!upd.changes) throw createError({ statusCode: 409, statusMessage: `فقط ${f.seats} صندلی خالی باقی مانده است` })
      total = f.price * v.quantity; flightId = v.itemId
    } else {
      const h = stmt('SELECT price, rooms_available rooms FROM hotels WHERE id = ?').get(v.itemId) as Hotel | undefined
      if (!h) throw createError({ statusCode: 404, statusMessage: 'هتل پیدا نشد' })
      if (v.checkIn < new Date().toISOString().slice(0, 10)) throw createError({ statusCode: 422, statusMessage: 'اطلاعات واردشده معتبر نیست', data: { fieldErrors: [{ path: 'checkIn', message: 'تاریخ ورود نمی‌تواند گذشته باشد' }] } })
      const upd = stmt('UPDATE hotels SET rooms_available = rooms_available - ? WHERE id = ? AND rooms_available >= ?').run(v.quantity, v.itemId, v.quantity)
      if (!upd.changes) throw createError({ statusCode: 409, statusMessage: `فقط ${h.rooms} اتاق خالی باقی مانده است` })
      const nights = (Date.parse(v.checkOut) - Date.parse(v.checkIn)) / 86_400_000
      total = h.price * nights * v.quantity; hotelId = v.itemId; checkIn = v.checkIn; checkOut = v.checkOut // price computed server-side only
    }
    const r = stmt(`INSERT INTO bookings (reference, type, flight_id, hotel_id, customer_name, customer_email, customer_phone, quantity, check_in, check_out, total)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(newReference(), v.type, flightId, hotelId, v.customerName, v.customerEmail, v.customerPhone, v.quantity, checkIn, checkOut, total)
    return Number(r.lastInsertRowid)
  })()
  setResponseStatus(event, 201)
  return stmt(`${BOOKING_SELECT} WHERE b.id = ?`).get(id)
})
