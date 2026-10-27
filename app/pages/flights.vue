<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import { api, apiError, fa, fmtDateTime, toman } from '~/utils/api'
import type { Flight, Paged } from '#shared/types'
import AppPage from '~/components/AppPage.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import FlightFormModal from '~/components/FlightFormModal.vue'
import ResponsiveTable from '~/components/ResponsiveTable.vue'
useHead({ title: 'پروازها' })
const toast = useToast()
const q = ref('')
const search = ref('')
const page = ref(1)
const limit = 10
const sortKey = ref('departure:asc')
let timer: ReturnType<typeof setTimeout>
watch(q, (v) => { clearTimeout(timer); timer = setTimeout(() => { search.value = v.trim(); page.value = 1 }, 250) })
watch(sortKey, () => { page.value = 1 })

const query = computed(() => { const [sort, dir] = sortKey.value.split(':'); return { q: search.value, page: page.value, limit, sort, dir } })
const { data, status, refresh } = await useFetch<Paged<Flight>>('/api/flights', { query })

const columns = [
  { key: 'flightNumber', label: 'پرواز', card: false }, { key: 'route', label: 'مسیر' }, { key: 'departureAt', label: 'زمان حرکت' },
  { key: 'price', label: 'قیمت' }, { key: 'seatsAvailable', label: 'صندلی خالی' }
]
const sortItems = [
  { label: 'زودترین حرکت', value: 'departure:asc' }, { label: 'دیرترین حرکت', value: 'departure:desc' },
  { label: 'ارزان‌ترین', value: 'price:asc' }, { label: 'گران‌ترین', value: 'price:desc' }, { label: 'نام ایرلاین', value: 'airline:asc' }
]

const formOpen = ref(false)
const editing = ref<Flight | null>(null)
const openForm = (f: Flight | null) => { editing.value = f; formOpen.value = true }

const delOpen = ref(false)
const deleting = ref<Flight | null>(null)
const delLoading = ref(false)
async function confirmDelete() {
  if (!deleting.value) return
  delLoading.value = true
  try {
    await api(`/api/flights/${deleting.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'پرواز حذف شد', color: 'success', icon: 'i-lucide-check' })
    delOpen.value = false
    if (data.value && data.value.items.length === 1 && page.value > 1) page.value--
    await refresh()
  } catch (e) { toast.add({ title: 'حذف پرواز انجام نشد', description: apiError(e).message, color: 'error', icon: 'i-lucide-triangle-alert' }) }
  finally { delLoading.value = false }
}
</script>

<template>
  <AppPage id="flights" title="پروازها">
    <template #actions><UButton color="secondary" icon="i-lucide-plus" label="پرواز جدید" @click="openForm(null)" /></template>

    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <UInput v-model="q" icon="i-lucide-search" placeholder="جستجوی ایرلاین، شماره پرواز یا فرودگاه" aria-label="جستجوی پرواز" maxlength="60" class="w-full" />
        <USelect v-model="sortKey" :items="sortItems" aria-label="مرتب‌سازی پروازها" class="w-full" />
      </div>

      <ResponsiveTable :columns="columns" :rows="data?.items ?? []" :loading="status === 'pending'" empty-title="پروازی پیدا نشد" empty-hint="عبارت دیگری جستجو کنید یا پرواز جدید ثبت کنید.">
        <template #card-title="{ row }">{{ row.airline }}، <span class="sd-ltr">{{ row.flightNumber }}</span></template>
        <template #cell-flightNumber="{ row }"><span class="sd-ltr font-medium text-highlighted">{{ row.flightNumber }}</span><span class="block text-xs text-muted">{{ row.airline }}</span></template>
        <template #cell-route="{ row }"><span class="whitespace-nowrap"><span class="sd-ltr">{{ row.origin }}</span> ← <span class="sd-ltr">{{ row.destination }}</span></span></template>
        <template #cell-departureAt="{ row }">{{ fmtDateTime(row.departureAt) }}</template>
        <template #cell-price="{ row }"><span class="font-bold text-primary">{{ toman(row.price) }}</span></template>
        <template #cell-seatsAvailable="{ row }">
          <UBadge :label="`${fa(row.seatsAvailable)} از ${fa(row.seatsTotal)}`" :color="row.seatsAvailable === 0 ? 'error' : row.seatsAvailable < 20 ? 'warning' : 'success'" />
        </template>
        <template #actions="{ row }">
          <UButton icon="i-lucide-pencil" label="ویرایش" color="neutral" variant="outline" @click="openForm(row)" />
          <UButton icon="i-lucide-trash-2" label="حذف" color="error" variant="outline" @click="deleting = row; delOpen = true" />
        </template>
      </ResponsiveTable>

      <div v-if="data && data.total > limit" class="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p class="text-sm text-muted">{{ fa(data.total) }} پرواز</p>
        <UPagination v-model:page="page" :total="data.total" :items-per-page="limit" :sibling-count="1" />
      </div>
    </div>

    <FlightFormModal v-model:open="formOpen" :flight="editing" @saved="refresh()" />
    <ConfirmModal v-model:open="delOpen" title="این پرواز حذف شود؟" :description="deleting ? `پرواز ${deleting.flightNumber} (${deleting.origin} ← ${deleting.destination}) حذف می‌شود. پروازهای دارای رزرو قابل حذف نیستند.` : ''" confirm-label="حذف پرواز" :loading="delLoading" @confirm="confirmDelete" />
  </AppPage>
</template>
