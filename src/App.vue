<template>
  <router-view />
  <Toaster />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from './stores/app.store'
import { Toaster } from '@/components/ui/toast'
import { perf } from '@/shared/perf'

const appStore = useAppStore()

onMounted(() => {
  perf.mark('app:mounted')

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
