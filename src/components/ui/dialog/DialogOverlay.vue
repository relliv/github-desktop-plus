<template>
  <DialogOverlay
    :class="cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      props.class
    )"
    v-bind="delegatedProps"
  >
    <slot />
  </DialogOverlay>
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { DialogOverlay, type DialogOverlayProps, useForwardProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<DialogOverlayProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>