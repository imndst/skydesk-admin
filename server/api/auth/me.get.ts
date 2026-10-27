import { readSession } from '../../utils/auth'
export default defineEventHandler((event) => {
  const s = readSession(event)
  if (!s) throw createError({ statusCode: 401, statusMessage: 'وارد نشده‌اید' })
  return { email: s.email }
})
