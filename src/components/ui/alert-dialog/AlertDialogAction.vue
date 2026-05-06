<template>
  <AlertDialogAction
    v-bind="props"
    :class="
      cn(
        'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'h-9 px-3',
      )
    "
  >
    <slot />
  </AlertDialogAction>
</template>

<script setup lang="ts">
import { AlertDialogAction, type AlertDialogActionProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AlertDialogActionProps>()
</script>
