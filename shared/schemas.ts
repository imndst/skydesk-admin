import { z } from 'zod'
import { normalizeDigits, safeText, NO_CONTROL } from './text'

/**
 * Single source of truth for validation.
 * The SAME schemas run in the browser (UForm) and on the server (API routes).
 * All money is an integer number of Toman.
 */

const int = (label: string, min: number, max: number, minMsg: string, maxMsg: string) =>
  z.preprocess(normalizeDigits, z.coerce.number({ invalid_type_error: `${label} باید عدد باشد` }))
    .pipe(z.number({ required_error: `${label} الزامی است`, invalid_type_error: `${label} باید عدد باشد` })
      .int(`${label} باید عدد صحیح باشد`).min(min, minMsg).max(max, maxMsg))

/** Strict integer: strings are NOT accepted from the API (prevents type confusion); the UI sends numbers. */
const strictInt = (label: string, min: number, max: number, minMsg: string, maxMsg: string) =>
  z.number({ required_error: `${label} الزامی است`, invalid_type_error: `${label} باید عدد باشد` })
    .int(`${label} باید عدد صحیح باشد`).min(min, minMsg).max(max, maxMsg)

const iata = (label: string) =>
  z.preprocess(normalizeDigits, z.string({ required_error: `${label} الزامی است`, invalid_type_error: `${label} الزامی است` })
    .trim().toUpperCase()
    .regex(/^[A-Z]{3}$/, `${label} باید کد سه‌حرفی فرودگاه باشد (مثل THR)`))

const localDateTime = (label: string) => z.string({ required_error: `${label} الزامی است`, invalid_type_error: `${label} الزامی است` })
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, `${label} معتبر نیست`)
  .refine(v => !Number.isNaN(Date.parse(v)), `${label} معتبر نیست`)

