<template>
  <button
    @click="$emit('click')"
    :class="[
      'hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-2 transition-colors',
      collapsed ? 'justify-center' : '',
    ]"
    :title="label"
  >
    <component :is="icon" class="h-4 w-4 flex-shrink-0" :stroke-width="1" />
    <span v-if="!collapsed" class="text-sm">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  icon: string | Component
  label: string
  collapsed?: boolean
}

defineProps<Props>()
defineEmits(['click'])
</script>
