<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import { hotelSchema } from '#shared/schemas'
import { api, apiError, makeValidator } from '~/utils/api'
import type { Hotel } from '#shared/types'
import FormActions from '~/components/FormActions.vue'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{ hotel: Hotel | null }>()
const emit = defineEmits<{ saved: [] }>()
const toast = useToast()
const form = useTemplateRef<any>('form')
const loading = ref(false)

const blank = () => ({ name: '', city: '', country: 'ایران', stars: 4 as number | undefined, price: undefined as number | undefined, roomsTotal: undefined as number | undefined })
const state = reactive(blank())
watch(open, (o) => { if (o) Object.assign(state, props.hotel ? { ...props.hotel } : blank()) })

const toPayload = (s: any) => ({ ...s, stars: s.stars ?? undefined, price: s.price ?? undefined, roomsTotal: s.roomsTotal ?? undefined })
const validate = makeValidator(hotelSchema, toPayload)

async function submit() {
  loading.value = true
  try {
    const p = hotelSchema.parse(toPayload(state))
    const payload = { name: p.name, city: p.city, country: p.country, stars: p.stars, price: p.price, roomsTotal: p.roomsTotal }
    if (props.hotel) await api(`/api/hotels/${props.hotel.id}`, { method: 'PUT', body: payload })
    else await api('/api/hotels', { method: 'POST', body: payload })
    toast.add({ title: props.hotel ? 'هتل ویرایش شد' : 'هتل ثبت شد', color: 'success', icon: 'i-lucide-check' })
    open.value = false
    emit('saved')
  } catch (e) {
    const err = apiError(e)
    if (err.fieldErrors.length) form.value?.setErrors(err.fieldErrors)
    else toast.add({ title: 'ذخیره‌ی هتل انجام نشد', description: err.message, color: 'error', icon: 'i-lucide-triangle-alert' })
  } finally { loading.value = false }
}
</script>

<template>
  <UModal v-model:open="open" :title="hotel ? 'ویرایش هتل' : 'هتل جدید'" description="مشخصات هتل، قیمت هر شب و تعداد اتاق را وارد کنید.">
    <template #body>
      <UForm ref="form" :state="state" :validate="validate" class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit="submit">
        <UFormField label="نام هتل" name="name" required class="sd-min-w-0 sm:col-span-2"><UInput v-model="state.name" class="w-full" maxlength="80" autocomplete="off" /></UFormField>
        <UFormField label="شهر" name="city" required class="sd-min-w-0"><UInput v-model="state.city" class="w-full" maxlength="60" autocomplete="off" /></UFormField>
        <UFormField label="کشور" name="country" required class="sd-min-w-0"><UInput v-model="state.country" class="w-full" maxlength="60" autocomplete="off" /></UFormField>
        <UFormField label="ستاره" name="stars" required class="sd-min-w-0"><UInputNumber v-model="state.stars" class="w-full" :min="1" :max="5" /></UFormField>
        <UFormField label="قیمت هر شب (تومان)" name="price" required class="sd-min-w-0"><UInputNumber v-model="state.price" class="w-full" :min="10000" :step="10000" /></UFormField>
        <UFormField label="تعداد اتاق" name="roomsTotal" required class="sd-min-w-0 sm:col-span-2"><UInputNumber v-model="state.roomsTotal" class="w-full" :min="1" :max="2000" /></UFormField>
        <div class="sm:col-span-2"><FormActions :loading="loading" :submit-label="hotel ? 'ذخیره تغییرات' : 'ثبت هتل'" @cancel="open = false" /></div>
      </UForm>
    </template>
  </UModal>
</template>
