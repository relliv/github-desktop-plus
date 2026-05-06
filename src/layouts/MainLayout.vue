<template>
  <div class="bg-background text-foreground relative h-screen">
    <!-- Drag area overlapping sidebar header -->
    <div
      v-if="!appStore.isSidebarCollapsed"
      class="app-drag absolute top-0 left-0 z-30 h-[50px]"
      :style="{ width: 'var(--sidebar-width, 20%)' }"
    />

    <!-- Content area with splitter -->
    <SplitterGroup
      id="main-layout"
      direction="horizontal"
      auto-save-id="main-layout-splitter"
      class="h-full"
      @layout="onLayoutChange"
    >
      <!-- Sidebar Panel -->
      <SplitterPanel
        id="sidebar"
        ref="sidebarPanel"
        :default-size="20"
        :min-size="15"
        :max-size="35"
        :collapsible="true"
        :collapsed="appStore.isSidebarCollapsed"
        @collapse="appStore.isSidebarCollapsed = true"
        @expand="appStore.isSidebarCollapsed = false"
      >
        <Sidebar class="h-full" />
      </SplitterPanel>

      <!-- Resize Handle -->
      <SplitterResizeHandle id="sidebar-handle" class="group relative z-10 w-0">
        <div
          class="group-hover:bg-primary/30 group-data-[state=drag]:bg-primary absolute inset-y-0 -right-0.5 -left-0.5 transition-colors"
        />
      </SplitterResizeHandle>

      <!-- Main Content Panel -->
      <SplitterPanel id="main-content" :min-size="40">
        <div
          :class="[
            'flex h-full flex-col py-2',
            appStore.isSidebarCollapsed && 'pl-2',
            appStore.isAiPanelCollapsed && 'pr-2',
          ]"
        >
          <div
            class="bg-card-translucent border-border/50 flex flex-1 flex-col overflow-hidden rounded-xl border shadow-sm"
          >
            <TitleBar />

            <main class="flex flex-1 flex-col overflow-hidden">
              <router-view />
            </main>
          </div>
        </div>
      </SplitterPanel>

      <!-- AI Panel Resize Handle -->
      <SplitterResizeHandle
        v-if="!appStore.isAiPanelCollapsed"
        id="ai-panel-handle"
        class="group relative z-10 w-0"
      >
        <div
          class="group-hover:bg-primary/30 group-data-[state=drag]:bg-primary absolute inset-y-0 -right-0.5 -left-0.5 transition-colors"
        />
      </SplitterResizeHandle>

      <!-- AI Chat Panel -->
      <SplitterPanel
        v-if="!appStore.isAiPanelCollapsed"
        id="ai-panel"
        ref="aiPanel"
        class="ml-1"
        :default-size="22"
        :min-size="18"
        :max-size="40"
      >
        <div class="flex h-full flex-col py-2 pr-2">
          <div
            class="bg-card-translucent border-border/50 flex flex-1 flex-col overflow-hidden rounded-xl border shadow-sm"
          >
            <AiPanel class="h-full" />
          </div>
        </div>
      </SplitterPanel>
    </SplitterGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import TitleBar from '../components/layout/TitleBar.vue'
import Sidebar from '../components/layout/Sidebar.vue'
import AiPanel from '../components/layout/AiPanel.vue'
import { useAutoRefresh } from '../composables/useAutoRefresh'
import { useAppStore } from '../stores/app.store'

useAutoRefresh()

const appStore = useAppStore()
const sidebarPanel = ref<InstanceType<typeof SplitterPanel> | null>(null)

watch(
  () => appStore.isSidebarCollapsed,
  (collapsed) => {
    if (collapsed) {
      sidebarPanel.value?.collapse()
    } else {
      sidebarPanel.value?.expand()
    }
  },
)

function onLayoutChange(sizes: number[]) {
  // Update CSS variable so the top drag area matches sidebar width
  const sidebarPercent = sizes[0] ?? 20
  document.documentElement.style.setProperty('--sidebar-width', `${sidebarPercent}%`)
}
</script>

<style scoped>
.app-drag {
  -webkit-app-region: drag;
}

:deep(#sidebar) {
  transition:
    flex-grow 300ms ease-in-out,
    flex-basis 300ms ease-in-out;
}

:deep(#main-content) {
  transition:
    flex-grow 300ms ease-in-out,
    flex-basis 300ms ease-in-out;
}

:deep(#ai-panel) {
  transition:
    flex-grow 300ms ease-in-out,
    flex-basis 300ms ease-in-out;
}
</style>
