<template>
  <div
    class="flex flex-row items-center justify-between h-10 px-4 app-drag flex-shrink-0"
  >
    <!-- Left - App title -->
    <span class="text-xs font-semibold text-foreground">
      GitHub Desktop Plus
    </span>

    <!-- Right side - Window controls -->
    <div class="app-no-drag">
      <WindowControls />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "../../stores/app.store";
import { useRepositoriesStore } from "@/shared/stores";
import WindowControls from "@/components/ui/WindowControls.vue";

const appStore = useAppStore();
const repositoriesStore = useRepositoriesStore();

const isMaximized = computed(() => appStore.isMaximized);
const currentRepository = computed(() => repositoriesStore.currentRepository);

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
