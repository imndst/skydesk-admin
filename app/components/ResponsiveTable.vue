<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * Semantic <table> from md up, stacked cards below md. Same data, two layouts, no horizontal page scroll.
 * Slots: cell-<key>="{ row }", actions="{ row }", card-title="{ row }"
 */
interface Col { key: string, label: string, class?: string, card?: boolean /* false = hide on mobile card (already in its title) */ }
defineProps<{ columns: Col[], rows: T[], loading?: boolean, emptyTitle: string, emptyHint?: string, rowKey?: string }>()
defineSlots<Record<string, (p: { row: T }) => any>>()
</script>

<template>
  <div class="sd-min-w-0">
    <UCard v-if="!rows.length && !loading">
      <div class="flex flex-col items-center gap-1 py-8 text-center">
        <UIcon name="i-lucide-inbox" class="size-8 text-dimmed" />
        <p class="font-medium text-highlighted">{{ emptyTitle }}</p>
        <p v-if="emptyHint" class="text-sm text-muted">{{ emptyHint }}</p>
      </div>
    </UCard>

    <template v-else>
      <!-- Desktop / tablet -->
      <UCard class="hidden md:block" :ui="{ body: 'p-0 sm:p-0' }" :aria-busy="loading">
        <div class="overflow-x-auto">
          <table class="w-full table-auto border-collapse text-start text-sm">
            <thead class="bg-elevated/50 text-muted">
              <tr>
                <th v-for="c in columns" :key="c.key" scope="col" class="whitespace-nowrap px-4 py-3 text-start font-medium" :class="c.class">{{ c.label }}</th>
                <th v-if="$slots.actions" scope="col" class="px-4 py-3"><span class="sr-only">عملیات</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="row in rows" :key="row[rowKey ?? 'id']" class="hover:bg-elevated/40">
                <td v-for="c in columns" :key="c.key" class="px-4 py-3 align-middle" :class="c.class">
                  <slot :name="`cell-${c.key}`" :row="row">{{ row[c.key] }}</slot>
                </td>
                <td v-if="$slots.actions" class="whitespace-nowrap px-4 py-3">
                  <div class="flex justify-end gap-2"><slot name="actions" :row="row" /></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Mobile -->
      <ul class="flex flex-col gap-3 md:hidden" :aria-busy="loading">
        <li v-for="row in rows" :key="row[rowKey ?? 'id']">
          <UCard>
            <div v-if="$slots['card-title']" class="mb-3 font-semibold text-highlighted"><slot name="card-title" :row="row" /></div>
            <dl class="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              <template v-for="c in columns.filter(c => c.card !== false)" :key="c.key">
                <dt class="text-muted">{{ c.label }}</dt>
                <dd class="sd-min-w-0 break-words text-end"><slot :name="`cell-${c.key}`" :row="row">{{ row[c.key] }}</slot></dd>
              </template>
            </dl>
            <div v-if="$slots.actions" class="mt-4 flex flex-wrap justify-end gap-2 border-t border-default pt-3"><slot name="actions" :row="row" /></div>
          </UCard>
        </li>
      </ul>
    </template>
  </div>
</template>
