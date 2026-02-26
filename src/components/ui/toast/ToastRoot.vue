<template>
  <ToastRoot
    v-bind="forwarded"
    :class="cn(
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all',
      'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--reka-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--reka-toast-swipe-move-x)] data-[swipe=move]:transition-none',
      'data-[state=open]:animate-in data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
      variant === 'destructive'
        ? 'destructive group border-destructive bg-destructive text-destructive-foreground'
        : 'border bg-background text-foreground',
      props.class
    )"
    @update:open="onOpenChange"
  >
    <slot />
  </ToastRoot>
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { ToastRoot, type ToastRootProps, type ToastRootEmits, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<ToastRootProps & {
  class?: HTMLAttributes['class']
  variant?: 'default' | 'destructive'
}>(), {
  variant: 'default',
})
const emits = defineEmits<ToastRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, variant: __, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

function onOpenChange(value: boolean) {
  emits('update:open', value)
}
</script>
