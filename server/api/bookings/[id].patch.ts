import { bookingStatusSchema } from '#shared/schemas'
import { idParam, parseBody } from '../../utils/http'
import { getDb, stmt } from '../../utils/db'
import { BOOKING_SELECT } from '../../utils/queries'

export default defineEventHandler(async (event) => {
  const id = idParam(event)
  await parseBody(event, bookingStatusSchema)
  getDb().transaction(() => {
    const b = stmt('SELECT type, flight_id fid, hotel_id hid, quantity q, status s FROM bookings WHERE id = ?').get(id) as { type: string, fid: number | null, hid: number | null, q: number, s: string } | undefined
    if (!b) throw createError({ statusCode: 404, statusMessage: 'رزرو پیدا نشد' })
    if (b.s === 'cancelled') throw createError({ statusCode: 409, statusMessage: 'این رزرو قبلاً لغو شده است' })
    stmt("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(id)
    if (b.type === 'flight') stmt('UPDATE flights SET seats_available = MIN(seats_total, seats_available + ?) WHERE id = ?').run(b.q, b.fid)
    else stmt('UPDATE hotels SET rooms_available = MIN(rooms_total, rooms_available + ?) WHERE id = ?').run(b.q, b.hid)
  })()
  return stmt(`${BOOKING_SELECT} WHERE b.id = ?`).get(id)
})
