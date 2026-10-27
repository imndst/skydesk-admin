import { flightSchema } from '#shared/schemas'
import { parseBody } from '../../utils/http'
import { stmt } from '../../utils/db'
import { FLIGHT_COLS } from '../../utils/queries'

export default defineEventHandler(async (event) => {
  const v = await parseBody(event, flightSchema)
  const r = stmt(`INSERT INTO flights (airline, flight_number, origin, destination, departure_at, arrival_at, price, seats_total, seats_available)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(v.airline, v.flightNumber, v.origin, v.destination, v.departureAt, v.arrivalAt, v.price, v.seatsTotal, v.seatsTotal)
  setResponseStatus(event, 201)
  return stmt(`SELECT ${FLIGHT_COLS} FROM flights WHERE id = ?`).get(r.lastInsertRowid)
})
