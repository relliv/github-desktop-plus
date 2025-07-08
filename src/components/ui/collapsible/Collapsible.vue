<template>
  <CollapsibleRoot v-bind="forwarded">
    <slot />
  </CollapsibleRoot>
</template>

<script setup lang="ts">
import { useForwardPropsEmits } from 'radix-vue'
import { CollapsibleRoot, type CollapsibleRootProps, type CollapsibleRootEmits } from 'radix-vue'

const props = defineProps<CollapsibleRootProps>()
const emits = defineEmits<CollapsibleRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>