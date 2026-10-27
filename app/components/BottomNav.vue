<script setup lang="ts">
import { NAV_LINKS } from '~/utils/nav'
/** Mobile/tablet tab bar, in normal document flow at the bottom of the page panel (never overlays content). */
const route = useRoute()
const isActive = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)
</script>

<template>
  <nav aria-label="منوی اصلی" class="sd-safe-bottom shrink-0 border-t border-default bg-default">
    <ul class="grid grid-cols-5">
      <li v-for="l in NAV_LINKS" :key="l.to" class="flex min-w-0 border-default not-first:border-s">
        <NuxtLink
          :to="l.to"
          :aria-current="isActive(l.to) ? 'page' : undefined"
          class="flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          :class="isActive(l.to) ? 'text-primary font-semibold' : 'text-muted hover:text-default'"
        >
          <UIcon :name="l.icon" class="size-6 shrink-0" />
          <span class="max-w-full truncate">{{ l.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
