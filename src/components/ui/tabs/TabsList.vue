<template>
  <TabsList
    :class="
      cn(
        'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1',
        props.class,
      )
    "
    v-bind="props"
  >
    <slot />
  </TabsList>
</template>

<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { TabsList, type TabsListProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>()
</script>
