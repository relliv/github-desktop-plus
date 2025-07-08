<template>
  <button
    type="button"
    @click="select.select(value)"
    :class="cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      select.modelValue === value && 'bg-accent text-accent-foreground',
      className
    )"
  >
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Check v-if="select.modelValue === value" class="h-4 w-4" />
    </span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  className?: string
}

defineProps<Props>()

const select = inject('select') as any
</script>