<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const theme = localStorage.getItem('uiTheme') || 'default'
  document.documentElement.setAttribute('data-theme', theme)
})
</script>
