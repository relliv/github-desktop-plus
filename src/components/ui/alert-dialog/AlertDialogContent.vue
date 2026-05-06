<template>
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogContent
      :class="
        cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg',
          props.class,
        )
      "
      v-bind="props"
    >
      <slot />
    </AlertDialogContent>
  </AlertDialogPortal>
</template>

<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { AlertDialogContent, type AlertDialogContentProps, AlertDialogPortal } from 'reka-ui'
import { cn } from '@/lib/utils'
import AlertDialogOverlay from './AlertDialogOverlay.vue'

const props = defineProps<AlertDialogContentProps & { class?: HTMLAttributes['class'] }>()
</script>
