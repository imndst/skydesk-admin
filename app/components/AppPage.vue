<script setup lang="ts">
import BottomNav from '~/components/BottomNav.vue'
/** Page shell: themed header band + scrolling body + bottom nav on small screens. All in normal flow. */
defineProps<{ id: string, title: string }>()
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col">
    <header class="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-(--sd-header-border) bg-(--sd-header-bg) px-4 text-(--sd-header-fg) sm:px-6">
      <h1 class="min-w-0 truncate text-base font-bold sm:text-lg">{{ title }}</h1>
      <div class="flex shrink-0 items-center gap-1.5"><slot name="actions" /></div>
    </header>
    <main :id="id" class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
      <slot />
    </main>
    <BottomNav class="lg:hidden" />
  </section>
</template>
