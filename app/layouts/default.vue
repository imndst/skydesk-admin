<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'
import { api } from '~/utils/api'
import { NAV_LINKS } from '~/utils/nav'
const user = useState<{ email: string } | null>('user')
const { active } = useTheme()
const colorMode = useColorMode()
const toggleDark = () => { colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark' }

async function logout() {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
  user.value = null
  await navigateTo('/login')
}
</script>

<template>
  <!-- App shell: plain flex in normal flow. Sidebar on lg+, bottom bar (inside AppPage) below lg. -->
  <div class="flex h-dvh overflow-hidden bg-(--sd-page)">
    <aside class="hidden w-64 shrink-0 flex-col border-e border-default bg-default lg:flex" aria-label="منوی کناری">
      <div class="flex h-16 shrink-0 items-center gap-2 border-b border-default px-4">
        <UIcon name="i-lucide-plane-takeoff" class="size-6 shrink-0 text-primary" />
        <span class="truncate text-lg font-bold text-highlighted">{{ active.brand.name }}</span>
      </div>
      <nav class="min-h-0 flex-1 overflow-y-auto p-3" aria-label="منوی اصلی">
        <UNavigationMenu :items="NAV_LINKS" orientation="vertical" />
      </nav>
      <div class="flex shrink-0 items-center gap-2 border-t border-default p-3">
        <ClientOnly>
          <UButton
            v-if="active.layout.colorMode === 'system'" color="neutral" variant="ghost"
            :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
            :aria-label="colorMode.value === 'dark' ? 'حالت روشن' : 'حالت تیره'" @click="toggleDark"
          />
        </ClientOnly>
        <p class="sd-min-w-0 sd-ltr flex-1 truncate text-end text-sm text-muted" :title="user?.email">{{ user?.email }}</p>
        <UButton color="neutral" variant="ghost" icon="i-lucide-log-out" aria-label="خروج" @click="logout" />
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <slot />
    </div>
  </div>
</template>
