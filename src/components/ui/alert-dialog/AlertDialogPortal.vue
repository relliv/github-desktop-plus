<template>
  <AlertDialogPortal v-bind="props">
    <slot />
  </AlertDialogPortal>
</template>

<script setup lang="ts">
import { AlertDialogPortal, type AlertDialogPortalProps } from 'radix-vue'

const props = defineProps<AlertDialogPortalProps>()
</script>