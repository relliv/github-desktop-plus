<template>
  <AlertDialogCancel v-bind="props">
    <slot />
  </AlertDialogCancel>
</template>

<script setup lang="ts">
import { AlertDialogCancel, type AlertDialogCancelProps } from 'radix-vue'

const props = defineProps<AlertDialogCancelProps>()
</script>