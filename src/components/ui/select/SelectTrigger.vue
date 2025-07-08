<template>
  <button
    type="button"
    :id="id"
    @click="select.toggle()"
    :class="cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )"
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