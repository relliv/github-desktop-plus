<template>
  <textarea
    :id="id"
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    :class="cn(
      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )"
  />
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  id?: string
  modelValue?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  className?: string
}

defineProps<Props>()
defineEmits(['update:modelValue'])
</script>