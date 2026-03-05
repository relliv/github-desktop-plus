<template>
  <div class="flex h-screen bg-background text-foreground">
    <!-- Sidebar (in background) -->
    <div class="flex flex-col w-[260px] min-w-[220px] max-w-[320px] flex-shrink-0">
      <!-- Drag area for sidebar top -->
      <div class="h-[50px] app-drag" />
      <Sidebar class="flex-1 min-h-0" />
    </div>

    <!-- Main Content (elevated, rounded) -->
    <div class="flex flex-col flex-1 min-w-0 py-2 pr-2">
      <div class="flex-1 flex flex-col bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
        <!-- Title Bar inside rounded area -->
        <TitleBar />
        <main class="flex-1 flex flex-col overflow-hidden">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TitleBar from "../components/layout/TitleBar.vue";
import Sidebar from "../components/layout/Sidebar.vue";
</script>

<style scoped>
.app-drag {
  -webkit-app-region: drag;
}
</style>
