<template>
  <AlertDialogCancel
    v-bind="props"
    :class="
      cn(
        'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        'border-input bg-background hover:bg-accent hover:text-accent-foreground border',
        'h-9 px-3',
      )
    "
  >
    <slot />
  </AlertDialogCancel>
</template>

<script setup lang="ts">
import { AlertDialogCancel, type AlertDialogCancelProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AlertDialogCancelProps>()
</script>
