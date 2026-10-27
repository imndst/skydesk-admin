import { DEFAULT_THEME, buildUiAppConfig, themeSchema, type Theme } from '#shared/theme'
import type { ThemeResponse } from '#shared/types'

/**
 * saved  = what is stored on the server
 * active = what is rendered right now (the settings page writes drafts here for live preview)
 */
export function useTheme() {
  const saved = useState<ThemeResponse>('theme:saved', () => ({ version: 0, updatedAt: null, settings: structuredClone(DEFAULT_THEME) }))
  const active = useState<Theme>('theme:active', () => structuredClone(DEFAULT_THEME))

  /** Apply a theme to the whole app. Ignores invalid drafts (e.g. a half-typed hex) so the UI never flickers. */
  function apply(t: Theme) {
    if (!themeSchema.safeParse(t).success) return false
    active.value = structuredClone(toRaw(t))
    updateAppConfig({ ui: buildUiAppConfig(active.value) } as any)
    return true
  }
  function revert() { apply(saved.value.settings) }

  return { saved, active, apply, revert }
}
