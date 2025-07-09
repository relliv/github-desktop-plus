<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>

<script setup lang="ts">
import { useForwardPropsEmits } from 'radix-vue'
import { DialogRoot } from 'radix-vue'
import type { DialogRootProps, DialogRootEmits } from 'radix-vue'

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>