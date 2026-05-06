<template>
  <ContextMenuItem
    v-bind="forwarded"
    :class="
      cn(
        'focus:bg-card-translucent focus:text-accent-foreground relative flex cursor-default items-center rounded-sm border border-transparent px-2 py-1.5 text-sm transition-colors outline-none select-none focus:border-slate-800/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot />
  </ContextMenuItem>
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import {
  ContextMenuItem,
  type ContextMenuItemProps,
  type ContextMenuItemEmits,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<
  ContextMenuItemProps & {
    class?: HTMLAttributes['class']
    inset?: boolean
  }
>()
const emits = defineEmits<ContextMenuItemEmits>()

const delegatedProps = computed(() => {
  const { class: _, inset: __, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>
