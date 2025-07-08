<template>
  <button
    @click="$emit('click')"
    :class="[
      'w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors hover:bg-accent',
      collapsed ? 'justify-center' : ''
    ]"
    :title="label"
  >
    <component :is="icon" class="w-4 h-4 flex-shrink-0" :stroke-width="1" />
    <span v-if="!collapsed" class="text-sm">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import * as icons from 'lucide-vue-next'

interface Props {
  icon: string
  label: string
  collapsed: boolean
}

defineProps<Props>()
defineEmits(['click'])
</script>