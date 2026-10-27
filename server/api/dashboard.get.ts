import { stmt } from '../utils/db'
import { BOOKING_SELECT } from '../utils/queries'
export default defineEventHandler(() => {
  const totals = stmt(`SELECT
      COALESCE(SUM(CASE WHEN status='confirmed' THEN total END),0) AS revenue,
      COALESCE(SUM(CASE WHEN status='confirmed' AND type='flight' THEN total END),0) AS flightRevenue,
      COALESCE(SUM(CASE WHEN status='confirmed' AND type='hotel' THEN total END),0) AS hotelRevenue,
      COUNT(CASE WHEN status='confirmed' THEN 1 END) AS confirmed,
      COUNT(CASE WHEN status='cancelled' THEN 1 END) AS cancelled
    FROM bookings`).get() as Record<string, number>
  const inv = stmt(`SELECT
      (SELECT COALESCE(SUM(seats_available),0) FROM flights) AS seatsAvailable,
      (SELECT COALESCE(SUM(rooms_available),0) FROM hotels) AS roomsAvailable,
      (SELECT COUNT(*) FROM flights) AS flights, (SELECT COUNT(*) FROM hotels) AS hotels`).get() as Record<string, number>

  const since = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10)
  const rows = stmt(`SELECT substr(created_at,1,10) AS day, SUM(total) AS amount FROM bookings
    WHERE status='confirmed' AND created_at >= ? GROUP BY day`).all(since) as { day: string, amount: number }[]
  const map = new Map(rows.map(r => [r.day, r.amount]))
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86_400_000).toISOString().slice(0, 10)
    return { day, amount: map.get(day) ?? 0 }
  })
  const recent = stmt(`${BOOKING_SELECT} ORDER BY b.created_at DESC, b.id DESC LIMIT 5`).all()
  return { ...totals, ...inv, last7, recent }
})
