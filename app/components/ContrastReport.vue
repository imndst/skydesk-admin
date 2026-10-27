<script setup lang="ts">
import { contrastRatio, contrastLevel } from '#shared/contrast'
import type { Theme } from '#shared/theme'
import { fa } from '~/utils/api'

const props = defineProps<{ theme: Theme }>()
const rows = computed(() => {
  const c = props.theme.colors
  return [
    { label: 'متن روی سطح', fg: c.text, bg: c.surface, min: 4.5 },
    { label: 'متن کم‌رنگ روی سطح', fg: c.muted, bg: c.surface, min: 4.5 },
    { label: 'متن روی پس‌زمینه‌ی صفحه', fg: c.text, bg: c.page, min: 4.5 },
    { label: 'سفید روی رنگ اصلی', fg: '#ffffff', bg: c.primary, min: 4.5 },
    { label: 'سفید روی رنگ تأکیدی', fg: '#ffffff', bg: c.secondary, min: 3 },
    { label: 'سفید روی رنگ اطلاعات', fg: '#ffffff', bg: c.info, min: 3 },
    { label: 'سفید روی رنگ موفقیت', fg: '#ffffff', bg: c.success, min: 3 },
    { label: 'سفید روی رنگ خطا', fg: '#ffffff', bg: c.error, min: 3 },
    ...(props.theme.layout.header === 'brand' ? [{ label: 'متن سربرگ', fg: c.headerFg, bg: c.headerBg, min: 3 }] : [])
  ].map(r => ({ ...r, ratio: contrastRatio(r.fg, r.bg) }))
})
const failing = computed(() => rows.value.filter(r => r.ratio < r.min).length)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-bold text-highlighted">بررسی خوانایی (کنتراست WCAG)</h3>
        <UBadge :color="failing ? 'warning' : 'success'" :label="failing ? `${fa(failing)} مورد ضعیف` : 'همه مناسب'" />
      </div>
    </template>
    <ul class="divide-y divide-default text-sm">
      <li v-for="r in rows" :key="r.label" class="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
        <span class="flex min-w-0 items-center gap-2">
          <span class="grid size-7 shrink-0 place-items-center rounded-md border border-default text-xs font-bold" :style="{ background: r.bg, color: r.fg }" aria-hidden="true">آ</span>
          <span class="truncate">{{ r.label }}</span>
        </span>
        <span class="flex shrink-0 items-center gap-2">
          <span class="sd-ltr text-muted">{{ r.ratio.toFixed(2) }}:1</span>
          <UBadge :color="r.ratio >= r.min ? 'success' : 'error'" :label="r.ratio >= r.min ? (contrastLevel(r.ratio) === 'AA' ? 'AA' : 'AA متن درشت') : 'ضعیف'" />
        </span>
      </li>
    </ul>
  </UCard>
</template>
