import type { ZodTypeAny } from 'zod'
import type { FormError } from '@nuxt/ui'

/** All browser → API calls go through here so the CSRF header is always present. */
export function api<T>(url: string, opts: Record<string, any> = {}) {
  return $fetch<T>(url, { ...opts, headers: { 'x-requested-with': 'skydesk', ...(opts.headers ?? {}) } })
}

export interface ApiFailure { status: number, message: string, fieldErrors: FormError[] }
export function apiError(e: any): ApiFailure {
  const data = e?.data?.data ?? e?.response?._data?.data
  const fieldErrors: FormError[] = (data?.fieldErrors ?? []).map((f: any) => ({ name: f.path, message: f.message }))
  const message = e?.data?.statusMessage ?? e?.statusMessage ?? 'خطایی رخ داد. دوباره تلاش کنید.'
  return { status: Number(e?.statusCode ?? e?.status ?? 0), message: String(message), fieldErrors }
}

/** Build a UForm `validate` function from a shared zod schema (nested paths become "a.b"). */
export function makeValidator(schema: ZodTypeAny, toPayload: (s: any) => unknown = s => s) {
  return (state: any): FormError[] => {
    const r = schema.safeParse(toPayload(state))
    return r.success ? [] : r.error.issues.map(i => ({ name: i.path.join('.'), message: i.message }))
  }
}

const num = new Intl.NumberFormat('fa-IR')
export const fa = (n: number) => num.format(n)
export const toman = (n: number) => `${num.format(n)} تومان`
/** fa-IR uses the Persian (Jalali) calendar automatically. */
export const fmtDateTime = (v: string) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v))
export const fmtDate = (v: string) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(v))
