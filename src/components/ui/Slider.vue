<template>
  <div
    :class="cn('relative flex w-full touch-none select-none items-center', className)"
  >
    <div class="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <div
        class="absolute h-full bg-primary"
        :style="{ width: `${percentage}%` }"
      />
    </div>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue?.[0] || min"
      @input="handleInput"
      class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: number[]
  min?: number
  max?: number
  step?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1
})

const emit = defineEmits(['update:modelValue'])

const percentage = computed(() => {
  const value = props.modelValue?.[0] || props.min
  return ((value - props.min) / (props.max - props.min)) * 100
})

const handleInput = (e: Event) => {
  const value = Number((e.target as HTMLInputElement).value)
  emit('update:modelValue', [value])
}
</script>