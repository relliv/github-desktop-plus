<template>
  <div
    @click="$emit('click')"
    :class="[
      'flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors',
      'hover:bg-accent/50'
    ]"
  >
    <input
      type="checkbox"
      :checked="staged"
      @click.stop="staged ? $emit('unstage') : $emit('stage')"
      class="rounded border-gray-300"
    />
    <FileIcon :filename="file" class="w-4 h-4 flex-shrink-0" />
    <span class="text-sm truncate flex-1">{{ file }}</span>
    <StatusBadge :status="getFileStatus()" />
  </div>
</template>

<script setup lang="ts">
import FileIcon from './FileIcon.vue'
import StatusBadge from './StatusBadge.vue'

interface Props {
  file: string
  staged: boolean
}

defineProps<Props>()
defineEmits(['click', 'stage', 'unstage'])

const getFileStatus = () => {
  // TODO: Get actual file status from git
  return 'modified'
}
</script>