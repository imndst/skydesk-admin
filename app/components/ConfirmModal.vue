<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
defineProps<{ title: string, description: string, confirmLabel: string, loading?: boolean }>()
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton color="neutral" variant="outline" label="انصراف" class="justify-center" @click="open = false" />
        <UButton color="error" :label="confirmLabel" :loading="loading" class="justify-center" @click="emit('confirm')" />
      </div>
    </template>
  </UModal>
</template>
