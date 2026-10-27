<script setup lang="ts">
/** Live preview. Components here get NO styling props: what you see is exactly what every page gets. */
const tab = ref('domestic')
const modalOpen = ref(false)
const tabs = [{ label: 'هتل داخلی', value: 'domestic' }, { label: 'هتل خارجی (به زودی)', value: 'foreign', disabled: true }]
</script>

<template>
  <div class="flex flex-col gap-4">
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="flex flex-col gap-3 bg-(--sd-header-bg) p-4 text-(--sd-header-fg)">
        <p class="text-lg font-bold">رزرو هتل مشهد</p>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm">ورود ۵ آبان · خروج ۷ آبان · ۱ نفر</p>
          <UButton color="secondary" label="تغییر تاریخ" />
        </div>
      </div>
      <div class="flex flex-col gap-3 p-4">
        <UTabs v-model="tab" :items="tabs" :ui="{ content: 'hidden' }" />
        <UInput icon="i-lucide-building-2" placeholder="محل اقامت" class="w-full" aria-label="محل اقامت" />
        <div class="grid grid-cols-2 gap-3">
          <UInput placeholder="تاریخ ورود" class="w-full" aria-label="تاریخ ورود" />
          <UInput placeholder="تاریخ خروج" class="w-full" aria-label="تاریخ خروج" />
        </div>
        <USelect :items="['۱ بزرگسال', '۲ بزرگسال', '۳ بزرگسال']" default-value="۱ بزرگسال" class="w-full" aria-label="تعداد مسافر" />
        <UButton color="secondary" label="جستجو" block />
      </div>
    </UCard>

    <UCard>
      <div class="flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <p class="font-bold text-highlighted">هتل بین‌المللی هما ۲ مشهد</p>
          <UBadge color="success" variant="solid" label="۴٫۶" />
        </div>
        <p class="flex items-center gap-1 text-sm text-muted"><UIcon name="i-lucide-star" class="size-4 text-secondary" /> ۵ ستاره · مشهد، میدان جانباز</p>
        <div class="flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-default pt-3">
          <div>
            <p class="text-xs text-muted">قیمت برای ۲ شب</p>
            <p class="text-lg font-bold text-primary">۹٬۶۶۰٬۴۲۰ تومان</p>
          </div>
          <UButton color="info" label="جزئیات و خرید" />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header><h3 class="font-bold text-highlighted">اجزای پایه</h3></template>
      <div class="flex flex-col gap-4">
        <UFormField label="فیلد متنی (پیش‌فرض)" name="preview-field" help="هر UInput بدون هیچ prop">
          <UInput placeholder="مثلاً نام مسافر" class="w-full" />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UButton label="دکمه‌ی پیش‌فرض" />
          <UButton color="neutral" variant="outline" label="انصراف" />
          <UButton color="error" label="حذف" />
        </div>
        <div class="flex flex-wrap gap-2">
          <UBadge label="قطعی" color="success" />
          <UBadge label="در انتظار" color="warning" />
          <UBadge label="لغو شده" color="neutral" />
          <UBadge label="خطا" color="error" />
        </div>
        <UButton color="neutral" variant="soft" icon="i-lucide-app-window" label="نمایش پنجره (مودال)" @click="modalOpen = true" />
      </div>
    </UCard>

    <UModal v-model:open="modalOpen" title="پیش‌نمایش پنجره" description="گردی گوشه و محوشدن پس‌زمینه از تنظیمات می‌آید.">
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="بستن" @click="modalOpen = false" />
          <UButton label="تأیید" @click="modalOpen = false" />
        </div>
      </template>
    </UModal>
  </div>
</template>
