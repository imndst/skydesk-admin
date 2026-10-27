import { z } from 'zod'
import { themeSchema } from '#shared/theme'
import { writeTheme } from '../utils/theme'
import { parseBody } from '../utils/http'

const bodySchema = z.object({
  version: z.number({ required_error: 'نسخه الزامی است', invalid_type_error: 'نسخه نامعتبر است' }).int().min(0),
  settings: themeSchema
})

export default defineEventHandler(async (event) => {
  const { version, settings } = await parseBody(event, bodySchema)
  const saved = writeTheme(settings, version, event.context.session.email)
  if (!saved) {
    throw createError({ statusCode: 409, statusMessage: 'تنظیمات در این فاصله توسط مدیر دیگری تغییر کرده است. صفحه را تازه کنید.' })
  }
  return { version: saved.version, updatedAt: saved.updatedAt, settings: saved.settings }
})
