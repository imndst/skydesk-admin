<script setup lang="ts">
defineProps<{ loading?: boolean, submitLabel: string }>()
const emit = defineEmits<{ cancel: [] }>()
</script>

<template>
  <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
    <UButton color="neutral" variant="outline" label="انصراف" class="justify-center" :disabled="loading" @click="emit('cancel')" />
    <UButton type="submit" :label="submitLabel" class="justify-center" :loading="loading" />
  </div>
</template>
