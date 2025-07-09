<template>
  <AlertDialogRoot v-bind="forwarded">
    <slot />
  </AlertDialogRoot>
</template>

<script setup lang="ts">
import { useForwardPropsEmits } from 'radix-vue'
import { AlertDialogRoot } from 'radix-vue'
import type { AlertDialogRootProps, AlertDialogRootEmits } from 'radix-vue'

const props = defineProps<AlertDialogRootProps>()
const emits = defineEmits<AlertDialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>