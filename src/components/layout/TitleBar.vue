<template>
  <div
    class="flex flex-row items-center justify-between h-10 pl-3 pr-1 app-drag flex-shrink-0"
  >
    <!-- Left - Sidebar toggle + App title -->
    <div class="flex items-center gap-2">
      <button
        class="app-no-drag p-1 rounded hover:bg-accent transition-colors"
        @click="appStore.toggleSidebar()"
        :title="appStore.isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'"
      >
        <PanelLeft class="size-4 text-muted-foreground" :stroke-width="1.5" />
      </button>
      <span class="text-xs font-semibold text-foreground">
        GitHub Desktop Plus
      </span>
    </div>

    <!-- Right side - Window controls -->
    <div class="app-no-drag">
      <WindowControls />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from "../../stores/app.store";
import WindowControls from "@/components/ui/WindowControls.vue";
import { PanelLeft } from "lucide-vue-next";

const appStore = useAppStore();
</script>

<style scoped>
.app-drag {
  -webkit-app-region: drag;
}

.app-no-drag {
  -webkit-app-region: no-drag;
}
</style>
