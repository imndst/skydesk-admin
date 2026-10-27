import { describe, it, expect } from 'vitest'
import { BASE, call } from './helpers'
import { DEFAULT_THEME, THEME_PRESETS, buildThemeCss, buildUiAppConfig, designTokens, parseTheme } from '../shared/theme'
import { contrastRatio } from '../shared/contrast'

const clone = <T>(v: T): T => structuredClone(v)

describe('theme engine (pure functions)', () => {
  it('maps settings to Nuxt UI defaults: no styling props needed in pages', () => {
    const t = clone(DEFAULT_THEME)
    t.button = { color: 'secondary', variant: 'outline', size: 'xl', radius: 'full', weight: 'bold', shadow: 'md' }
    const ui = buildUiAppConfig(t)
    expect(ui.button.defaultVariants).toEqual({ color: 'secondary', variant: 'outline', size: 'xl' })
    expect(ui.button.slots.base).toBe('rounded-full font-bold shadow-md')
    for (const k of ['input', 'textarea', 'inputNumber', 'select', 'selectMenu'] as const) {
      expect(ui[k].defaultVariants).toEqual({ color: t.field.color, variant: t.field.variant, size: t.field.size })
    }
    expect(ui.colors.primary).toBe('sdprimary')
  })
  it('emits CSS tokens with the exact brand hex as shade 500', () => {
    const css = buildThemeCss(DEFAULT_THEME)
    expect(css).toContain('--color-sdprimary-500: #1149a6;')
    expect(css).toContain(`--color-sdsecondary-500: ${DEFAULT_THEME.colors.secondary};`)
    expect(css).toMatch(/--color-sdprimary-50: color-mix\(in oklab, #1149a6 8%, #fff\);/)
    expect(css).toContain('--sd-page: #eef2f9;')
  })
  it('default palette passes WCAG AA for white text on solid buttons', () => {
    for (const k of ['primary', 'secondary', 'info', 'success', 'error'] as const) {
      expect(contrastRatio('#ffffff', DEFAULT_THEME.colors[k]), k).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrastRatio(DEFAULT_THEME.colors.muted, DEFAULT_THEME.colors.page)).toBeGreaterThanOrEqual(4.5)
  })
  it('every preset is valid', () => {
    for (const p of THEME_PRESETS) expect(parseTheme(p.theme).success, p.id).toBe(true)
  })
  it('fills missing keys from defaults (forward compatible) and rejects bad values', () => {
    expect(parseTheme({ button: { size: 'sm' } }).success).toBe(true)
    expect(parseTheme({ colors: { primary: 'red' } }).success).toBe(false)
    expect(parseTheme({ button: { size: 'huge' } }).success).toBe(false)
  })
  it('CSS can only contain validated hex values (no CSS injection even if called with bad data)', () => {
    const evil: any = clone(DEFAULT_THEME)
    evil.colors.primary = 'red;}</style><script>alert(1)</script>'
    const css = buildThemeCss(evil)
    expect(css).not.toContain('<')
    expect(css).not.toContain('alert')
    expect(css).toContain('#1149a6') // fell back to defaults
  })
  it('exports W3C design tokens', () => {
    const t = designTokens(DEFAULT_THEME)
    expect(t.color.primary).toEqual({ $type: 'color', $value: '#1149a6' })
    expect(t.component.button.size).toBe('lg')
  })
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21)
    expect(contrastRatio('#ffffff', '#1149a6')).toBeGreaterThan(4.5)
  })
})

describe('theme API', () => {
  it('GET is public (the login page is themed) and supports ETag', async () => {
    const r = await call('GET', '/api/theme', undefined, { auth: false })
    expect(r.status).toBe(200)
    expect(r.json.settings.colors.primary).toMatch(/^#[0-9a-f]{6}$/)
    const etag = r.headers.get('etag')!
    const again = await fetch(`${BASE}/api/theme`, { headers: { 'if-none-match': etag } })
    expect(again.status).toBe(304)
  })
  it('PUT requires sign-in and the CSRF header', async () => {
    expect((await call('PUT', '/api/theme', { version: 0, settings: DEFAULT_THEME }, { auth: false })).status).toBe(401)
    expect((await call('PUT', '/api/theme', { version: 0, settings: DEFAULT_THEME }, { headers: { 'x-requested-with': '' } })).status).toBe(403)
  })
  it('saves, bumps the version, and is served to everyone (SSR <style> + rendered buttons)', async () => {
    const cur = (await call('GET', '/api/theme')).json
    const s = clone(cur.settings)
    s.colors.primary = '#AA0011' // upper case is normalised
    s.button.radius = 'full'
    s.button.weight = 'bold'
    const r = await call('PUT', '/api/theme', { version: cur.version, settings: s })
    expect(r.status).toBe(200)
    expect(r.json.version).toBe(cur.version + 1)
    expect(r.json.settings.colors.primary).toBe('#aa0011')

    const html = await (await fetch(`${BASE}/login`)).text()
    expect(html).toContain('--color-sdprimary-500: #aa0011;')
    const submit = /<button[^>]*type="submit"[^>]*class="([^"]*)"/.exec(html)?.[1] ?? ''
    expect(submit).toContain('rounded-full')
    expect(submit).toContain('font-bold')
  })
  it('rejects a stale version with 409 (two admins editing at once)', async () => {
    const cur = (await call('GET', '/api/theme')).json
    const r = await call('PUT', '/api/theme', { version: cur.version - 1, settings: cur.settings })
    expect(r.status).toBe(409)
  })
  it.each([
    ['CSS injection in a color', { colors: { primary: 'red;} body{display:none' } }, 'settings.colors.primary'],
    ['url() in a color', { colors: { page: 'url(https://evil.example/x.png)' } }, 'settings.colors.page'],
    ['unknown enum value', { button: { size: 'gigantic' } }, 'settings.button.size'],
    ['class name injection', { button: { radius: 'rounded-full hidden' } }, 'settings.button.radius'],
    ['HTML in the brand name', { brand: { name: '<img src=x onerror=alert(1)>' } }, 'settings.brand.name'],
    ['boolean as string', { badge: { pill: 'yes' } }, 'settings.badge.pill']
  ])('rejects %s', async (_n, patch, path) => {
    const cur = (await call('GET', '/api/theme')).json
    const s: any = clone(cur.settings)
    for (const [k, v] of Object.entries(patch)) s[k] = { ...s[k], ...(v as object) }
    const r = await call('PUT', '/api/theme', { version: cur.version, settings: s })
    expect(r.status).toBeGreaterThanOrEqual(400)
    if (r.status === 422) expect(r.json.data.fieldErrors.map((f: any) => f.path)).toContain(path)
  })
  it('strips unknown keys (cannot smuggle extra CSS through new fields)', async () => {
    const cur = (await call('GET', '/api/theme')).json
    const r = await call('PUT', '/api/theme', { version: cur.version, settings: { ...cur.settings, customCss: 'body{display:none}' } })
    expect(r.status).toBe(200)
    expect(r.json.settings.customCss).toBeUndefined()
  })
  it('restores the defaults', async () => {
    const cur = (await call('GET', '/api/theme')).json
    const r = await call('PUT', '/api/theme', { version: cur.version, settings: DEFAULT_THEME })
    expect(r.json.settings).toEqual(DEFAULT_THEME)
  })
})
