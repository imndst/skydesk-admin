<script setup lang="ts">
defineProps<{ label: string, value: string | number, icon: string, hint?: string }>()
</script>

<template>
  <UCard>
    <div class="flex min-w-0 items-start gap-3">
      <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><UIcon :name="icon" class="size-5" /></span>
      <div class="sd-min-w-0 flex-1">
        <p class="truncate text-sm text-muted">{{ label }}</p>
        <p class="text-xl font-bold leading-tight text-highlighted [overflow-wrap:anywhere] sm:text-2xl xl:text-xl 2xl:text-2xl">{{ value }}</p>
        <p v-if="hint" class="mt-1 text-xs text-muted">{{ hint }}</p>
      </div>
    </div>
  </UCard>
</template>
