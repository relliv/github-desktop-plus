<template>
  <div class="relative h-screen bg-background text-foreground">
    <!-- Drag area overlapping sidebar header -->
    <div
      v-if="!appStore.isSidebarCollapsed"
      class="absolute top-0 left-0 h-[50px] z-30 app-drag"
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
      <SplitterResizeHandle id="sidebar-handle" class="w-0 relative z-10 group">
        <div
          class="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-primary/30 group-data-[state=drag]:bg-primary transition-colors"
        />
      </SplitterResizeHandle>

      <!-- Main Content Panel -->
      <SplitterPanel id="main-content" :min-size="50">
        <div
          :class="[
            'flex flex-col h-full py-2 pr-2',
            appStore.isSidebarCollapsed && 'pl-2',
          ]"
        >
          <div
            class="flex-1 flex flex-col bg-card-translucent rounded-xl shadow-sm border border-border/50 overflow-hidden"
          >
            <TitleBar />

            <main class="flex-1 flex flex-col overflow-hidden">
              <router-view />
            </main>
          </div>
        </div>
      </SplitterPanel>
    </SplitterGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import TitleBar from "../components/layout/TitleBar.vue";
import Sidebar from "../components/layout/Sidebar.vue";
import { useAutoRefresh } from "../composables/useAutoRefresh";
import { useAppStore } from "../stores/app.store";

useAutoRefresh();

const appStore = useAppStore();
const sidebarPanel = ref<InstanceType<typeof SplitterPanel> | null>(null);

watch(
  () => appStore.isSidebarCollapsed,
  (collapsed) => {
    if (collapsed) {
      sidebarPanel.value?.collapse();
    } else {
      sidebarPanel.value?.expand();
    }
  },
);

function onLayoutChange(sizes: number[]) {
  // Update CSS variable so the top drag area matches sidebar width
  const sidebarPercent = sizes[0] ?? 20;
  document.documentElement.style.setProperty(
    "--sidebar-width",
    `${sidebarPercent}%`,
  );
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
</style>
