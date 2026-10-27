import { loginSchema } from '#shared/schemas'
import { clientIp, loginBlockedFor, loginFailed, loginSucceeded, setSessionCookie, signSession, verifyPassword } from '../../utils/auth'
import { parseBody } from '../../utils/http'
import { stmt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const ip = clientIp(event)
  const wait = loginBlockedFor(ip)
  if (wait) {
    setHeader(event, 'Retry-After', wait)
    throw createError({ statusCode: 429, statusMessage: 'تلاش‌های ناموفق زیاد بود. چند دقیقه دیگر دوباره امتحان کنید.' })
  }
  const { email, password } = await parseBody(event, loginSchema)
  const user = stmt('SELECT id, email, password_hash AS hash FROM users WHERE email = ?').get(email) as { id: number, email: string, hash: string } | undefined
  if (!verifyPassword(password, user?.hash) || !user) {
    loginFailed(ip)
    throw createError({ statusCode: 401, statusMessage: 'ایمیل یا رمز عبور اشتباه است' })
  }
  loginSucceeded(ip)
  setSessionCookie(event, signSession(user.id, user.email))
  return { email: user.email }
})
