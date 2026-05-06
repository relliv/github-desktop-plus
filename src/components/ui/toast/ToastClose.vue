<template>
  <ToastClose
    v-bind="forwarded"
    :class="
      cn(
        'text-foreground/50 hover:text-foreground absolute top-2 right-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:ring-2 focus:outline-none',
        'group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
        props.class,
      )
    "
  >
    <slot>
      <X class="size-4" />
    </slot>
  </ToastClose>
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { ToastClose, type ToastCloseProps, useForwardProps } from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<ToastCloseProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardProps(delegatedProps)
</script>
