<template>
  <button
    type="button"
    role="radio"
    :id="id"
    :aria-checked="checked"
    @click="radioGroup.select(value)"
    :class="cn(
      'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )"
  >
    <span
      v-if="checked"
      class="flex items-center justify-center"
    >
      <Circle class="h-2.5 w-2.5 fill-current text-current" :stroke-width="1" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { Circle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  id?: string
  value: string
  className?: string
}

const props = defineProps<Props>()

const radioGroup = inject('radioGroup') as any
const checked = computed(() => radioGroup.modelValue.value === props.value)
</script>