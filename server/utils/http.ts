import type { H3Event } from 'h3'
import type { ZodTypeAny, z } from 'zod'

function fail(issues: { path: (string | number)[], message: string }[]): never {
  throw createError({
    statusCode: 422, statusMessage: 'اطلاعات واردشده معتبر نیست',
    data: { fieldErrors: issues.map(i => ({ path: i.path.join('.'), message: i.message })) }
  })
}

export async function parseBody<T extends ZodTypeAny>(event: H3Event, schema: T): Promise<z.infer<T>> {
  let raw: unknown
  try { raw = await readBody(event) } catch { throw createError({ statusCode: 400, statusMessage: 'بدنه‌ی درخواست معتبر نیست' }) }
  const r = schema.safeParse(raw)
  if (!r.success) fail(r.error.issues)
  return r.data
}

export function parseQuery<T extends ZodTypeAny>(event: H3Event, schema: T): z.infer<T> {
  const r = schema.safeParse(getQuery(event))
  if (!r.success) fail(r.error.issues)
  return r.data
}

export function idParam(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) throw createError({ statusCode: 400, statusMessage: 'شناسه نامعتبر است' })
  return id
}

/** Escapes LIKE wildcards so user text is matched literally (used with ESCAPE '\'). */
export const likeEscape = (q: string) => `%${q.replace(/[\\%_]/g, m => `\\${m}`)}%`

export function pageMeta(page: number, limit: number) { return { limit, offset: (page - 1) * limit } }
