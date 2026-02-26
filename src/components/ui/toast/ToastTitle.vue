<template>
  <ToastTitle
    v-bind="forwarded"
    :class="cn('text-sm font-semibold', props.class)"
  >
    <slot />
  </ToastTitle>
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { ToastTitle, type ToastTitleProps, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<ToastTitleProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardProps(delegatedProps)
</script>
