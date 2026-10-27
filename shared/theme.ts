import { z } from 'zod'
import { safeText } from './text'

/* ═══════════════════════════════════════════════════════════════════════════
 * THEME = DESIGN TOKENS + COMPONENT DEFAULTS
 *
 *   Admin settings (DB, validated by themeSchema)
 *        │
 *        ├─► buildThemeCss()      → CSS custom properties  (colors, radius, font, scale)
 *        └─► buildUiAppConfig()   → Nuxt UI app.config.ui  (default color/variant/size + slot classes)
 *
 * Pages then write  <UButton label="ذخیره" />  with NO styling props: color, size,
 * variant, radius, weight, shadow all come from here. Pages only pass *meaning*
 * (color="error" for destructive, color="neutral" variant="outline" for "cancel").
 *
 * Security: every value that reaches CSS is either a validated #rrggbb hex or a
 * value looked up from a fixed map below. Raw user strings never reach CSS or classes.
 * ═══════════════════════════════════════════════════════════════════════════ */

// ── option lists (also drive the settings UI) ────────────────────────────────
export const SEMANTIC_COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error'] as const
export const UI_COLORS = [...SEMANTIC_COLORS, 'neutral'] as const
export const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
export const RADII = ['inherit', 'none', 'sm', 'md', 'lg', 'xl', 'full'] as const
export const BASE_RADII = ['none', 'sm', 'md', 'lg', 'xl'] as const
export const NEUTRALS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const
export const BUTTON_VARIANTS = ['solid', 'outline', 'soft', 'subtle', 'ghost', 'link'] as const
export const FIELD_VARIANTS = ['outline', 'soft', 'subtle', 'ghost', 'none'] as const
export const CARD_VARIANTS = ['outline', 'soft', 'subtle', 'solid'] as const
export const BADGE_VARIANTS = ['solid', 'outline', 'soft', 'subtle'] as const

const hex = (label: string) => z.string({ required_error: `${label} الزامی است`, invalid_type_error: `${label} الزامی است` })
  .trim().toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, `${label} باید کد رنگ شش‌رقمی باشد، مثل ‎#1149a6`)

export const themeSchema = z.object({
  brand: z.object({ name: safeText(2, 32, 'نام برند') }),
  colors: z.object({
    primary: hex('رنگ اصلی'),
    secondary: hex('رنگ تأکیدی'),
    success: hex('رنگ موفقیت'),
    info: hex('رنگ اطلاعات'),
    warning: hex('رنگ هشدار'),
    error: hex('رنگ خطا'),
    page: hex('پس‌زمینه صفحه'),
    surface: hex('پس‌زمینه سطح‌ها'),
    border: hex('رنگ حاشیه'),
    text: hex('رنگ متن'),
    muted: hex('رنگ متن کم‌رنگ'),
    headerBg: hex('پس‌زمینه سربرگ'),
    headerFg: hex('رنگ متن سربرگ')
  }),
  neutral: z.enum(NEUTRALS),
  typography: z.object({ font: z.enum(['vazirmatn', 'system']), scale: z.enum(['sm', 'md', 'lg']) }),
  shape: z.object({ radius: z.enum(BASE_RADII) }),
  layout: z.object({ colorMode: z.enum(['system', 'light', 'dark']), header: z.enum(['brand', 'plain']) }),
  button: z.object({
    color: z.enum(UI_COLORS), variant: z.enum(BUTTON_VARIANTS), size: z.enum(SIZES),
    radius: z.enum(RADII), weight: z.enum(['medium', 'semibold', 'bold']), shadow: z.enum(['none', 'sm', 'md'])
  }),
  field: z.object({
    color: z.enum(UI_COLORS), variant: z.enum(FIELD_VARIANTS), size: z.enum(SIZES),
    radius: z.enum(RADII), labelWeight: z.enum(['normal', 'medium', 'semibold'])
  }),
  card: z.object({ variant: z.enum(CARD_VARIANTS), radius: z.enum(RADII), shadow: z.enum(['none', 'sm', 'md', 'lg']) }),
  badge: z.object({ variant: z.enum(BADGE_VARIANTS), size: z.enum(['sm', 'md', 'lg']), pill: z.boolean({ invalid_type_error: 'مقدار نامعتبر' }) }),
  tabs: z.object({ size: z.enum(SIZES), radius: z.enum(RADII) }),
  modal: z.object({ radius: z.enum(RADII), blur: z.boolean({ invalid_type_error: 'مقدار نامعتبر' }) })
})
export type Theme = z.infer<typeof themeSchema>

