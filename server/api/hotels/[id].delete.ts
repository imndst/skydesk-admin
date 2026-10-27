import { idParam } from '../../utils/http'
import { stmt } from '../../utils/db'
export default defineEventHandler((event) => {
  const id = idParam(event)
  const used = stmt('SELECT COUNT(*) c FROM bookings WHERE hotel_id = ?').get(id) as { c: number }
  if (used.c > 0) throw createError({ statusCode: 409, statusMessage: 'این هتل رزرو دارد و حذف نمی‌شود' })
  const r = stmt('DELETE FROM hotels WHERE id = ?').run(id)
  if (!r.changes) throw createError({ statusCode: 404, statusMessage: 'هتل پیدا نشد' })
  return { ok: true }
})
