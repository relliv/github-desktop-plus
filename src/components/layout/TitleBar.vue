<template>
  <div class="fixed top-0 left-0 right-0 h-10 bg-background border-b flex items-center justify-between z-50 app-drag">
    <!-- Left side - App name -->
    <div class="flex items-center h-full px-4 app-no-drag">
      <span class="text-sm font-medium">GitHub Desktop Plus</span>
    </div>
    
    <!-- Center - Repository name -->
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <span class="text-sm text-muted-foreground" v-if="currentRepository">
        {{ currentRepository.name }}
      </span>
    </div>
    
    <!-- Right side - Window controls (show on Windows/Linux, hide on Mac due to traffic lights) -->
    <div class="flex items-center h-full app-no-drag" v-if="!isMac">
      <button
        @click="minimize"
        class="h-full px-4 hover:bg-accent transition-colors"
        title="Minimize"
      >
        <Minus class="w-4 h-4" />
      </button>
      <button
        @click="maximize"
        class="h-full px-4 hover:bg-accent transition-colors"
        title="Maximize"
      >
        <Square v-if="!isMaximized" class="w-3 h-3" />
        <Copy v-else class="w-3 h-3" />
      </button>
      <button
        @click="close"
        class="h-full px-4 hover:bg-destructive hover:text-destructive-foreground transition-colors"
        title="Close"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Minus, Square, Copy, X } from 'lucide-vue-next'
import { useAppStore } from '../../stores/app.store'
import { useRepositoryStore } from '../../stores/repository.store'

const appStore = useAppStore()
const repositoryStore = useRepositoryStore()

// Get platform from user agent instead of process
const isWindows = navigator.userAgent.includes('Windows')
const isMac = navigator.userAgent.includes('Mac')
const isMaximized = computed(() => appStore.isMaximized)
const currentRepository = computed(() => repositoryStore.currentRepository)

const minimize = () => window.api.window.minimize()
const maximize = () => window.api.window.maximize()
const close = () => window.api.window.close()
</script>

<style scoped>
.app-drag {
  -webkit-app-region: drag;
}

.app-no-drag {
  -webkit-app-region: no-drag;
}
</style>