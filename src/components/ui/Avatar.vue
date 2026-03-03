<template>
  <div
    class="rounded-full flex items-center justify-center font-semibold text-white ring-1 ring-background cursor-default overflow-hidden transition-transform"
    :class="sizeClasses"
    :style="{ backgroundColor: imageUrl ? undefined : avatarColor }"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="name"
      class="size-full object-cover"
    />
    <span v-else>{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const AVATAR_COLORS = [
  '#e11d48', '#db2777', '#c026d3', '#9333ea',
  '#7c3aed', '#4f46e5', '#2563eb', '#0284c7',
  '#0891b2', '#0d9488', '#059669', '#16a34a',
  '#ca8a04', '#ea580c', '#dc2626', '#6d28d9',
]

const props = withDefaults(defineProps<{
  name: string
  imageUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>(), {
  imageUrl: null,
  size: 'xs',
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'size-4 text-[7px]'
    case 'sm': return 'size-5 text-[8px]'
    case 'md': return 'size-6 text-[9px]'
    case 'lg': return 'size-8 text-xs'
  }
})

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return props.name.slice(0, 2).toUpperCase()
})

const avatarColor = computed(() => {
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
})
</script>
