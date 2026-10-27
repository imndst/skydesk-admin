import { listQuerySchema } from '#shared/schemas'
import { likeEscape, parseQuery } from '../../utils/http'
import { stmt } from '../../utils/db'
import { FLIGHT_COLS, FLIGHT_SORT } from '../../utils/queries'

export default defineEventHandler((event) => {
  const { q, page, limit, sort, dir } = parseQuery(event, listQuerySchema)
  const col = FLIGHT_SORT[sort ?? 'departure'] ?? 'departure_at'
  const d = dir === 'desc' ? 'DESC' : 'ASC'
  const like = likeEscape(q)
  const where = `WHERE (? = '' OR airline LIKE ? ESCAPE '\\' OR flight_number LIKE ? ESCAPE '\\' OR origin LIKE ? ESCAPE '\\' OR destination LIKE ? ESCAPE '\\')`
  const args = [q, like, like, like, like]
  const total = (stmt(`SELECT COUNT(*) c FROM flights ${where}`).get(...args) as { c: number }).c
  const items = stmt(`SELECT ${FLIGHT_COLS} FROM flights ${where} ORDER BY ${col} ${d}, id LIMIT ? OFFSET ?`)
    .all(...args, limit, (page - 1) * limit)
  return { items, total, page, limit }
})
