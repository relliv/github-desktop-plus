<template>
  <h3 :class="cn('text-lg leading-none font-semibold tracking-tight', className)">
    <slot />
  </h3>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>
