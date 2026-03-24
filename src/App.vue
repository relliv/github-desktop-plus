<template>
  <router-view />
  <Toaster />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from './stores/app.store'
import { useRepositoriesStore } from '@/shared/stores'
import { Toaster } from '@/components/ui/toast'
import { perf } from '@/shared/perf'

const appStore = useAppStore()
const repositoriesStore = useRepositoriesStore()
const router = useRouter()

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

  // Handle open-repository event from main process (new window with repo)
  window.api.window.onOpenRepository((repositoryId) => {
    const repo = repositoriesStore.repositories.find((r) => r.id === repositoryId)
    if (repo) {
      repositoriesStore.setCurrentRepository(repo)
      router.push('/repository')
    }
  })
})
</script>
