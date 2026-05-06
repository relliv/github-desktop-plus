<template>
  <button
    type="button"
    :id="id"
    @click="select.toggle()"
    :class="
      cn(
        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )
    "
  >
    <slot />
    <ChevronDown class="h-4 w-4 opacity-50" :stroke-width="1" />
  </button>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  id?: string
  className?: string
}

defineProps<Props>()

const select = inject('select') as any
</script>
