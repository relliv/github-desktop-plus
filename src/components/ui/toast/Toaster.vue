<template>
  <ToastProvider>
    <ToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :duration="toast.duration"
      :variant="toast.variant"
      @update:open="(open) => { if (!open) removeToast(toast.id) }"
    >
      <div class="grid gap-1">
        <ToastTitle v-if="toast.title">{{ toast.title }}</ToastTitle>
        <ToastDescription v-if="toast.description">{{ toast.description }}</ToastDescription>
      </div>
      <ToastClose />
    </ToastRoot>
    <ToastViewport />
  </ToastProvider>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import ToastProvider from './ToastProvider.vue'
import ToastRoot from './ToastRoot.vue'
import ToastTitle from './ToastTitle.vue'
import ToastDescription from './ToastDescription.vue'
import ToastClose from './ToastClose.vue'
import ToastViewport from './ToastViewport.vue'

const { toasts, removeToast } = useToast()
</script>