// ── defaults: a travel-booking blue/orange palette, tuned to pass WCAG AA ───
// The brighter reference colors (#e67e00 orange, #3b82f6 blue) give white text only 2.9:1 and 3.7:1.
// Default = same hues, deep enough for 4.5:1. The bright palette is kept as the "کلاسیک روشن" preset.
export const DEFAULT_THEME: Theme = {
  brand: { name: 'اسکای‌دسک' },
  colors: {
    primary: '#1149a6', // deep blue: active segmented tab "هتل داخلی"
    secondary: '#b45f06', // orange: "جستجو" / "تغییر تاریخ"  (site: #e67e00)
    success: '#13733a', // rating badge green
    info: '#2563eb', // "جزئیات و خرید" button  (site: #3b82f6)
    warning: '#b45309',
    error: '#b91c1c',
    page: '#eef2f9', // light blue-grey page
    surface: '#ffffff', // white cards and fields
    border: '#e2e8f0',
    text: '#1f2937',
    muted: '#5b6472',
    headerBg: '#1a73e8', // bright blue header band
    headerFg: '#ffffff'
  },
  neutral: 'slate',
  typography: { font: 'vazirmatn', scale: 'md' },
  shape: { radius: 'md' },
  layout: { colorMode: 'light', header: 'brand' },
  button: { color: 'primary', variant: 'solid', size: 'lg', radius: 'lg', weight: 'medium', shadow: 'none' },
  field: { color: 'primary', variant: 'outline', size: 'lg', radius: 'lg', labelWeight: 'medium' },
  card: { variant: 'outline', radius: 'xl', shadow: 'sm' },
  badge: { variant: 'subtle', size: 'md', pill: false },
  tabs: { size: 'lg', radius: 'lg' },
  modal: { radius: 'xl', blur: true }
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }
const merge = <T>(base: T, over: DeepPartial<T>): T => {
  const out: any = structuredClone(base)
  for (const [k, v] of Object.entries(over ?? {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(out[k], v as any) : v
  }
  return out
}

export const THEME_PRESETS: { id: string, label: string, description: string, theme: Theme }[] = [
  { id: 'classic', label: 'کلاسیک', description: 'آبی و نارنجی، خوانا (WCAG AA)', theme: DEFAULT_THEME },
  {
    id: 'classic-bright', label: 'کلاسیک روشن', description: 'نارنجی روشن‌تر؛ کنتراست متن سفید کمتر از AA',
    theme: merge(DEFAULT_THEME, { colors: { secondary: '#e67e00', info: '#3b82f6', success: '#15803d', warning: '#d97706', error: '#dc2626', muted: '#6b7280' } })
  },
  {
    id: 'emerald', label: 'زمرد', description: 'سبز و کهربایی، گوشه‌های گرد',
    theme: merge(DEFAULT_THEME, {
      colors: { primary: '#047857', secondary: '#d97706', info: '#0891b2', headerBg: '#065f46', page: '#f0f7f4' },
      neutral: 'stone', button: { radius: 'full' }, field: { variant: 'soft' }, badge: { pill: true }
    })
  },
  {
    id: 'minimal', label: 'مینیمال', description: 'سیاه و سفید، سربرگ ساده',
    theme: merge(DEFAULT_THEME, {
      colors: { primary: '#111827', secondary: '#2563eb', info: '#2563eb', page: '#f8fafc', headerBg: '#ffffff', headerFg: '#111827' },
      neutral: 'zinc', layout: { header: 'plain' }, button: { size: 'md', radius: 'md' }, field: { size: 'md', radius: 'md' },
      card: { radius: 'lg', shadow: 'none' }, tabs: { size: 'md', radius: 'md' }, shape: { radius: 'sm' }
    })
  },
  {
    id: 'midnight', label: 'نیمه‌شب', description: 'تیره با بنفش',
    theme: merge(DEFAULT_THEME, {
      colors: { primary: '#6366f1', secondary: '#f59e0b', info: '#38bdf8', headerBg: '#312e81' },
      neutral: 'zinc', layout: { colorMode: 'dark' }, card: { shadow: 'none' }, button: { weight: 'semibold' }
    })
  }
]

/** Fill gaps from DEFAULT_THEME (forward compatible when new settings are added), then validate. */
export function parseTheme(raw: unknown) {
  return themeSchema.safeParse(merge(DEFAULT_THEME, (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as DeepPartial<Theme>))
}
export function normalizeTheme(raw: unknown): Theme {
  const r = parseTheme(raw)
  return r.success ? r.data : DEFAULT_THEME
}

// ── fixed lookup maps: the ONLY things that become CSS/class strings ────────
const RADIUS_CLASS: Record<(typeof RADII)[number], string> = {
  inherit: '', none: 'rounded-none', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', full: 'rounded-full'
}
const BASE_RADIUS_REM: Record<(typeof BASE_RADII)[number], string> = { none: '0rem', sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem' }
const WEIGHT_CLASS = { normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' } as const
const BTN_SHADOW = { none: 'shadow-none', sm: 'shadow-sm', md: 'shadow-md' } as const
const CARD_SHADOW = { none: 'shadow-none', sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg' } as const
const SCALE_PERCENT = { sm: '93.75%', md: '100%', lg: '106.25%' } as const
const FONT_STACK = {
  vazirmatn: '"Vazirmatn Variable", Vazirmatn, Tahoma, ui-sans-serif, system-ui, sans-serif',
  system: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Tahoma, Roboto, sans-serif'
} as const
/** Our palette names; Nuxt UI resolves --ui-color-primary-500 → var(--color-sdprimary-500). */
const PALETTE: Record<(typeof SEMANTIC_COLORS)[number], string> = {
  primary: 'sdprimary', secondary: 'sdsecondary', success: 'sdsuccess', info: 'sdinfo', warning: 'sdwarning', error: 'sderror'
}
const cx = (...c: string[]) => c.filter(Boolean).join(' ')

/** Mix toward white (tints) and black (shades) in OKLab; 500 is the exact brand hex. */
const SHADE_MIX: [number, string, string][] = [
  [50, '#fff', '8%'], [100, '#fff', '16%'], [200, '#fff', '32%'], [300, '#fff', '52%'], [400, '#fff', '76%'],
  [600, '#000', '86%'], [700, '#000', '72%'], [800, '#000', '58%'], [900, '#000', '46%'], [950, '#000', '32%']
]
function shades(name: string, hexValue: string) {
  const lines = [`--color-${name}-500: ${hexValue};`]
  for (const [s, base, pct] of SHADE_MIX) lines.push(`--color-${name}-${s}: color-mix(in oklab, ${hexValue} ${pct}, ${base});`)
  return lines.join('\n  ')
}

/** CSS custom properties for the whole app. Injected once in <head>, updated live. */
export function buildThemeCss(input: Theme): string {
  const t = normalizeTheme(input) // re-validate: defence in depth
  const c = t.colors
  const plain = t.layout.header === 'plain'
  return `:root {
  ${SEMANTIC_COLORS.map(k => shades(PALETTE[k], c[k])).join('\n  ')}
  --ui-radius: ${BASE_RADIUS_REM[t.shape.radius]};
  --font-sans: ${FONT_STACK[t.typography.font]};
  --sd-accent: ${c.secondary};
}
html { font-size: ${SCALE_PERCENT[t.typography.scale]}; font-family: var(--font-sans); }
:root:not(.dark) {
  --ui-bg: ${c.surface};
  --ui-border: ${c.border};
  --ui-border-muted: ${c.border};
  --ui-text-highlighted: ${c.text};
  --ui-text: color-mix(in oklab, ${c.text} 88%, ${c.surface});
  --ui-text-muted: ${c.muted};
  --sd-page: ${c.page};
  --sd-header-bg: ${plain ? c.surface : c.headerBg};
  --sd-header-fg: ${plain ? c.text : c.headerFg};
  --sd-header-border: ${plain ? c.border : 'transparent'};
}
.dark {
  --sd-page: var(--ui-color-neutral-950);
  --sd-header-bg: ${plain ? 'var(--ui-bg)' : `color-mix(in oklab, ${c.headerBg} 40%, var(--ui-color-neutral-950))`};
  --sd-header-fg: #fff;
  --sd-header-border: ${plain ? 'var(--ui-border)' : 'transparent'};
}`
}

/** Nuxt UI app.config `ui` object. Merged into useAppConfig() so every component picks it up. */
export function buildUiAppConfig(input: Theme) {
  const t = normalizeTheme(input)
  const fieldDefaults = { color: t.field.color, variant: t.field.variant, size: t.field.size }
  const field = { defaultVariants: fieldDefaults, slots: { base: RADIUS_CLASS[t.field.radius] } }
  const badgeRadius = t.badge.pill ? 'rounded-full' : ''
  const tabsRadius = RADIUS_CLASS[t.tabs.radius]
  return {
    colors: { ...PALETTE, neutral: t.neutral },
    button: {
      defaultVariants: { color: t.button.color, variant: t.button.variant, size: t.button.size },
      slots: { base: cx(RADIUS_CLASS[t.button.radius], WEIGHT_CLASS[t.button.weight], BTN_SHADOW[t.button.shadow]) }
    },
    input: field,
    textarea: field,
    inputNumber: field,
    select: field,
    selectMenu: field,
    formField: { defaultVariants: { size: t.field.size }, slots: { label: WEIGHT_CLASS[t.field.labelWeight] } },
    card: {
      defaultVariants: { variant: t.card.variant },
      slots: { root: cx(RADIUS_CLASS[t.card.radius], CARD_SHADOW[t.card.shadow]) }
    },
    badge: {
      defaultVariants: { variant: t.badge.variant, size: t.badge.size },
      // badge radius lives in its size variants, so override there
      variants: { size: Object.fromEntries(SIZES.map(s => [s, { base: badgeRadius }])) }
    },
    tabs: {
      defaultVariants: { size: t.tabs.size, color: 'primary', variant: 'pill' },
      variants: { variant: { pill: { list: cx('bg-default ring ring-default', tabsRadius), indicator: tabsRadius, trigger: cx('flex-1 justify-center', tabsRadius) } } }
    },
    modal: {
      slots: { overlay: t.modal.blur ? 'backdrop-blur-sm' : 'backdrop-blur-none' },
      variants: { fullscreen: { false: { content: RADIUS_CLASS[t.modal.radius] } } }
    }
  }
}

/** W3C Design Tokens (DTCG) export, for designers/Figma Tokens Studio. */
export function designTokens(input: Theme) {
  const t = normalizeTheme(input)
  const color = Object.fromEntries(Object.entries(t.colors).map(([k, v]) => [k, { $type: 'color', $value: v }]))
  return {
    $description: `${t.brand.name} design tokens`,
    color,
    radius: { base: { $type: 'dimension', $value: BASE_RADIUS_REM[t.shape.radius] } },
    font: { family: { $type: 'fontFamily', $value: FONT_STACK[t.typography.font] }, scale: { $type: 'number', $value: SCALE_PERCENT[t.typography.scale] } },
    component: {
      button: t.button, field: t.field, card: t.card, badge: t.badge, tabs: t.tabs, modal: t.modal
    }
  }
}
