<template>
  <AlertDialogOverlay
    :class="cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      props.class
    )"
    v-bind="props"
  />
</template>

<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { AlertDialogOverlay, type AlertDialogOverlayProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<AlertDialogOverlayProps & { class?: HTMLAttributes['class'] }>()
</script>