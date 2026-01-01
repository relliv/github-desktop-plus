<template>
  <ContextMenuTrigger v-bind="props">
    <slot />
  </ContextMenuTrigger>
</template>

<script setup lang="ts">
import { ContextMenuTrigger, type ContextMenuTriggerProps } from 'reka-ui'

const props = defineProps<ContextMenuTriggerProps>()
</script>