<template>
  <div :class="cn('grid gap-2', className)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provide, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  className?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

provide('radioGroup', {
  modelValue: computed(() => props.modelValue),
  select: (value: string) => emit('update:modelValue', value)
})
</script>