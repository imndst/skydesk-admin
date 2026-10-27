<script setup lang="ts">
import { loginSchema } from '#shared/schemas'
import { useTheme } from '~/composables/useTheme'
import { api, apiError, makeValidator } from '~/utils/api'

definePageMeta({ layout: 'auth' })
useHead({ title: 'ورود' })

const { active } = useTheme()
const user = useState<{ email: string } | null>('user')
const state = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const form = useTemplateRef<any>('form')
const validate = makeValidator(loginSchema)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    user.value = await api<{ email: string }>('/api/auth/login', { method: 'POST', body: { email: state.email, password: state.password } })
    await navigateTo('/')
  } catch (e) {
    const err = apiError(e)
    if (err.fieldErrors.length) form.value?.setErrors(err.fieldErrors)
    else error.value = err.message
  } finally { loading.value = false }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-plane-takeoff" class="size-6 text-primary" />
        <h1 class="text-lg font-bold text-highlighted">ورود به پنل {{ active.brand.name }}</h1>
      </div>
    </template>
    <UForm ref="form" :state="state" :validate="validate" class="flex flex-col gap-4" novalidate @submit="submit">
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-triangle-alert" :description="error" role="alert" />
      <UFormField label="ایمیل" name="email" required><UInput v-model="state.email" type="email" dir="ltr" inputmode="email" autocomplete="username" class="w-full" maxlength="120" /></UFormField>
      <UFormField label="رمز عبور" name="password" required><UInput v-model="state.password" type="password" dir="ltr" autocomplete="current-password" class="w-full" maxlength="128" /></UFormField>
      <UButton type="submit" label="ورود" block :loading="loading" />
    </UForm>
    <template #footer>
      <p class="text-xs text-muted">حساب نمایشی: <span class="sd-ltr">admin@skydesk.demo / Admin#2026demo</span></p>
    </template>
  </UCard>
</template>
