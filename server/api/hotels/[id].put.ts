import { hotelSchema } from '#shared/schemas'
import { idParam, parseBody } from '../../utils/http'
import { getDb, stmt } from '../../utils/db'
import { HOTEL_COLS } from '../../utils/queries'

export default defineEventHandler(async (event) => {
  const id = idParam(event)
  const v = await parseBody(event, hotelSchema)
  getDb().transaction(() => {
    const cur = stmt('SELECT rooms_total t, rooms_available a FROM hotels WHERE id = ?').get(id) as { t: number, a: number } | undefined
    if (!cur) throw createError({ statusCode: 404, statusMessage: 'هتل پیدا نشد' })
    const booked = cur.t - cur.a
    if (v.roomsTotal < booked) throw createError({ statusCode: 409, statusMessage: `${booked} اتاق رزرو شده است؛ تعداد کل نمی‌تواند کمتر باشد` })
    stmt('UPDATE hotels SET name=?, city=?, country=?, stars=?, price=?, rooms_total=?, rooms_available=? WHERE id=?')
      .run(v.name, v.city, v.country, v.stars, v.price, v.roomsTotal, v.roomsTotal - booked, id)
  })()
  return stmt(`SELECT ${HOTEL_COLS} FROM hotels WHERE id = ?`).get(id)
})
