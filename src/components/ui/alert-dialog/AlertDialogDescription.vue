<template>
  <AlertDialogDescription
    :class="cn('text-sm text-muted-foreground', props.class)"
    v-bind="props"
  >
    <slot />
  </AlertDialogDescription>
</template>

<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { AlertDialogDescription, type AlertDialogDescriptionProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AlertDialogDescriptionProps & { class?: HTMLAttributes['class'] }>()
</script>