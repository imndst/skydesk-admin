<script setup lang="ts">
import { fa_ir } from '@nuxt/ui/locale'
import { useTheme } from '~/composables/useTheme'

const { active } = useTheme()
useHead({ titleTemplate: t => t ? `${t} | ${active.value.brand.name}` : active.value.brand.name })
</script>

<template>
  <UApp :locale="fa_ir">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
