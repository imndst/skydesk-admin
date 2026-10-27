<script setup lang="ts">
import { fa, toman } from '~/utils/api'
import type { DashboardData } from '#shared/types'
import AppPage from '~/components/AppPage.vue'
import StatCard from '~/components/StatCard.vue'
useHead({ title: 'داشبورد' })
const { data, error } = await useFetch<DashboardData>('/api/dashboard')
const max = computed(() => Math.max(1, ...(data.value?.last7.map(d => d.amount) ?? [0])))
const weekday = (d: string) => new Intl.DateTimeFormat('fa-IR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(d))
</script>

<template>
  <AppPage id="dashboard" title="داشبورد">
    <UAlert v-if="error" color="error" variant="subtle" title="بارگذاری داشبورد انجام نشد" :description="error.statusMessage" />
    <div v-else-if="data" class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="درآمد" :value="toman(data.revenue)" icon="i-lucide-banknote" :hint="`پرواز ${toman(data.flightRevenue)}، هتل ${toman(data.hotelRevenue)}`" />
        <StatCard label="رزروهای قطعی" :value="fa(data.confirmed)" icon="i-lucide-ticket-check" :hint="`${fa(data.cancelled)} لغو شده`" />
        <StatCard label="صندلی خالی" :value="fa(data.seatsAvailable)" icon="i-lucide-armchair" :hint="`${fa(data.flights)} پرواز`" />
        <StatCard label="اتاق خالی" :value="fa(data.roomsAvailable)" icon="i-lucide-bed-double" :hint="`${fa(data.hotels)} هتل`" />
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <UCard class="sd-min-w-0 xl:col-span-2">
          <template #header><h2 id="rev-h" class="font-bold text-highlighted">درآمد ۷ روز اخیر</h2></template>
          <ol class="grid h-44 grid-cols-7 items-end gap-2" aria-labelledby="rev-h">
            <li v-for="d in data.last7" :key="d.day" class="flex h-full min-w-0 flex-col justify-end" :title="`${weekday(d.day)}: ${toman(d.amount)}`">
              <span class="w-full rounded-t bg-primary" :style="{ height: `${Math.max(2, (d.amount / max) * 100)}%` }" role="img" :aria-label="`${weekday(d.day)} ${toman(d.amount)}`" />
            </li>
          </ol>
          <ol class="mt-2 grid grid-cols-7 gap-2 text-center text-xs text-muted">
            <li v-for="d in data.last7" :key="d.day" class="truncate">{{ weekday(d.day) }}</li>
          </ol>
        </UCard>

        <UCard class="sd-min-w-0 xl:col-span-3">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-bold text-highlighted">آخرین رزروها</h2>
              <UButton to="/bookings" label="مشاهده همه" color="neutral" variant="link" />
            </div>
          </template>
          <ul class="divide-y divide-default">
            <li v-for="b in data.recent" :key="b.id" class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div class="sd-min-w-0">
                <p class="truncate font-medium text-highlighted">{{ b.customerName }}</p>
                <p class="truncate text-sm text-muted">{{ b.itemLabel }}</p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <p class="font-bold text-primary">{{ toman(b.total) }}</p>
                <UBadge :label="b.status === 'confirmed' ? 'قطعی' : 'لغو شده'" :color="b.status === 'confirmed' ? 'success' : 'neutral'" />
              </div>
            </li>
          </ul>
        </UCard>
      </div>
    </div>
  </AppPage>
</template>
