<template>
  <AlertDialogCancel v-bind="props">
    <slot />
  </AlertDialogCancel>
</template>

<script setup lang="ts">
import { AlertDialogCancel, type AlertDialogCancelProps } from 'reka-ui'

const props = defineProps<AlertDialogCancelProps>()
</script>