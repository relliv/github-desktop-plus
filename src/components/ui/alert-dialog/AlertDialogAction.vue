<template>
  <AlertDialogAction v-bind="props">
    <slot />
  </AlertDialogAction>
</template>

<script setup lang="ts">
import { AlertDialogAction, type AlertDialogActionProps } from 'reka-ui'

const props = defineProps<AlertDialogActionProps>()
</script>