<template>
  <ContextMenuTrigger v-bind="props">
    <slot />
  </ContextMenuTrigger>
</template>

<script setup lang="ts">
import { ContextMenuTrigger, type ContextMenuTriggerProps } from 'radix-vue'

const props = defineProps<ContextMenuTriggerProps>()
</script>