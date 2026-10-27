import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto'
import type { H3Event } from 'h3'

const SESSION_COOKIE = 'sd_session'
const SESSION_TTL_S = 60 * 60 * 8

let secret: Buffer | null = null
function getSecret() {
  if (!secret) {
    const env = process.env.SESSION_SECRET
    if (env && env.length >= 32) secret = Buffer.from(env)
    else {
      if (process.env.NODE_ENV === 'production' && process.env.SKYDESK_QUIET !== '1') {
        console.warn('[skydesk] SESSION_SECRET (>= 32 chars) is not set: using a random secret; sessions reset on restart.')
      }
      secret = randomBytes(48)
    }
  }
  return secret
}

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url')

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

let dummyHash: string | null = null

/** Constant-ish time: unknown users still pay the scrypt cost (no user enumeration via timing). */
export function verifyPassword(password: string, stored: string | undefined): boolean {
  const hash = stored ?? (dummyHash ??= hashPassword('dummy-password-for-timing'))
  const [scheme, saltB64, hashB64] = hash.split('$')
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: 16384, r: 8, p: 1 })
  const ok = timingSafeEqual(actual, expected)
  return stored ? ok : false
}

export interface Session { uid: number, email: string, exp: number }

export function signSession(uid: number, email: string): string {
  const payload = b64u(JSON.stringify({ uid, email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S }))
  const sig = createHmac('sha256', getSecret()).update(payload).digest()
  return `${payload}.${b64u(sig)}`
}

export function readSession(event: H3Event): Session | null {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = createHmac('sha256', getSecret()).update(payload).digest()
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session
    return s.exp > Date.now() / 1000 ? s : null
  } catch { return null }
}

export function setSessionCookie(event: H3Event, token: string) {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'strict', path: '/', maxAge: SESSION_TTL_S,
    secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1'
  })
}
export function clearSessionCookie(event: H3Event) { deleteCookie(event, SESSION_COOKIE, { path: '/' }) }

// ---- login brute-force limiter (counts failed attempts only) ----
const fails = new Map<string, { n: number, reset: number }>()
const MAX = () => Number(process.env.LOGIN_MAX_FAILS ?? 5)
const WINDOW_MS = 15 * 60 * 1000
export function clientIp(event: H3Event) {
  return getRequestIP(event, { xForwardedFor: process.env.TRUST_PROXY === '1' }) ?? 'unknown'
}
export function loginBlockedFor(ip: string): number {
  const r = fails.get(ip)
  if (!r) return 0
  if (r.reset < Date.now()) { fails.delete(ip); return 0 }
  return r.n >= MAX() ? Math.ceil((r.reset - Date.now()) / 1000) : 0
}
export function loginFailed(ip: string) {
  const r = fails.get(ip)
  if (!r || r.reset < Date.now()) fails.set(ip, { n: 1, reset: Date.now() + WINDOW_MS })
  else r.n++
}
export function loginSucceeded(ip: string) { fails.delete(ip) }
