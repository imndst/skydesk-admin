import { DEFAULT_THEME, buildUiAppConfig } from '#shared/theme'

// Build-time defaults. At runtime app/plugins/theme.ts overrides these with the admin's saved settings.
export default defineAppConfig({
  ui: buildUiAppConfig(DEFAULT_THEME)
})
