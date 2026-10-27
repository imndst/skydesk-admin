<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import { bookingSchema } from '#shared/schemas'
import { api, apiError, fa, fmtDateTime, makeValidator, toman } from '~/utils/api'
import type { Booking, Flight, Hotel, Paged } from '#shared/types'
import FormActions from '~/components/FormActions.vue'

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ saved: [] }>()
const toast = useToast()
const form = useTemplateRef<any>('form')
const loading = ref(false)
const loadingItems = ref(false)

const blank = () => ({ type: 'hotel' as 'flight' | 'hotel', itemId: undefined as number | undefined, quantity: 1 as number | undefined, checkIn: '', checkOut: '', customerName: '', customerEmail: '', customerPhone: '' })
const state = reactive(blank())
const flights = ref<Flight[]>([])
const hotels = ref<Hotel[]>([])
const typeTabs = [{ label: 'هتل', value: 'hotel', icon: 'i-lucide-hotel' }, { label: 'پرواز', value: 'flight', icon: 'i-lucide-plane' }]

watch(open, async (o) => {
  if (!o) return
  Object.assign(state, blank())
  loadingItems.value = true
  try {
    const [f, h] = await Promise.all([
      api<Paged<Flight>>('/api/flights', { query: { limit: 100, sort: 'departure' } }),
      api<Paged<Hotel>>('/api/hotels', { query: { limit: 100, sort: 'name' } })
    ])
    flights.value = f.items.filter(x => x.seatsAvailable > 0 && Date.parse(x.departureAt) > Date.now())
    hotels.value = h.items.filter(x => x.roomsAvailable > 0)
  } catch (e) {
    toast.add({ title: 'بارگذاری موجودی انجام نشد', description: apiError(e).message, color: 'error' })
  } finally { loadingItems.value = false }
})
watch(() => state.type, () => { state.itemId = undefined; state.quantity = 1 })

const options = computed(() => state.type === 'flight'
  ? flights.value.map(f => ({ value: f.id, label: `${f.flightNumber} | ${f.origin} ← ${f.destination} | ${fmtDateTime(f.departureAt)} | ${toman(f.price)}` }))
  : hotels.value.map(h => ({ value: h.id, label: `${h.name}، ${h.city} | ${fa(h.roomsAvailable)} اتاق | ${toman(h.price)} هر شب` })))

const today = new Date().toISOString().slice(0, 10)
const nights = computed(() => state.checkIn && state.checkOut ? Math.round((Date.parse(state.checkOut) - Date.parse(state.checkIn)) / 86_400_000) : 0)
const estimate = computed(() => {
  const qty = state.quantity ?? 0
  if (state.type === 'flight') { const f = flights.value.find(x => x.id === state.itemId); return f ? f.price * qty : null }
  const h = hotels.value.find(x => x.id === state.itemId)
  return h && nights.value > 0 ? h.price * nights.value * qty : null
})

const toPayload = (s: any) => {
  const base = { type: s.type, itemId: s.itemId ?? undefined, quantity: s.quantity ?? undefined, customerName: s.customerName, customerEmail: s.customerEmail, customerPhone: s.customerPhone }
  return s.type === 'hotel' ? { ...base, checkIn: s.checkIn || undefined, checkOut: s.checkOut || undefined } : base
}
const validate = makeValidator(bookingSchema, toPayload)

async function submit() {
  loading.value = true
  try {
    const payload = bookingSchema.parse(toPayload(state))
    const created = await api<Booking>('/api/bookings', { method: 'POST', body: payload })
    toast.add({ title: `رزرو ${created.reference} ثبت شد`, description: `${created.customerName}، ${toman(created.total)}`, color: 'success', icon: 'i-lucide-check' })
    open.value = false
    emit('saved')
  } catch (e) {
    const err = apiError(e)
    if (err.fieldErrors.length) form.value?.setErrors(err.fieldErrors)
    else toast.add({ title: 'ثبت رزرو انجام نشد', description: err.message, color: 'error', icon: 'i-lucide-triangle-alert' })
  } finally { loading.value = false }
}
</script>

<template>
  <UModal v-model:open="open" title="رزرو جدید" description="فروش بلیت پرواز یا رزرو هتل. مبلغ نهایی را سرور محاسبه می‌کند.">
    <template #body>
      <UForm ref="form" :state="state" :validate="validate" class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit="submit">
        <UTabs v-model="state.type" :items="typeTabs" :ui="{ content: 'hidden' }" class="sm:col-span-2" aria-label="نوع محصول" />
        <UFormField :label="state.type === 'flight' ? 'پرواز' : 'هتل'" name="itemId" required class="sd-min-w-0 sm:col-span-2">
          <USelectMenu v-model="state.itemId" :items="options" value-key="value" class="w-full" :loading="loadingItems" :placeholder="state.type === 'flight' ? 'یک پرواز انتخاب کنید' : 'یک هتل انتخاب کنید'" :content="{ side: 'bottom' }" />
        </UFormField>
        <UFormField :label="state.type === 'flight' ? 'تعداد مسافر' : 'تعداد اتاق'" name="quantity" required class="sd-min-w-0 sm:col-span-2"><UInputNumber v-model="state.quantity" class="w-full" :min="1" :max="9" /></UFormField>
        <template v-if="state.type === 'hotel'">
          <UFormField label="تاریخ ورود" name="checkIn" required class="sd-min-w-0"><UInput v-model="state.checkIn" type="date" :min="today" class="w-full" /></UFormField>
          <UFormField label="تاریخ خروج" name="checkOut" required class="sd-min-w-0"><UInput v-model="state.checkOut" type="date" :min="state.checkIn || today" class="w-full" /></UFormField>
        </template>
        <UFormField label="نام و نام خانوادگی مسافر" name="customerName" required class="sd-min-w-0 sm:col-span-2"><UInput v-model="state.customerName" class="w-full" maxlength="80" autocomplete="off" /></UFormField>
        <UFormField label="ایمیل" name="customerEmail" required class="sd-min-w-0"><UInput v-model="state.customerEmail" type="email" dir="ltr" inputmode="email" class="w-full" maxlength="120" autocomplete="off" /></UFormField>
        <UFormField label="شماره تماس" name="customerPhone" required class="sd-min-w-0"><UInput v-model="state.customerPhone" type="tel" dir="ltr" inputmode="tel" class="w-full" maxlength="20" autocomplete="off" /></UFormField>
        <div class="flex items-center justify-between gap-2 rounded-lg bg-elevated px-3 py-2 text-sm sm:col-span-2">
          <span class="text-muted">{{ state.type === 'hotel' && nights > 0 ? `مبلغ برای ${fa(nights)} شب` : 'مبلغ تقریبی' }}</span>
          <strong class="text-highlighted">{{ estimate == null ? 'ابتدا انتخاب کنید' : toman(estimate) }}</strong>
        </div>
        <div class="sm:col-span-2"><FormActions :loading="loading" submit-label="ثبت رزرو" @cancel="open = false" /></div>
      </UForm>
    </template>
  </UModal>
</template>
