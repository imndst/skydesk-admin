import { flightSchema } from '#shared/schemas'
import { idParam, parseBody } from '../../utils/http'
import { getDb, stmt } from '../../utils/db'
import { FLIGHT_COLS } from '../../utils/queries'

export default defineEventHandler(async (event) => {
  const id = idParam(event)
  const v = await parseBody(event, flightSchema)
  getDb().transaction(() => {
    const cur = stmt('SELECT seats_total t, seats_available a FROM flights WHERE id = ?').get(id) as { t: number, a: number } | undefined
    if (!cur) throw createError({ statusCode: 404, statusMessage: 'پرواز پیدا نشد' })
    const booked = cur.t - cur.a
    if (v.seatsTotal < booked) throw createError({ statusCode: 409, statusMessage: `${booked} صندلی رزرو شده است؛ تعداد کل نمی‌تواند کمتر باشد` })
    stmt(`UPDATE flights SET airline=?, flight_number=?, origin=?, destination=?, departure_at=?, arrival_at=?, price=?, seats_total=?, seats_available=? WHERE id=?`)
      .run(v.airline, v.flightNumber, v.origin, v.destination, v.departureAt, v.arrivalAt, v.price, v.seatsTotal, v.seatsTotal - booked, id)
  })()
  return stmt(`SELECT ${FLIGHT_COLS} FROM flights WHERE id = ?`).get(id)
})
