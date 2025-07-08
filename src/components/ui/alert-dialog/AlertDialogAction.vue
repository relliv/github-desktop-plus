<template>
  <AlertDialogAction v-bind="props">
    <slot />
  </AlertDialogAction>
</template>

<script setup lang="ts">
import { AlertDialogAction, type AlertDialogActionProps } from 'radix-vue'

const props = defineProps<AlertDialogActionProps>()
</script>