<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import { api, apiError, fa, fmtDate, fmtDateTime, toman } from '~/utils/api'
import type { Booking, Paged } from '#shared/types'
import AppPage from '~/components/AppPage.vue'
import BookingFormModal from '~/components/BookingFormModal.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import ResponsiveTable from '~/components/ResponsiveTable.vue'
useHead({ title: 'رزروها' })
const toast = useToast()
const q = ref('')
const search = ref('')
const page = ref(1)
const limit = 10
const status = ref<'all' | 'confirmed' | 'cancelled'>('all')
const type = ref<'all' | 'flight' | 'hotel'>('all')
let timer: ReturnType<typeof setTimeout>
watch(q, (v) => { clearTimeout(timer); timer = setTimeout(() => { search.value = v.trim(); page.value = 1 }, 250) })
watch([status, type], () => { page.value = 1 })

const query = computed(() => ({
  q: search.value, page: page.value, limit, sort: 'created', dir: 'desc',
  status: status.value === 'all' ? undefined : status.value, type: type.value === 'all' ? undefined : type.value
}))
const { data, status: fetchStatus, refresh } = await useFetch<Paged<Booking>>('/api/bookings', { query })

const columns = [
  { key: 'reference', label: 'کد رزرو', card: false }, { key: 'customerName', label: 'مسافر' }, { key: 'itemLabel', label: 'سرویس' },
  { key: 'createdAt', label: 'تاریخ ثبت' }, { key: 'total', label: 'مبلغ' }, { key: 'status', label: 'وضعیت' }
]
const statusItems = [{ label: 'همه‌ی وضعیت‌ها', value: 'all' }, { label: 'قطعی', value: 'confirmed' }, { label: 'لغو شده', value: 'cancelled' }]
const typeItems = [{ label: 'پرواز و هتل', value: 'all' }, { label: 'پرواز', value: 'flight' }, { label: 'هتل', value: 'hotel' }]

const formOpen = ref(false)
const cancelOpen = ref(false)
const target = ref<Booking | null>(null)
const cancelLoading = ref(false)
async function confirmCancel() {
  if (!target.value) return
  cancelLoading.value = true
  try {
    await api(`/api/bookings/${target.value.id}`, { method: 'PATCH', body: { status: 'cancelled' } })
    toast.add({ title: `رزرو ${target.value.reference} لغو شد`, description: 'صندلی یا اتاق آزاد شد.', color: 'success', icon: 'i-lucide-check' })
    cancelOpen.value = false
    await refresh()
  } catch (e) { toast.add({ title: 'لغو رزرو انجام نشد', description: apiError(e).message, color: 'error', icon: 'i-lucide-triangle-alert' }) }
  finally { cancelLoading.value = false }
}
</script>

<template>
  <AppPage id="bookings" title="رزروها">
    <template #actions><UButton color="secondary" icon="i-lucide-plus" label="رزرو جدید" @click="formOpen = true" /></template>

    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <UInput v-model="q" icon="i-lucide-search" placeholder="جستجوی کد رزرو، نام یا ایمیل" aria-label="جستجوی رزرو" maxlength="60" class="w-full sm:col-span-2 xl:col-span-1" />
        <USelect v-model="status" :items="statusItems" aria-label="فیلتر وضعیت" class="w-full" />
        <USelect v-model="type" :items="typeItems" aria-label="فیلتر نوع سرویس" class="w-full" />
      </div>

      <ResponsiveTable :columns="columns" :rows="data?.items ?? []" :loading="fetchStatus === 'pending'" empty-title="رزروی پیدا نشد" empty-hint="فیلترها را تغییر دهید یا رزرو جدید ثبت کنید.">
        <template #card-title="{ row }"><span class="sd-ltr">{{ row.reference }}</span></template>
        <template #cell-reference="{ row }"><span class="sd-ltr font-mono text-xs text-highlighted">{{ row.reference }}</span></template>
        <template #cell-customerName="{ row }">{{ row.customerName }}<span class="sd-ltr block text-xs text-muted">{{ row.customerEmail }}</span></template>
        <template #cell-itemLabel="{ row }">
          {{ row.itemLabel }}
          <span v-if="row.type === 'hotel' && row.checkIn && row.checkOut" class="block text-xs text-muted">{{ fmtDate(row.checkIn) }} تا {{ fmtDate(row.checkOut) }}</span>
        </template>
        <template #cell-createdAt="{ row }">{{ fmtDateTime(row.createdAt) }}</template>
        <template #cell-total="{ row }"><span class="font-bold text-primary">{{ toman(row.total) }}</span></template>
        <template #cell-status="{ row }"><UBadge :label="row.status === 'confirmed' ? 'قطعی' : 'لغو شده'" :color="row.status === 'confirmed' ? 'success' : 'neutral'" /></template>
        <template #actions="{ row }">
          <UButton v-if="row.status === 'confirmed'" icon="i-lucide-ban" label="لغو رزرو" color="error" variant="outline" @click="target = row; cancelOpen = true" />
        </template>
      </ResponsiveTable>

      <div v-if="data && data.total > limit" class="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p class="text-sm text-muted">{{ fa(data.total) }} رزرو</p>
        <UPagination v-model:page="page" :total="data.total" :items-per-page="limit" :sibling-count="1" />
      </div>
    </div>

    <BookingFormModal v-model:open="formOpen" @saved="refresh()" />
    <ConfirmModal v-model:open="cancelOpen" title="این رزرو لغو شود؟" :description="target ? `رزرو ${target.reference} به نام ${target.customerName} لغو و صندلی یا اتاق آن آزاد می‌شود.` : ''" confirm-label="لغو رزرو" :loading="cancelLoading" @confirm="confirmCancel" />
  </AppPage>
</template>
