<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import { DEFAULT_THEME, THEME_PRESETS, designTokens, parseTheme, themeSchema, type Theme } from '#shared/theme'
import { useTheme } from '~/composables/useTheme'
import { api, apiError, fmtDateTime, makeValidator } from '~/utils/api'
import { COLOR_LABEL, badgeSizeOptions, badgeVariantOptions, baseRadiusOptions, btnShadowOptions, buttonVariantOptions, cardShadowOptions, cardVariantOptions, colorModeOptions, colorOptions, fieldVariantOptions, fontOptions, headerOptions, labelWeightOptions, neutralOptions, radiusOptions, scaleOptions, sizeOptions, weightOptions } from '~/utils/themeOptions'
import type { ThemeResponse } from '#shared/types'
import AppPage from '~/components/AppPage.vue'
import ColorField from '~/components/ColorField.vue'
import ContrastReport from '~/components/ContrastReport.vue'
import ThemePreview from '~/components/ThemePreview.vue'

useHead({ title: 'تنظیمات ظاهر' })
const toast = useToast()
const { saved, apply, revert } = useTheme()

// Always start from the latest server copy (needed for the version check on save).
// No top-level await: it would break stable component ids (label ↔ input) during hydration.
const { data: fresh } = useFetch<ThemeResponse>('/api/theme', { key: 'theme-settings', getCachedData: () => undefined })

const draft = ref<Theme>(structuredClone(toRaw(saved.value.settings)))
watch(fresh, (v) => {
  if (!v || v.version === saved.value.version) return
  const untouched = JSON.stringify(draft.value) === JSON.stringify(saved.value.settings)
  saved.value = v
  if (untouched) draft.value = structuredClone(v.settings)
}, { immediate: true })
const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(saved.value.settings))
const valid = computed(() => themeSchema.safeParse(draft.value).success)
const saving = ref(false)
const form = useTemplateRef<any>('form')
const validate = makeValidator(themeSchema)

// Live preview: every valid change is applied to the whole app immediately (not saved until "ذخیره").
watch(draft, v => apply(v), { deep: true })

const sections = [
  { value: 'colors', label: 'رنگ‌ها', icon: 'i-lucide-palette' },
  { value: 'layout', label: 'چیدمان', icon: 'i-lucide-type' },
  { value: 'button', label: 'دکمه', icon: 'i-lucide-mouse-pointer-click' },
  { value: 'field', label: 'فیلدها', icon: 'i-lucide-text-cursor-input' },
  { value: 'surface', label: 'کارت‌ها', icon: 'i-lucide-square-stack' },
  { value: 'presets', label: 'قالب‌ها', icon: 'i-lucide-swatch-book' }
]
const section = ref('colors')

async function save() {
  if (!valid.value) { await form.value?.validate().catch(() => {}); toast.add({ title: 'چند فیلد مقدار نامعتبر دارند', color: 'error', icon: 'i-lucide-triangle-alert' }); return }
  saving.value = true
  try {
    const res = await api<ThemeResponse>('/api/theme', { method: 'PUT', body: { version: saved.value.version, settings: draft.value } })
    saved.value = res
    draft.value = structuredClone(res.settings)
    toast.add({ title: 'ظاهر سایت ذخیره شد', description: 'تغییرات برای همه‌ی کاربران اعمال شد.', color: 'success', icon: 'i-lucide-check' })
  } catch (e) {
    const err = apiError(e)
    if (err.fieldErrors.length) form.value?.setErrors(err.fieldErrors.map(f => ({ ...f, name: f.name.replace(/^settings\./, '') })))
    toast.add({
      title: err.status === 409 ? 'تداخل ویرایش' : 'ذخیره انجام نشد', description: err.message, color: 'error', icon: 'i-lucide-triangle-alert',
      actions: err.status === 409 ? [{ label: 'بارگذاری نسخه‌ی جدید', onClick: () => reloadNuxtApp({ force: true }) }] : undefined
    })
  } finally { saving.value = false }
}

