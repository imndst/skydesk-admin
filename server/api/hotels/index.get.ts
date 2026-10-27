import { listQuerySchema } from '#shared/schemas'
import { likeEscape, parseQuery } from '../../utils/http'
import { stmt } from '../../utils/db'
import { HOTEL_COLS, HOTEL_SORT } from '../../utils/queries'

export default defineEventHandler((event) => {
  const { q, page, limit, sort, dir } = parseQuery(event, listQuerySchema)
  const col = HOTEL_SORT[sort ?? 'name'] ?? 'name'
  const d = dir === 'desc' ? 'DESC' : 'ASC'
  const like = likeEscape(q)
  const where = `WHERE (? = '' OR name LIKE ? ESCAPE '\\' OR city LIKE ? ESCAPE '\\' OR country LIKE ? ESCAPE '\\')`
  const args = [q, like, like, like]
  const total = (stmt(`SELECT COUNT(*) c FROM hotels ${where}`).get(...args) as { c: number }).c
  const items = stmt(`SELECT ${HOTEL_COLS} FROM hotels ${where} ORDER BY ${col} ${d}, id LIMIT ? OFFSET ?`)
    .all(...args, limit, (page - 1) * limit)
  return { items, total, page, limit }
})
