<template>
  <ContextMenuSeparator
    v-bind="props"
    :class="cn('-mx-1 my-1 h-px bg-border', props.class)"
  />
</template>

<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { ContextMenuSeparator, type ContextMenuSeparatorProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<ContextMenuSeparatorProps & {
  class?: HTMLAttributes['class']
}>()
</script>