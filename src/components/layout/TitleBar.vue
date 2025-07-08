<template>
  <div class="flex flex-row gap-4">
    <!-- Title Bar -->
    <div
      class="flex flex-row gap-2 h-8 bg-background/95 backdrop-blur-sm border-b items-center justify-between z-40 w-full"
    >
      <!-- Center - Empty for drag area -->
      <div class="flex flex-row items-center justify-center flex-1 h-full text-center app-drag">
        <span class="text-xs font-semibold text-foreground"
          >GitHub Desktop Plus</span
        >
      </div>

      <!-- Right side - Window controls -->
      <WindowControls />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Minus, Square, Copy, X, GitBranch } from "lucide-vue-next";
import { useAppStore } from "../../stores/app.store";
import { useRepositoryStore } from "../../stores/repository.store";
import WindowControls from "@/components/ui/WindowControls.vue";

const appStore = useAppStore();
const repositoryStore = useRepositoryStore();

// Get platform from user agent instead of process
const isWindows = navigator.userAgent.includes("Windows");
const isMac = navigator.userAgent.includes("Mac");
const isMaximized = computed(() => appStore.isMaximized);
const currentRepository = computed(() => repositoryStore.currentRepository);

const minimize = () => window.api.window.minimize();
const maximize = () => window.api.window.maximize();
const close = () => window.api.window.close();
</script>

<style scoped>
.app-drag {
  -webkit-app-region: drag;
}

.app-no-drag {
  -webkit-app-region: no-drag;
}
</style>
