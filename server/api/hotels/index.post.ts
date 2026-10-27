import { hotelSchema } from '#shared/schemas'
import { parseBody } from '../../utils/http'
import { stmt } from '../../utils/db'
import { HOTEL_COLS } from '../../utils/queries'

export default defineEventHandler(async (event) => {
  const v = await parseBody(event, hotelSchema)
  const r = stmt('INSERT INTO hotels (name, city, country, stars, price, rooms_total, rooms_available) VALUES (?,?,?,?,?,?,?)')
    .run(v.name, v.city, v.country, v.stars, v.price, v.roomsTotal, v.roomsTotal)
  setResponseStatus(event, 201)
  return stmt(`SELECT ${HOTEL_COLS} FROM hotels WHERE id = ?`).get(r.lastInsertRowid)
})
