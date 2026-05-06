<template>
  <ContextMenuSeparator v-bind="props" :class="cn('bg-border -mx-1 my-1 h-px', props.class)" />
</template>

<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { ContextMenuSeparator, type ContextMenuSeparatorProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<
  ContextMenuSeparatorProps & {
    class?: HTMLAttributes['class']
  }
>()
</script>