const isoDate = (label: string) => z.string({ required_error: `${label} الزامی است`, invalid_type_error: `${label} الزامی است` })
  .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} معتبر نیست`)
  .refine(v => !Number.isNaN(Date.parse(v)), `${label} معتبر نیست`)

const price = (label: string) => strictInt(label, 10_000, 100_000_000_000, `${label} باید حداقل ۱۰٬۰۰۰ تومان باشد`, `${label} بیش از حد مجاز است`)

/** Cross-field rules, usable on partial input so the form can show them immediately. */
export function flightCrossErrors(v: { origin?: unknown, destination?: unknown, departureAt?: unknown, arrivalAt?: unknown }) {
  const errs: { path: string, message: string }[] = []
  const o = typeof v.origin === 'string' ? v.origin.trim().toUpperCase() : ''
  const d = typeof v.destination === 'string' ? v.destination.trim().toUpperCase() : ''
  if (o && d && o === d) errs.push({ path: 'destination', message: 'مقصد باید با مبدأ متفاوت باشد' })
  const dep = typeof v.departureAt === 'string' ? Date.parse(v.departureAt) : Number.NaN
  const arr = typeof v.arrivalAt === 'string' ? Date.parse(v.arrivalAt) : Number.NaN
  if (!Number.isNaN(dep) && !Number.isNaN(arr) && arr <= dep) errs.push({ path: 'arrivalAt', message: 'زمان رسیدن باید بعد از زمان حرکت باشد' })
  return errs
}

export const flightSchema = z.object({
  airline: safeText(2, 60, 'نام ایرلاین'),
  flightNumber: z.preprocess(normalizeDigits, z.string({ required_error: 'شماره پرواز الزامی است', invalid_type_error: 'شماره پرواز الزامی است' })
    .trim().toUpperCase().regex(/^[A-Z0-9]{2}\d{1,4}$/, 'کد ایرلاین و شماره، مثل IR452')),
  origin: iata('مبدأ'),
  destination: iata('مقصد'),
  departureAt: localDateTime('زمان حرکت'),
  arrivalAt: localDateTime('زمان رسیدن'),
  price: price('قیمت هر صندلی'),
  seatsTotal: strictInt('تعداد صندلی', 1, 900, 'حداقل ۱ صندلی', 'حداکثر ۹۰۰ صندلی')
}).superRefine((v, ctx) => {
  for (const e of flightCrossErrors(v)) ctx.addIssue({ code: 'custom', path: [e.path], message: e.message })
})
export type FlightInput = z.infer<typeof flightSchema>

export const hotelSchema = z.object({
  name: safeText(2, 80, 'نام هتل'),
  city: safeText(2, 60, 'شهر'),
  country: safeText(2, 60, 'کشور'),
  stars: strictInt('ستاره', 1, 5, 'حداقل ۱ ستاره', 'حداکثر ۵ ستاره'),
  price: price('قیمت هر شب'),
  roomsTotal: strictInt('تعداد اتاق', 1, 2000, 'حداقل ۱ اتاق', 'حداکثر ۲۰۰۰ اتاق')
})
export type HotelInput = z.infer<typeof hotelSchema>

const customer = {
  customerName: z.string({ required_error: 'نام مسافر الزامی است', invalid_type_error: 'نام مسافر الزامی است' }).trim()
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد').max(80, 'نام باید حداکثر ۸۰ کاراکتر باشد')
    .regex(/^[\p{L}\p{M}][\p{L}\p{M} .'’‌-]*$/u, 'فقط حروف، فاصله و نیم‌فاصله مجاز است'),
  customerEmail: z.string({ required_error: 'ایمیل الزامی است', invalid_type_error: 'ایمیل الزامی است' }).trim().toLowerCase()
    .max(120, 'ایمیل خیلی طولانی است').email('ایمیل معتبر وارد کنید'),
  customerPhone: z.preprocess(normalizeDigits, z.string({ required_error: 'شماره تماس الزامی است', invalid_type_error: 'شماره تماس الزامی است' }).trim()
    .regex(/^\+?[0-9][0-9 ()-]{6,19}$/, 'شماره تماس معتبر وارد کنید، مثل ۰۹۱۲۳۴۵۶۷۸۹'))
}

export const bookingSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('flight'),
    itemId: z.number({ required_error: 'یک پرواز انتخاب کنید', invalid_type_error: 'یک پرواز انتخاب کنید' }).int().positive('یک پرواز انتخاب کنید'),
    quantity: strictInt('تعداد مسافر', 1, 9, 'حداقل ۱ مسافر', 'حداکثر ۹ مسافر'),
    ...customer
  }),
  z.object({
    type: z.literal('hotel'),
    itemId: z.number({ required_error: 'یک هتل انتخاب کنید', invalid_type_error: 'یک هتل انتخاب کنید' }).int().positive('یک هتل انتخاب کنید'),
    quantity: strictInt('تعداد اتاق', 1, 9, 'حداقل ۱ اتاق', 'حداکثر ۹ اتاق'),
    checkIn: isoDate('تاریخ ورود'),
    checkOut: isoDate('تاریخ خروج'),
    ...customer
  })
]).superRefine((v, ctx) => {
  if (v.type !== 'hotel') return
  const nights = (Date.parse(v.checkOut) - Date.parse(v.checkIn)) / 86_400_000
  if (!(nights >= 1)) ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'تاریخ خروج باید بعد از تاریخ ورود باشد' })
  else if (nights > 30) ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'حداکثر اقامت ۳۰ شب است' })
})
export type BookingInput = z.infer<typeof bookingSchema>

export const bookingStatusSchema = z.object({
  status: z.literal('cancelled', { errorMap: () => ({ message: 'فقط لغو رزرو پشتیبانی می‌شود' }) })
})

export const loginSchema = z.object({
  email: z.string({ required_error: 'ایمیل الزامی است', invalid_type_error: 'ایمیل الزامی است' }).trim().toLowerCase().max(120).email('ایمیل معتبر وارد کنید'),
  password: z.string({ required_error: 'رمز عبور الزامی است', invalid_type_error: 'رمز عبور الزامی است' })
    .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد').max(128, 'رمز عبور خیلی طولانی است')
})

export const listQuerySchema = z.object({
  q: z.string().trim().max(60).regex(NO_CONTROL, 'عبارت جستجو معتبر نیست').optional().default(''),
  page: int('صفحه', 1, 10_000, 'صفحه نامعتبر', 'صفحه نامعتبر').optional().default(1),
  limit: int('تعداد', 1, 100, 'تعداد نامعتبر', 'حداکثر ۱۰۰ ردیف').optional().default(10),
  sort: z.string().max(30).optional(),
  dir: z.enum(['asc', 'desc']).optional().default('asc'),
  status: z.enum(['confirmed', 'cancelled']).optional(),
  type: z.enum(['flight', 'hotel']).optional()
})
