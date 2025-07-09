<template>
  <ContextMenuSub v-bind="forwarded">
    <slot />
  </ContextMenuSub>
</template>

<script setup lang="ts">
import { ContextMenuSub, type ContextMenuSubProps, type ContextMenuSubEmits, useForwardPropsEmits } from 'radix-vue'

const props = defineProps<ContextMenuSubProps>()
const emits = defineEmits<ContextMenuSubEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>