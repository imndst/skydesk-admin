import {
  BADGE_VARIANTS, BASE_RADII, BUTTON_VARIANTS, CARD_VARIANTS, FIELD_VARIANTS, NEUTRALS, RADII, SIZES, UI_COLORS
} from '#shared/theme'

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>) => values.map(v => ({ value: v, label: labels[v] }))

export const COLOR_LABEL = { primary: 'اصلی', secondary: 'تأکیدی', success: 'موفقیت', info: 'اطلاعات', warning: 'هشدار', error: 'خطا', neutral: 'خنثی' } as const
export const colorOptions = opts(UI_COLORS, COLOR_LABEL)
export const sizeOptions = opts(SIZES, { xs: 'خیلی کوچک', sm: 'کوچک', md: 'متوسط', lg: 'بزرگ', xl: 'خیلی بزرگ' })
export const badgeSizeOptions = opts(['sm', 'md', 'lg'] as const, { sm: 'کوچک', md: 'متوسط', lg: 'بزرگ' })
export const radiusOptions = opts(RADII, { inherit: 'پیش‌فرض سراسری', none: 'بدون گردی', sm: 'کم', md: 'متوسط', lg: 'زیاد', xl: 'خیلی زیاد', full: 'کاملاً گرد' })
export const baseRadiusOptions = opts(BASE_RADII, { none: 'بدون گردی', sm: 'کم', md: 'متوسط', lg: 'زیاد', xl: 'خیلی زیاد' })
export const neutralOptions = opts(NEUTRALS, { slate: 'آبی‌خاکستری', gray: 'خاکستری', zinc: 'روی', neutral: 'خنثی', stone: 'سنگی' })
export const buttonVariantOptions = opts(BUTTON_VARIANTS, { solid: 'توپُر', outline: 'حاشیه‌دار', soft: 'ملایم', subtle: 'ملایم با حاشیه', ghost: 'شفاف', link: 'لینک' })
export const fieldVariantOptions = opts(FIELD_VARIANTS, { outline: 'حاشیه‌دار', soft: 'پس‌زمینه‌ی ملایم', subtle: 'ملایم با حاشیه', ghost: 'شفاف', none: 'بدون استایل' })
export const cardVariantOptions = opts(CARD_VARIANTS, { outline: 'حاشیه‌دار', soft: 'ملایم', subtle: 'ملایم با حاشیه', solid: 'توپُر (معکوس)' })
export const badgeVariantOptions = opts(BADGE_VARIANTS, { solid: 'توپُر', outline: 'حاشیه‌دار', soft: 'ملایم', subtle: 'ملایم با حاشیه' })
export const weightOptions = opts(['medium', 'semibold', 'bold'] as const, { medium: 'معمولی', semibold: 'نیمه‌پررنگ', bold: 'پررنگ' })
export const labelWeightOptions = opts(['normal', 'medium', 'semibold'] as const, { normal: 'نازک', medium: 'معمولی', semibold: 'نیمه‌پررنگ' })
export const btnShadowOptions = opts(['none', 'sm', 'md'] as const, { none: 'بدون سایه', sm: 'سایه‌ی کم', md: 'سایه‌ی متوسط' })
export const cardShadowOptions = opts(['none', 'sm', 'md', 'lg'] as const, { none: 'بدون سایه', sm: 'کم', md: 'متوسط', lg: 'زیاد' })
export const fontOptions = opts(['vazirmatn', 'system'] as const, { vazirmatn: 'وزیرمتن', system: 'فونت سیستم' })
export const scaleOptions = opts(['sm', 'md', 'lg'] as const, { sm: 'فشرده (۱۵px)', md: 'استاندارد (۱۶px)', lg: 'بزرگ (۱۷px)' })
export const colorModeOptions = opts(['system', 'light', 'dark'] as const, { system: 'انتخاب کاربر (پیش‌فرض سیستم)', light: 'همیشه روشن', dark: 'همیشه تیره' })
export const headerOptions = opts(['brand', 'plain'] as const, { brand: 'نوار رنگی برند', plain: 'ساده (هم‌رنگ سطح)' })