function discard() { draft.value = structuredClone(toRaw(saved.value.settings)) }
function usePreset(t: Theme) { draft.value = structuredClone(t); toast.add({ title: 'قالب اعمال شد', description: 'برای ماندگاری، ذخیره کنید.', icon: 'i-lucide-info' }) }
function resetDefaults() { usePreset(DEFAULT_THEME) }

function exportTokens() {
  const blob = new Blob([JSON.stringify(designTokens(draft.value), null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'design-tokens.json'
  a.click()
  URL.revokeObjectURL(a.href)
}
function exportSettings() {
  const blob = new Blob([JSON.stringify(draft.value, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'theme-settings.json'
  a.click()
  URL.revokeObjectURL(a.href)
}
async function importSettings(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  if (file.size > 50_000) { toast.add({ title: 'فایل خیلی بزرگ است', color: 'error' }); return }
  try {
    const r = parseTheme(JSON.parse(await file.text()))
    if (!r.success) throw new Error(r.error.issues[0]?.message)
    usePreset(r.data)
  } catch (err: any) {
    toast.add({ title: 'فایل تنظیمات معتبر نیست', description: err?.message, color: 'error', icon: 'i-lucide-triangle-alert' })
  }
}

// Unsaved changes: warn before leaving, and drop the live preview if the admin leaves anyway.
onBeforeRouteLeave(() => {
  if (!dirty.value) return true
  if (!window.confirm('تغییرات ذخیره نشده‌اند. بدون ذخیره خارج می‌شوید؟')) return false
  revert()
  return true
})
const beforeUnload = (e: BeforeUnloadEvent) => { if (dirty.value) e.preventDefault() }
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

const updatedText = computed(() => saved.value.updatedAt ? `آخرین ذخیره: ${fmtDateTime(saved.value.updatedAt)}` : 'هنوز ذخیره نشده (پیش‌فرض)')
</script>

<template>
  <AppPage id="settings" title="تنظیمات ظاهر">
    <template #actions>
      <UBadge v-if="dirty" color="warning" label="ذخیره نشده" class="max-sm:hidden" />
      <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" aria-label="بازگردانی تغییرات" :disabled="!dirty || saving" class="bg-default" @click="discard">
        <span class="max-sm:sr-only">بازگردانی</span>
      </UButton>
      <UButton color="secondary" icon="i-lucide-save" aria-label="ذخیره تغییرات" :loading="saving" :disabled="!dirty" @click="save">
        <span class="max-sm:sr-only">ذخیره</span>
      </UButton>
    </template>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <UAlert
          :color="dirty ? 'warning' : 'neutral'" variant="subtle" :icon="dirty ? 'i-lucide-eye' : 'i-lucide-info'"
          :title="dirty ? 'پیش‌نمایش زنده' : 'تنظیمات سراسری قالب'"
          :description="dirty ? 'تغییرات فقط برای شما نمایش داده می‌شود. برای اعمال روی همه‌ی کاربران «ذخیره» را بزنید.' : `هر تغییر اینجا روی همه‌ی دکمه‌ها، فیلدها، کارت‌ها و رنگ‌های پنل اعمال می‌شود. ${updatedText}`"
        />

        <USelect v-model="section" :items="sections" class="w-full md:hidden" aria-label="بخش تنظیمات" />
        <UTabs v-model="section" :items="sections" :ui="{ content: 'hidden' }" class="hidden md:flex" aria-label="بخش تنظیمات" />

        <UForm ref="form" :state="draft" :validate="validate" novalidate class="flex flex-col gap-4" @submit.prevent="save">
          <!-- Colors -->
          <template v-if="section === 'colors'">
            <UCard>
              <template #header><h2 class="font-bold text-highlighted">برند و رنگ‌های معنایی</h2></template>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                <UFormField label="نام برند" name="brand.name" class="sd-min-w-0 sm:col-span-2 2xl:col-span-3"><UInput id="theme-brand-name" v-model="draft.brand.name" maxlength="32" class="w-full" /></UFormField>
                <ColorField v-model="draft.colors.primary" name="colors.primary" label="رنگ اصلی (Primary)" description="دکمه‌ها، تب فعال، قیمت‌ها" />
                <ColorField v-model="draft.colors.secondary" name="colors.secondary" label="رنگ تأکیدی (Secondary)" description="دکمه‌های فراخوان مثل «جستجو»" />
                <ColorField v-model="draft.colors.info" name="colors.info" label="اطلاعات (Info)" description="دکمه‌ی «جزئیات و خرید»" />
                <ColorField v-model="draft.colors.success" name="colors.success" label="موفقیت (Success)" />
                <ColorField v-model="draft.colors.warning" name="colors.warning" label="هشدار (Warning)" />
                <ColorField v-model="draft.colors.error" name="colors.error" label="خطا (Error)" />
              </div>
            </UCard>
            <UCard>
              <template #header><h2 class="font-bold text-highlighted">سطح‌ها و متن (حالت روشن)</h2></template>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                <ColorField v-model="draft.colors.page" name="colors.page" label="پس‌زمینه‌ی صفحه" />
                <ColorField v-model="draft.colors.surface" name="colors.surface" label="سطح (کارت و فیلد)" />
                <ColorField v-model="draft.colors.border" name="colors.border" label="حاشیه" />
                <ColorField v-model="draft.colors.text" name="colors.text" label="متن اصلی" />
                <ColorField v-model="draft.colors.muted" name="colors.muted" label="متن کم‌رنگ" />
                <UFormField label="طیف خاکستری" name="neutral" description="برای حالت تیره و متن‌های فرعی" class="sd-min-w-0"><USelect v-model="draft.neutral" :items="neutralOptions" class="w-full" /></UFormField>
                <ColorField v-model="draft.colors.headerBg" name="colors.headerBg" label="پس‌زمینه‌ی سربرگ" />
                <ColorField v-model="draft.colors.headerFg" name="colors.headerFg" label="متن سربرگ" />
              </div>
            </UCard>
            <ContrastReport :theme="draft" />
          </template>

          <!-- Typography & layout -->
          <UCard v-else-if="section === 'layout'">
            <template #header><h2 class="font-bold text-highlighted">تایپوگرافی و چیدمان</h2></template>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UFormField label="فونت" name="typography.font" class="sd-min-w-0"><USelect v-model="draft.typography.font" :items="fontOptions" class="w-full" /></UFormField>
              <UFormField label="اندازه‌ی کلی رابط" name="typography.scale" description="همه‌ی متن‌ها و فاصله‌ها نسبت به این بزرگ یا کوچک می‌شوند" class="sd-min-w-0"><USelect v-model="draft.typography.scale" :items="scaleOptions" class="w-full" /></UFormField>
              <UFormField label="گردی گوشه‌ها (سراسری)" name="shape.radius" description="مبنای همه‌ی اجزایی که «پیش‌فرض سراسری» دارند" class="sd-min-w-0"><USelect v-model="draft.shape.radius" :items="baseRadiusOptions" class="w-full" /></UFormField>
              <UFormField label="حالت رنگ" name="layout.colorMode" class="sd-min-w-0"><USelect v-model="draft.layout.colorMode" :items="colorModeOptions" class="w-full" /></UFormField>
              <UFormField label="سبک سربرگ صفحات" name="layout.header" class="sd-min-w-0 sm:col-span-2"><USelect v-model="draft.layout.header" :items="headerOptions" class="w-full" /></UFormField>
            </div>
          </UCard>

          <!-- Button -->
          <UCard v-else-if="section === 'button'">
            <template #header>
              <h2 class="font-bold text-highlighted">دکمه (UButton)</h2>
              <p class="mt-1 text-sm text-muted">ظاهر هر دکمه‌ای که در صفحات بدون تنظیم خاص استفاده شده است.</p>
            </template>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UFormField label="رنگ پیش‌فرض" name="button.color" class="sd-min-w-0"><USelect v-model="draft.button.color" :items="colorOptions" class="w-full" /></UFormField>
              <UFormField label="سبک" name="button.variant" class="sd-min-w-0"><USelect v-model="draft.button.variant" :items="buttonVariantOptions" class="w-full" /></UFormField>
              <UFormField label="اندازه" name="button.size" class="sd-min-w-0"><USelect v-model="draft.button.size" :items="sizeOptions" class="w-full" /></UFormField>
              <UFormField label="گردی گوشه" name="button.radius" class="sd-min-w-0"><USelect v-model="draft.button.radius" :items="radiusOptions" class="w-full" /></UFormField>
              <UFormField label="ضخامت متن" name="button.weight" class="sd-min-w-0"><USelect v-model="draft.button.weight" :items="weightOptions" class="w-full" /></UFormField>
              <UFormField label="سایه" name="button.shadow" class="sd-min-w-0"><USelect v-model="draft.button.shadow" :items="btnShadowOptions" class="w-full" /></UFormField>
            </div>
            <template #footer>
              <div class="flex flex-wrap gap-2">
                <UButton label="پیش‌فرض" />
                <UButton v-for="c in ['secondary', 'info', 'success', 'warning', 'error'] as const" :key="c" :color="c" :label="COLOR_LABEL[c]" />
              </div>
            </template>
          </UCard>

          <!-- Fields -->
          <UCard v-else-if="section === 'field'">
            <template #header>
              <h2 class="font-bold text-highlighted">فیلدهای فرم</h2>
              <p class="mt-1 text-sm text-muted">روی UInput، UInputNumber، USelect، USelectMenu، UTextarea و برچسب‌های UFormField اعمال می‌شود.</p>
            </template>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UFormField label="رنگ حالت فوکوس" name="field.color" class="sd-min-w-0"><USelect v-model="draft.field.color" :items="colorOptions" class="w-full" /></UFormField>
              <UFormField label="سبک" name="field.variant" class="sd-min-w-0"><USelect v-model="draft.field.variant" :items="fieldVariantOptions" class="w-full" /></UFormField>
              <UFormField label="اندازه" name="field.size" class="sd-min-w-0"><USelect v-model="draft.field.size" :items="sizeOptions" class="w-full" /></UFormField>
              <UFormField label="گردی گوشه" name="field.radius" class="sd-min-w-0"><USelect v-model="draft.field.radius" :items="radiusOptions" class="w-full" /></UFormField>
              <UFormField label="ضخامت برچسب" name="field.labelWeight" class="sd-min-w-0 sm:col-span-2"><USelect v-model="draft.field.labelWeight" :items="labelWeightOptions" class="w-full" /></UFormField>
            </div>
          </UCard>

          <!-- Card, badge, tabs, modal -->
          <template v-else-if="section === 'surface'">
            <UCard>
              <template #header><h2 class="font-bold text-highlighted">کارت (UCard)</h2></template>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <UFormField label="سبک" name="card.variant" class="sd-min-w-0"><USelect v-model="draft.card.variant" :items="cardVariantOptions" class="w-full" /></UFormField>
                <UFormField label="گردی گوشه" name="card.radius" class="sd-min-w-0"><USelect v-model="draft.card.radius" :items="radiusOptions" class="w-full" /></UFormField>
                <UFormField label="سایه" name="card.shadow" class="sd-min-w-0"><USelect v-model="draft.card.shadow" :items="cardShadowOptions" class="w-full" /></UFormField>
              </div>
            </UCard>
            <UCard>
              <template #header><h2 class="font-bold text-highlighted">نشان وضعیت (UBadge)</h2></template>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <UFormField label="سبک" name="badge.variant" class="sd-min-w-0"><USelect v-model="draft.badge.variant" :items="badgeVariantOptions" class="w-full" /></UFormField>
                <UFormField label="اندازه" name="badge.size" class="sd-min-w-0"><USelect v-model="draft.badge.size" :items="badgeSizeOptions" class="w-full" /></UFormField>
                <UFormField label="کپسولی" name="badge.pill" class="sd-min-w-0"><USwitch v-model="draft.badge.pill" label="گوشه‌های کاملاً گرد" /></UFormField>
              </div>
            </UCard>
            <UCard>
              <template #header><h2 class="font-bold text-highlighted">تب‌ها (UTabs) و پنجره (UModal)</h2></template>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UFormField label="اندازه‌ی تب" name="tabs.size" class="sd-min-w-0"><USelect v-model="draft.tabs.size" :items="sizeOptions" class="w-full" /></UFormField>
                <UFormField label="گردی تب" name="tabs.radius" class="sd-min-w-0"><USelect v-model="draft.tabs.radius" :items="radiusOptions" class="w-full" /></UFormField>
                <UFormField label="گردی پنجره" name="modal.radius" class="sd-min-w-0"><USelect v-model="draft.modal.radius" :items="radiusOptions" class="w-full" /></UFormField>
                <UFormField label="پس‌زمینه‌ی پنجره" name="modal.blur" class="sd-min-w-0"><USwitch v-model="draft.modal.blur" label="محو کردن پشت پنجره" /></UFormField>
              </div>
            </UCard>
          </template>

          <!-- Presets & backup -->
          <template v-else>
            <UCard>
              <template #header><h2 class="font-bold text-highlighted">قالب‌های آماده</h2></template>
              <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <li v-for="p in THEME_PRESETS" :key="p.id">
                  <button type="button" class="flex w-full min-w-0 items-center gap-3 rounded-lg border border-default bg-default p-3 text-start transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary" @click="usePreset(p.theme)">
                    <span class="flex shrink-0" aria-hidden="true">
                      <span v-for="k in ['primary', 'secondary', 'headerBg', 'page'] as const" :key="k" class="size-6 rounded-full border-2 border-default first:ms-0 -ms-2" :style="{ background: p.theme.colors[k] }" />
                    </span>
                    <span class="sd-min-w-0">
                      <span class="block truncate font-semibold text-highlighted">{{ p.label }}</span>
                      <span class="block truncate text-sm text-muted">{{ p.description }}</span>
                    </span>
                  </button>
                </li>
              </ul>
            </UCard>
            <UCard>
              <template #header>
                <h2 class="font-bold text-highlighted">پشتیبان و توکن‌های طراحی</h2>
                <p class="mt-1 text-sm text-muted">خروجی توکن‌ها با استاندارد W3C Design Tokens برای Figma (Tokens Studio).</p>
              </template>
              <div class="flex flex-wrap gap-2">
                <UButton color="neutral" variant="outline" icon="i-lucide-download" label="خروجی توکن‌ها (JSON)" @click="exportTokens" />
                <UButton color="neutral" variant="outline" icon="i-lucide-file-down" label="پشتیبان تنظیمات" @click="exportSettings" />
                <UButton as="label" color="neutral" variant="outline" icon="i-lucide-upload" class="cursor-pointer">
                  <span>بارگذاری پشتیبان</span>
                  <input type="file" accept="application/json,.json" class="sr-only" @change="importSettings">
                </UButton>
                <UButton color="error" variant="soft" icon="i-lucide-rotate-ccw" label="بازنشانی به پیش‌فرض" @click="resetDefaults" />
              </div>
            </UCard>
          </template>
        </UForm>
      </div>

      <aside class="min-w-0 xl:sticky xl:top-0 xl:self-start" aria-label="پیش‌نمایش">
        <h2 class="mb-3 font-bold text-highlighted">پیش‌نمایش زنده</h2>
        <ThemePreview />
      </aside>
    </div>
  </AppPage>
</template>
