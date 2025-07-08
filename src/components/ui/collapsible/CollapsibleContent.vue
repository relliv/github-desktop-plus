<template>
  <CollapsibleContent v-bind="props">
    <slot />
  </CollapsibleContent>
</template>

<script setup lang="ts">
import { CollapsibleContent, type CollapsibleContentProps } from 'radix-vue'

const props = defineProps<CollapsibleContentProps>()
</script>