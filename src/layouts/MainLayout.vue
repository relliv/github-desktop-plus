<template>
  <div class="flex bg-background text-foreground">
    <div class="flex flex-col h-screen w-full">
      <!-- Title Bar -->
      <TitleBar />

      <SplitterGroup
        id="main-layout"
        direction="horizontal"
        class="flex-1"
        @layout="onLayoutChange"
      >
        <!-- Sidebar Panel -->
        <SplitterPanel
          id="sidebar"
          :default-size="appStore.sidebarSize"
          :min-size="appStore.minSidebarSize"
          :max-size="appStore.maxSidebarSize"
          :collapsible="false"
          class="bg-card"
        >
          <Sidebar />
        </SplitterPanel>

        <!-- Resize Handle -->
        <SplitterResizeHandle
          id="sidebar-handle"
          class="bg-border hover:bg-primary/50 transition-colors data-[state=drag]:bg-primary"
        />

        <!-- Main Content Panel -->
        <SplitterPanel id="main-content" :min-size="50">
          <main class="flex-1 flex flex-col overflow-hidden h-full">
            <router-view />
          </main>
        </SplitterPanel>
      </SplitterGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import TitleBar from "../components/layout/TitleBar.vue";
import Sidebar from "../components/layout/Sidebar.vue";
import { useAppStore } from "../stores/app.store";

const appStore = useAppStore();

const onLayoutChange = (sizes: number[]) => {
  if (sizes[0] !== undefined) {
    appStore.setSidebarSize(sizes[0]);
  }
};

onMounted(() => {
  appStore.initializeSidebarSize();
});
</script>
