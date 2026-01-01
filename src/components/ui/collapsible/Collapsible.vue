<template>
  <CollapsibleRoot v-bind="forwarded">
    <slot />
  </CollapsibleRoot>
</template>

<script setup lang="ts">
import { useForwardPropsEmits } from 'reka-ui'
import { CollapsibleRoot, type CollapsibleRootProps, type CollapsibleRootEmits } from 'reka-ui'

const props = defineProps<CollapsibleRootProps>()
const emits = defineEmits<CollapsibleRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>