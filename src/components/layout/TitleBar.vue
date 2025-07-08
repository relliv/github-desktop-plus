<template>
  <div>
    <!-- Title Bar -->
    <div class="fixed top-0 left-0 right-0 h-8 bg-background/95 backdrop-blur-sm border-b flex items-center justify-between z-50 app-drag">
      <!-- Left side - Repository info and app name -->
      <div :class="[
        'flex items-center gap-3 h-full px-3 app-no-drag',
        isMac ? 'pl-[88px]' : 'pl-3'
      ]">
        <span class="text-xs font-semibold text-foreground">GitHub Desktop Plus</span>
        <span class="text-xs text-muted-foreground/60">•</span>
        <span class="text-xs text-muted-foreground truncate max-w-[200px]" v-if="currentRepository">
          <GitBranch class="w-3 h-3 inline mr-1" />
          {{ currentRepository.name }}
        </span>
      </div>
      
      <!-- Center - Empty for drag area -->
      <div class="flex-1 h-full"></div>
      
      <!-- Right side - Empty space for window controls -->
      <div class="w-[140px] h-full" v-if="!isMac"></div>
    </div>
    
    <!-- Window Controls - Positioned absolutely on the right -->
    <div 
      v-if="!isMac"
      class="fixed top-0 right-0 h-8 flex items-center gap-0.5 pr-1 z-[60] app-no-drag"
    >
      <button
        @click="minimize"
        class="w-[46px] h-[30px] flex items-center justify-center rounded hover:bg-accent/80 transition-all"
        title="Minimize"
      >
        <Minus class="w-3 h-3" />
      </button>
      <button
        @click="maximize"
        class="w-[46px] h-[30px] flex items-center justify-center rounded hover:bg-accent/80 transition-all"
        title="Maximize"
      >
        <Square v-if="!isMaximized" class="w-3 h-3" />
        <Copy v-else class="w-3 h-3" />
      </button>
      <button
        @click="close"
        class="w-[46px] h-[30px] flex items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground transition-all"
        title="Close"
      >
        <X class="w-3 h-3" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Minus, Square, Copy, X, GitBranch } from 'lucide-vue-next'
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