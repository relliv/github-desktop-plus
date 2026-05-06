<template>
  <div
    :class="cn('bg-card-translucent text-card-foreground rounded-lg border shadow-sm', className)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>
