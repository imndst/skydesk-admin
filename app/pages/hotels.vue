<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import { api, apiError, fa, toman } from '~/utils/api'
import type { Hotel, Paged } from '#shared/types'
import AppPage from '~/components/AppPage.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import HotelFormModal from '~/components/HotelFormModal.vue'
import ResponsiveTable from '~/components/ResponsiveTable.vue'
useHead({ title: 'هتل‌ها' })
const toast = useToast()
const q = ref('')
const search = ref('')
const page = ref(1)
const limit = 10
const sortKey = ref('name:asc')
let timer: ReturnType<typeof setTimeout>
watch(q, (v) => { clearTimeout(timer); timer = setTimeout(() => { search.value = v.trim(); page.value = 1 }, 250) })
watch(sortKey, () => { page.value = 1 })

const query = computed(() => { const [sort, dir] = sortKey.value.split(':'); return { q: search.value, page: page.value, limit, sort, dir } })
const { data, status, refresh } = await useFetch<Paged<Hotel>>('/api/hotels', { query })

const columns = [
  { key: 'city', label: 'موقعیت' }, { key: 'stars', label: 'ستاره' },
  { key: 'price', label: 'قیمت هر شب' }, { key: 'roomsAvailable', label: 'اتاق خالی' }
]
const sortItems = [
  { label: 'نام هتل', value: 'name:asc' }, { label: 'شهر', value: 'city:asc' },
  { label: 'ارزان‌ترین', value: 'price:asc' }, { label: 'گران‌ترین', value: 'price:desc' }, { label: 'بیشترین ستاره', value: 'stars:desc' }
]

const formOpen = ref(false)
const editing = ref<Hotel | null>(null)
const openForm = (h: Hotel | null) => { editing.value = h; formOpen.value = true }

const delOpen = ref(false)
const deleting = ref<Hotel | null>(null)
const delLoading = ref(false)
async function confirmDelete() {
  if (!deleting.value) return
  delLoading.value = true
  try {
    await api(`/api/hotels/${deleting.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'هتل حذف شد', color: 'success', icon: 'i-lucide-check' })
    delOpen.value = false
    if (data.value && data.value.items.length === 1 && page.value > 1) page.value--
    await refresh()
  } catch (e) { toast.add({ title: 'حذف هتل انجام نشد', description: apiError(e).message, color: 'error', icon: 'i-lucide-triangle-alert' }) }
  finally { delLoading.value = false }
}
</script>

<template>
  <AppPage id="hotels" title="هتل‌ها">
    <template #actions><UButton color="secondary" icon="i-lucide-plus" label="هتل جدید" @click="openForm(null)" /></template>

    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <UInput v-model="q" icon="i-lucide-search" placeholder="جستجوی نام هتل، شهر یا کشور" aria-label="جستجوی هتل" maxlength="60" class="w-full" />
        <USelect v-model="sortKey" :items="sortItems" aria-label="مرتب‌سازی هتل‌ها" class="w-full" />
      </div>

      <ResponsiveTable :columns="[{ key: 'name', label: 'هتل', card: false }, ...columns]" :rows="data?.items ?? []" :loading="status === 'pending'" empty-title="هتلی پیدا نشد" empty-hint="عبارت دیگری جستجو کنید یا هتل جدید ثبت کنید.">
        <template #card-title="{ row }">{{ row.name }}</template>
        <template #cell-name="{ row }"><span class="font-medium text-highlighted">{{ row.name }}</span></template>
        <template #cell-city="{ row }">{{ row.city }}، {{ row.country }}</template>
        <template #cell-stars="{ row }">
          <span class="inline-flex items-center gap-1" :aria-label="`${fa(row.stars)} ستاره`"><UIcon name="i-lucide-star" class="size-4 text-secondary" />{{ fa(row.stars) }} ستاره</span>
        </template>
        <template #cell-price="{ row }"><span class="font-bold text-primary">{{ toman(row.price) }}</span></template>
        <template #cell-roomsAvailable="{ row }">
          <UBadge :label="`${fa(row.roomsAvailable)} از ${fa(row.roomsTotal)}`" :color="row.roomsAvailable === 0 ? 'error' : row.roomsAvailable < 10 ? 'warning' : 'success'" />
        </template>
        <template #actions="{ row }">
          <UButton icon="i-lucide-pencil" label="ویرایش" color="neutral" variant="outline" @click="openForm(row)" />
          <UButton icon="i-lucide-trash-2" label="حذف" color="error" variant="outline" @click="deleting = row; delOpen = true" />
        </template>
      </ResponsiveTable>

      <div v-if="data && data.total > limit" class="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p class="text-sm text-muted">{{ fa(data.total) }} هتل</p>
        <UPagination v-model:page="page" :total="data.total" :items-per-page="limit" :sibling-count="1" />
      </div>
    </div>

    <HotelFormModal v-model:open="formOpen" :hotel="editing" @saved="refresh()" />
    <ConfirmModal v-model:open="delOpen" title="این هتل حذف شود؟" :description="deleting ? `${deleting.name} در ${deleting.city} حذف می‌شود. هتل‌های دارای رزرو قابل حذف نیستند.` : ''" confirm-label="حذف هتل" :loading="delLoading" @confirm="confirmDelete" />
  </AppPage>
</template>
