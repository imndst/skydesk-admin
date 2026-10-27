<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import { flightCrossErrors, flightSchema } from '#shared/schemas'
import { api, apiError, makeValidator } from '~/utils/api'
import type { Flight } from '#shared/types'
import FormActions from '~/components/FormActions.vue'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{ flight: Flight | null }>()
const emit = defineEmits<{ saved: [] }>()
const toast = useToast()
const form = useTemplateRef<any>('form')
const loading = ref(false)

const blank = () => ({ airline: '', flightNumber: '', origin: '', destination: '', departureAt: '', arrivalAt: '', price: undefined as number | undefined, seatsTotal: undefined as number | undefined })
const state = reactive(blank())
watch(open, (o) => { if (o) Object.assign(state, props.flight ? { ...props.flight } : blank()) })

const toPayload = (s: any) => ({ ...s, departureAt: s.departureAt || undefined, arrivalAt: s.arrivalAt || undefined, price: s.price ?? undefined, seatsTotal: s.seatsTotal ?? undefined })
const base = makeValidator(flightSchema, toPayload)
// zod only runs object-level rules once every field is valid; show cross-field errors right away too
const validate = (s: any) => {
  const errs = base(s)
  for (const e of flightCrossErrors(s)) if (!errs.some(x => x.name === e.path)) errs.push({ name: e.path, message: e.message })
  return errs
}

async function submit() {
  loading.value = true
  try {
    const p = flightSchema.parse(toPayload(state))
    const payload = { airline: p.airline, flightNumber: p.flightNumber, origin: p.origin, destination: p.destination, departureAt: p.departureAt, arrivalAt: p.arrivalAt, price: p.price, seatsTotal: p.seatsTotal }
    if (props.flight) await api(`/api/flights/${props.flight.id}`, { method: 'PUT', body: payload })
    else await api('/api/flights', { method: 'POST', body: payload })
    toast.add({ title: props.flight ? 'پرواز ویرایش شد' : 'پرواز ثبت شد', color: 'success', icon: 'i-lucide-check' })
    open.value = false
    emit('saved')
  } catch (e) {
    const err = apiError(e)
    if (err.fieldErrors.length) form.value?.setErrors(err.fieldErrors)
    else toast.add({ title: 'ذخیره‌ی پرواز انجام نشد', description: err.message, color: 'error', icon: 'i-lucide-triangle-alert' })
  } finally { loading.value = false }
}
</script>

<template>
  <UModal v-model:open="open" :title="flight ? 'ویرایش پرواز' : 'پرواز جدید'" description="مسیر، زمان، قیمت و ظرفیت پرواز را وارد کنید.">
    <template #body>
      <UForm ref="form" :state="state" :validate="validate" class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit="submit">
        <UFormField label="ایرلاین" name="airline" required class="sd-min-w-0"><UInput v-model="state.airline" class="w-full" maxlength="60" autocomplete="off" /></UFormField>
        <UFormField label="شماره پرواز" name="flightNumber" required hint="مثل IR452" class="sd-min-w-0"><UInput v-model="state.flightNumber" class="w-full" dir="ltr" maxlength="8" autocomplete="off" /></UFormField>
        <UFormField label="مبدأ (کد فرودگاه)" name="origin" required class="sd-min-w-0"><UInput v-model="state.origin" class="w-full" dir="ltr" maxlength="3" placeholder="THR" autocomplete="off" /></UFormField>
        <UFormField label="مقصد (کد فرودگاه)" name="destination" required class="sd-min-w-0"><UInput v-model="state.destination" class="w-full" dir="ltr" maxlength="3" placeholder="MHD" autocomplete="off" /></UFormField>
        <UFormField label="زمان حرکت" name="departureAt" required class="sd-min-w-0"><UInput v-model="state.departureAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="زمان رسیدن" name="arrivalAt" required class="sd-min-w-0"><UInput v-model="state.arrivalAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="قیمت هر صندلی (تومان)" name="price" required class="sd-min-w-0"><UInputNumber v-model="state.price" class="w-full" :min="10000" :step="10000" /></UFormField>
        <UFormField label="تعداد صندلی" name="seatsTotal" required class="sd-min-w-0"><UInputNumber v-model="state.seatsTotal" class="w-full" :min="1" :max="900" /></UFormField>
        <div class="sm:col-span-2"><FormActions :loading="loading" :submit-label="flight ? 'ذخیره تغییرات' : 'ثبت پرواز'" @cancel="open = false" /></div>
      </UForm>
    </template>
  </UModal>
</template>
