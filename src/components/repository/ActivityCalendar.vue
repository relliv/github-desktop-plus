<template>
  <div class="flex-1 flex items-center justify-center">
    <div class="text-center">
      <CalendarDays class="size-8 mx-auto mb-3 text-muted-foreground" :stroke-width="1" />
      <p class="text-sm text-muted-foreground">Activity calendar coming soon</p>
      <p class="text-xs text-muted-foreground mt-1">
        Visualize your commit activity over time
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays } from "lucide-vue-next";
</script>
