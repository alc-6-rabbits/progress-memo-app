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

  // フォントサイズ管理
  const loadFontSize = () => {
    const savedSize = localStorage.getItem('aceFontSize') || '16'
    const fontSize = parseInt(savedSize, 10)
    document.documentElement.style.setProperty('--ace-base-font-size', fontSize + 'px')
    return fontSize
  }

  let currentFontSize = loadFontSize()

  const updateFontSize = (newSize) => {
    const size = Math.min(Math.max(newSize, 12), 32)
    currentFontSize = size
    localStorage.setItem('aceFontSize', size.toString())
    document.documentElement.style.setProperty('--ace-base-font-size', size + 'px')
  }

  // グローバルショートカット (Ctrl + +, Ctrl + -, Ctrl + 0)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+' || e.key === ';') {
        e.preventDefault()
        updateFontSize(currentFontSize + 2)
      } else if (e.key === '-') {
        e.preventDefault()
        updateFontSize(currentFontSize - 2)
      } else if (e.key === '0') {
        e.preventDefault()
        updateFontSize(16)
      }
    }
  })
})
</script>
