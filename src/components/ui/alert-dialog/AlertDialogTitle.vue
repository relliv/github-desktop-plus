<template>
  <AlertDialogTitle
    :class="cn('text-lg font-semibold', props.class)"
    v-bind="props"
  >
    <slot />
  </AlertDialogTitle>
</template>

<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { AlertDialogTitle, type AlertDialogTitleProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<AlertDialogTitleProps & { class?: HTMLAttributes['class'] }>()
</script>