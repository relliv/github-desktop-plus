<template>
  <span 
    :class="[
      'px-2 py-0.5 text-xs rounded-full font-medium',
      statusClass
    ]"
  >
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'conflicted'
}

const props = defineProps<Props>()

const statusClass = computed(() => {
  switch (props.status) {
    case 'modified':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'added':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'deleted':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'renamed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'conflicted':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
})

const statusText = computed(() => {
  switch (props.status) {
    case 'modified': return 'M'
    case 'added': return 'A'
    case 'deleted': return 'D'
    case 'renamed': return 'R'
    case 'conflicted': return 'C'
    default: return '?'
  }
})
</script>