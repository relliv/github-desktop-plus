<template>
  <ContextMenuRoot v-bind="forwarded">
    <slot />
  </ContextMenuRoot>
</template>

<script setup lang="ts">
import { ContextMenuRoot, type ContextMenuRootProps, type ContextMenuRootEmits, useForwardPropsEmits } from 'radix-vue'

const props = defineProps<ContextMenuRootProps>()
const emits = defineEmits<ContextMenuRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>