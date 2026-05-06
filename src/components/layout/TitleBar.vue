<template>
  <div class="app-drag flex h-10 flex-shrink-0 flex-row items-center justify-between pr-1 pl-3">
    <!-- Left - Sidebar toggle + App title -->
    <div class="flex items-center gap-2">
      <button
        class="app-no-drag hover:bg-accent rounded p-1 transition-colors"
        @click="appStore.toggleSidebar()"
        :title="appStore.isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'"
      >
        <PanelLeft class="text-muted-foreground size-4" :stroke-width="1.5" />
      </button>
      <span class="text-foreground text-xs font-semibold select-none"> GitHub Desktop Plus </span>
    </div>

    <!-- Right side - AI toggle + Window controls -->
    <div class="app-no-drag flex items-center">
      <button
        class="hover:bg-accent mr-1 rounded p-1 transition-colors"
        @click="appStore.toggleAiPanel()"
        :title="appStore.isAiPanelCollapsed ? 'Open AI chat' : 'Close AI chat'"
      >
        <Sparkles
          class="size-4"
          :class="appStore.isAiPanelCollapsed ? 'text-muted-foreground' : 'text-primary'"
          :stroke-width="1.5"
        />
      </button>
      <WindowControls />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/app.store'
import WindowControls from '@/components/ui/WindowControls.vue'
import { PanelLeft, Sparkles } from 'lucide-vue-next'

const appStore = useAppStore()
</script>

<style scoped>
.app-drag {
  -webkit-app-region: drag;
}

.app-no-drag {
  -webkit-app-region: no-drag;
}
</style>
