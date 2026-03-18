<template>
  <div
    class="absolute size-[18px] rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors"
    :class="[
      active
        ? 'bg-primary border-primary'
        : 'bg-background border-muted-foreground/30 hover:border-primary/60',
    ]"
    :style="{ left: '2px', top: '10px' }"
    @click="$emit('click')"
  >
    <div
      class="size-2 rounded-full"
      :class="active ? 'bg-primary-foreground' : 'bg-muted-foreground/50'"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>
