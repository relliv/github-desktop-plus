<template>
  <ToastViewport
    v-bind="forwarded"
    :class="cn(
      'fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      props.class
    )"
  />
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { ToastViewport, type ToastViewportProps, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<ToastViewportProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardProps(delegatedProps)
</script>
