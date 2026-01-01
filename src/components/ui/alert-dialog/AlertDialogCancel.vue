<template>
  <AlertDialogCancel
    v-bind="props"
    :class="cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      'h-9 px-3'
    )"
  >
    <slot />
  </AlertDialogCancel>
</template>

<script setup lang="ts">
import { AlertDialogCancel, type AlertDialogCancelProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AlertDialogCancelProps>()
</script>