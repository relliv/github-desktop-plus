<template>
  <div class="flex bg-background text-foreground">
    <div class="flex flex-col h-screen w-full">
      <!-- Title Bar -->
      <TitleBar />

      <SplitterGroup
        id="main-layout"
        direction="horizontal"
        auto-save-id="main-layout-splitter"
        class="flex-1"
      >
        <!-- Sidebar Panel -->
        <SplitterPanel
          id="sidebar"
          :default-size="20"
          :min-size="15"
          :max-size="35"
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
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import TitleBar from "../components/layout/TitleBar.vue";
import Sidebar from "../components/layout/Sidebar.vue";
</script>
