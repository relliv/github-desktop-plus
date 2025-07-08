<template>
  <span>{{ displayValue || placeholder }}</span>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'

interface Props {
  placeholder?: string
}

defineProps<Props>()

const select = inject('select') as any
const displayValue = computed(() => select.modelValue)
</script>