<template>
  <div class="z-50 flex flex-row gap-2" :class="[process.platform === 'darwin' ? 'pr-2' : 'pr-0']">
    <!-- Window control buttons -->
    <button
      @click="minimizeWindow"
      class="hover:bg-accent flex size-8 items-center justify-center rounded-md transition-colors"
      :class="[process.platform === 'darwin' ? 'rounded' : '']"
    >
      <Minus class="h-3 w-3" :stroke-width="1" />
    </button>

    <button
      @click="toggleMaximize"
      class="hover:bg-accent flex size-8 items-center justify-center rounded-md transition-colors"
      :class="[process.platform === 'darwin' ? 'rounded' : '']"
    >
      <Square v-if="!isMaximized" class="h-3 w-3" :stroke-width="1" />
      <Minimize2 v-else class="h-3 w-3" :stroke-width="1" />
    </button>

    <button
      @click="closeWindow"
      class="hover:bg-destructive hover:text-destructive-foreground flex size-8 items-center justify-center rounded-md transition-colors"
      :class="[process.platform === 'darwin' ? 'rounded' : '']"
    >
      <X class="h-3 w-3" :stroke-width="1" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Minus, Square, Maximize2, Minimize2, X } from 'lucide-vue-next'

const isMaximized = ref(false)
const process = window.process || { platform: 'win32' }

const minimizeWindow = () => {
  window.api.window.minimize()
}

const toggleMaximize = async () => {
  await window.api.window.maximize()
  isMaximized.value = await window.api.window.isMaximized()
}

const closeWindow = () => {
  window.api.window.close()
}

// Check initial maximized state
onMounted(async () => {
  isMaximized.value = await window.api.window.isMaximized()

  // Listen for maximize state changes
  window.api.window.onMaximized((maximized: boolean) => {
    isMaximized.value = maximized
  })
})
</script>
