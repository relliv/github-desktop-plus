<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
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
        <FileIcon :filename="file" class="size-4 shrink-0" />
        <span v-if="renamedFrom" class="text-sm truncate flex-1">
          <span class="text-muted-foreground">{{ renamedFrom }}</span>
          <span class="text-muted-foreground mx-1">→</span>
          <span>{{ file }}</span>
        </span>
        <span v-else class="text-sm truncate flex-1">{{ file }}</span>
        <StatusBadge :status="status" />
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent class="w-56">
      <ContextMenuItem class="text-destructive" @click="$emit('discard')">
        <Trash2 class="w-4 h-4 mr-2" />
        Discard Changes
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import FileIcon from './FileIcon.vue'
import StatusBadge from './StatusBadge.vue'

interface Props {
  file: string
  staged: boolean
  status?: 'modified' | 'added' | 'deleted' | 'renamed' | 'conflicted'
  renamedFrom?: string
}

withDefaults(defineProps<Props>(), {
  status: 'modified',
  renamedFrom: undefined,
})
defineEmits(['click', 'stage', 'unstage', 'discard'])
</script>
