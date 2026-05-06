<template>
  <p :class="cn('text-muted-foreground text-sm', className)">
    <slot />
  </p>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>
