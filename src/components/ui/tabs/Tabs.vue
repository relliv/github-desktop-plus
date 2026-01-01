<template>
  <TabsRoot v-bind="forwarded">
    <slot />
  </TabsRoot>
</template>

<script setup lang="ts">
import { useForwardPropsEmits } from 'reka-ui'
import { TabsRoot, type TabsRootProps, type TabsRootEmits } from 'reka-ui'

const props = defineProps<TabsRootProps>()
const emits = defineEmits<TabsRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>