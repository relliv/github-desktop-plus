<template>
  <div class="flex flex-col h-screen bg-background text-foreground">
    <!-- Drag area across the top -->
    <div class="h-[50px] flex-shrink-0 flex">
      <!-- Sidebar drag area -->
      <div class="app-drag flex-shrink-0" :style="{ width: 'var(--sidebar-width, 260px)' }" />
      <!-- Titlebar in main content area -->
      <div class="flex-1" />
    </div>

    <!-- Content area with splitter -->
    <SplitterGroup
      id="main-layout"
      direction="horizontal"
      auto-save-id="main-layout-splitter"
      class="flex-1 min-h-0"
      @layout="onLayoutChange"
    >
      <!-- Sidebar Panel -->
      <SplitterPanel
        id="sidebar"
        :default-size="20"
        :min-size="15"
        :max-size="35"
        :collapsible="false"
      >
        <Sidebar class="h-full" />
      </SplitterPanel>

      <!-- Resize Handle -->
      <SplitterResizeHandle
        id="sidebar-handle"
        class="w-0 relative z-10 group"
      >
        <div class="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-primary/30 group-data-[state=drag]:bg-primary transition-colors" />
      </SplitterResizeHandle>

      <!-- Main Content Panel -->
      <SplitterPanel id="main-content" :min-size="50">
        <div class="flex flex-col h-full py-2 pr-2">
          <div class="flex-1 flex flex-col bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
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
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import TitleBar from "../components/layout/TitleBar.vue";
import Sidebar from "../components/layout/Sidebar.vue";

function onLayoutChange(sizes: number[]) {
  // Update CSS variable so the top drag area matches sidebar width
  const sidebarPercent = sizes[0] ?? 20;
  document.documentElement.style.setProperty(
    '--sidebar-width',
    `${sidebarPercent}%`
  );
}
</script>

<style scoped>
.app-drag {
  -webkit-app-region: drag;
}
</style>
