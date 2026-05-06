<template>
  <router-view />
  <Toaster />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from './stores/app.store'
import { useRepositoriesStore } from '@/shared/stores'
import { Toaster } from '@/components/ui/toast'
import { perf } from '@/shared/perf'

const appStore = useAppStore()
const repositoriesStore = useRepositoriesStore()
const router = useRouter()

const pendingRepositoryId = ref<number | null>(null)

function tryOpenPendingRepository() {
  const id = pendingRepositoryId.value
  if (id == null) return
  const repo = repositoriesStore.repositories.find((r) => r.id === id)
  if (!repo) return
  pendingRepositoryId.value = null
  repositoriesStore.setCurrentRepository(repo)
  router.push('/repository')
}

watch(() => repositoriesStore.repositories.length, tryOpenPendingRepository)

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
    pendingRepositoryId.value = repositoryId
    tryOpenPendingRepository()
  })
})

// Report current repository to main process so window state can be persisted
watch(
  () => repositoriesStore.currentRepository?.id,
  (id) => {
    window.api.window.setRepository(id ?? null)
  },
)
</script>
