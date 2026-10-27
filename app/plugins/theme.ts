import { buildThemeCss, buildUiAppConfig } from '#shared/theme'
import { useTheme } from '~/composables/useTheme'
import type { ThemeResponse } from '#shared/types'

/** Loads the admin's saved theme and applies it to the whole app (tokens → CSS vars, defaults → Nuxt UI app.config). */
export default defineNuxtPlugin({
  name: 'skydesk-theme',
  async setup() {
    const { saved, active } = useTheme()

    if (import.meta.server) {
      try {
        const res = await useRequestFetch()<ThemeResponse>('/api/theme')
        if (res) { saved.value = res; active.value = structuredClone(res.settings) }
      } catch { /* fall back to defaults */ }
    }

    // app.config is not part of the payload, so apply on both server and client
    updateAppConfig({ ui: buildUiAppConfig(active.value) } as any)

    useHead({
      style: [{ id: 'sd-theme', key: 'sd-theme', tagPriority: 'critical', innerHTML: computed(() => buildThemeCss(active.value)) }]
    })

    if (import.meta.client) {
      const colorMode = useColorMode()
      watch(() => active.value.layout.colorMode, (m) => { colorMode.preference = m }, { immediate: true })
    }
  }
})
