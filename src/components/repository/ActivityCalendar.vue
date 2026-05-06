<template>
  <div class="flex flex-1 items-center justify-center">
    <div class="text-center">
      <CalendarDays class="text-muted-foreground mx-auto mb-3 size-8" :stroke-width="1" />
      <p class="text-muted-foreground text-sm">Activity calendar coming soon</p>
      <p class="text-muted-foreground mt-1 text-xs">Visualize your commit activity over time</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
</script>
