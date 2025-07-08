<template>
  <ProgressRoot
    v-bind="forwarded"
    :class="cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
      props.class
    )"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="`transform: translateX(-${100 - (modelValue || 0)}%)`"
    />
  </ProgressRoot>
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { ProgressRoot, ProgressIndicator, type ProgressRootProps, type ProgressRootEmits, useForwardPropsEmits } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ProgressRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const modelValue = computed(() => props.modelValue || 0)
</script>