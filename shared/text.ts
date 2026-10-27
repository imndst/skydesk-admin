import { z } from 'zod'

/** Persian (۰-۹) and Arabic-Indic (٠-٩) digits → ASCII, so users can type numbers on a Persian keyboard. */
export const normalizeDigits = (v: unknown) => typeof v !== 'string'
  ? v
  : v.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0)).replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))

// No control characters and no angle brackets: blocks HTML/script injection at the door.
// (Vue escapes on output as the second layer, CSP is the third.)
export const NO_CONTROL = /^[^\u0000-\u001F\u007F<>]*$/

export const safeText = (min: number, max: number, label: string) =>
  z.string({ required_error: `${label} الزامی است`, invalid_type_error: `${label} الزامی است` })
    .trim()
    .min(min, `${label} باید حداقل ${min.toLocaleString('fa-IR')} کاراکتر باشد`)
    .max(max, `${label} باید حداکثر ${max.toLocaleString('fa-IR')} کاراکتر باشد`)
    .regex(NO_CONTROL, `${label} شامل کاراکترهای غیرمجاز است`)
