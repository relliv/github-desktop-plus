<template>
  <div
    v-if="select.isOpen.value"
    @click.stop
    :class="cn(
      'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80',
      position === 'popper' ? 'translate-y-1' : '',
      className
    )"
    :style="{ top: '100%', marginTop: '4px' }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, onUnmounted } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  position?: string
  className?: string
}

defineProps<Props>()

const select = inject('select') as any

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    select.close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>