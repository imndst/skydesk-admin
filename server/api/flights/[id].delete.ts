import { idParam } from '../../utils/http'
import { stmt } from '../../utils/db'
export default defineEventHandler((event) => {
  const id = idParam(event)
  const used = stmt('SELECT COUNT(*) c FROM bookings WHERE flight_id = ?').get(id) as { c: number }
  if (used.c > 0) throw createError({ statusCode: 409, statusMessage: 'این پرواز رزرو دارد و حذف نمی‌شود' })
  const r = stmt('DELETE FROM flights WHERE id = ?').run(id)
  if (!r.changes) throw createError({ statusCode: 404, statusMessage: 'پرواز پیدا نشد' })
  return { ok: true }
})
