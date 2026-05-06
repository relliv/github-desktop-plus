<template>
  <div
    v-if="select.isOpen.value"
    @click.stop
    :class="
      cn(
        'bg-popover text-popover-foreground animate-in fade-in-80 absolute z-50 min-w-[8rem] overflow-hidden rounded-lg border p-1 shadow-md backdrop-blur-xs',
        position === 'popper' ? 'translate-y-1' : '',
        className,
      )
    "
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
