<template>
  <AlertDialogRoot v-bind="forwarded">
    <slot />
  </AlertDialogRoot>
</template>

<script setup lang="ts">
import { AlertDialogRoot, type AlertDialogRootProps, type AlertDialogRootEmits, useForwardPropsEmits } from 'radix-vue'

const props = defineProps<AlertDialogRootProps>()
const emits = defineEmits<AlertDialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>