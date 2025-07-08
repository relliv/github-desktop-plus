<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from './stores/app.store'

const appStore = useAppStore()

onMounted(() => {
  // Initialize theme
  appStore.initializeTheme()
  
  // Set up window event listeners
  window.api.window.onMaximized((maximized) => {
    appStore.setMaximized(maximized)
  })
  
  window.api.window.onFullScreen((fullscreen) => {
    appStore.setFullScreen(fullscreen)
  })
  
  // Check initial maximized state
  window.api.window.isMaximized().then((maximized) => {
    appStore.setMaximized(maximized)
  })
})
</script>
