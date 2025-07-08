<template>
  <div class="relative">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue'

interface Props {
  modelValue?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)

provide('select', {
  modelValue: props.modelValue,
  isOpen,
  toggle: () => isOpen.value = !isOpen.value,
  close: () => isOpen.value = false,
  select: (value: string) => {
    emit('update:modelValue', value)
    isOpen.value = false
  }
})
</script>