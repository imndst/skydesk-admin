<script setup lang="ts">
const model = defineModel<string>({ required: true })
defineProps<{ label: string, name: string, description?: string }>()
const valid = computed(() => /^#[0-9a-f]{6}$/i.test(model.value))
</script>

<template>
  <UFormField :label="label" :name="name" :description="description" class="sd-min-w-0">
    <div class="flex min-w-0 items-center gap-2">
      <input
        type="color"
        :value="valid ? model : '#000000'"
        :aria-label="`انتخاب ${label}`"
        class="size-10 shrink-0 cursor-pointer rounded-md border border-default bg-default p-0.5"
        @input="model = ($event.target as HTMLInputElement).value"
      >
      <UInput v-model="model" dir="ltr" maxlength="7" spellcheck="false" autocomplete="off" class="sd-min-w-0 w-full font-mono" :aria-label="`کد ${label}`" />
    </div>
  </UFormField>
</template>
