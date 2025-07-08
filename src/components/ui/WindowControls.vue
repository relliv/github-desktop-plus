<template>
  <div 
    class="flex flex-row z-50"
    :class="[
      process.platform === 'darwin' ? 'pr-2' : 'pr-0'
    ]"
  >
    <!-- Window control buttons -->
    <button
      @click="minimizeWindow"
      class="w-12 h-8 flex items-center justify-center hover:bg-accent transition-colors"
      :class="[
        process.platform === 'darwin' ? 'rounded' : ''
      ]"
    >
      <Minus class="w-3 h-3" :stroke-width="1" />
    </button>
    
    <button
      @click="toggleMaximize"
      class="w-12 h-8 flex items-center justify-center hover:bg-accent transition-colors"
      :class="[
        process.platform === 'darwin' ? 'rounded' : ''
      ]"
    >
      <Square v-if="!isMaximized" class="w-3 h-3" :stroke-width="1" />
      <Minimize2 v-else class="w-3 h-3" :stroke-width="1" />
    </button>
    
    <button
      @click="closeWindow"
      class="w-12 h-8 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
      :class="[
        process.platform === 'darwin' ? 'rounded' : ''
      ]"
    >
      <X class="w-3 h-3" :stroke-width="1" />
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