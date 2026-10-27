import { listQuerySchema } from '#shared/schemas'
import { likeEscape, parseQuery } from '../../utils/http'
import { stmt } from '../../utils/db'
import { BOOKING_SELECT, BOOKING_SORT } from '../../utils/queries'

export default defineEventHandler((event) => {
  const { q, page, limit, sort, dir, status, type } = parseQuery(event, listQuerySchema)
  const col = BOOKING_SORT[sort ?? 'created'] ?? 'b.created_at'
  const d = dir === 'desc' ? 'DESC' : 'ASC'
  const like = likeEscape(q)
  const where = `WHERE (? = '' OR b.reference LIKE ? ESCAPE '\\' OR b.customer_name LIKE ? ESCAPE '\\' OR b.customer_email LIKE ? ESCAPE '\\')
    AND (? IS NULL OR b.status = ?) AND (? IS NULL OR b.type = ?)`
  const args = [q, like, like, like, status ?? null, status ?? null, type ?? null, type ?? null]
  const total = (stmt(`SELECT COUNT(*) c FROM bookings b ${where}`).get(...args) as { c: number }).c
  const items = stmt(`${BOOKING_SELECT} ${where} ORDER BY ${col} ${d}, b.id DESC LIMIT ? OFFSET ?`).all(...args, limit, (page - 1) * limit)
  return { items, total, page, limit }
})
