<template>
  <TooltipProvider :delay-duration="400">
    <div class="flex shrink-0 items-center" :class="authors.length > 1 ? '-space-x-1' : ''">
      <TooltipRoot v-for="(author, i) in authors" :key="i">
        <TooltipTrigger as-child>
          <div
            :style="{ zIndex: authors.length - i }"
            class="transition-transform hover:!z-50 hover:scale-125"
          >
            <Avatar :name="author.name" :image-url="author.imageUrl" :size="size" />
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent
            side="top"
            :side-offset="6"
            class="bg-popover text-popover-foreground z-[60] rounded-md border px-2.5 py-1.5 shadow-md"
          >
            <p class="text-xs font-medium">{{ author.name }}</p>
            <p class="text-muted-foreground text-[11px]">{{ author.email }}</p>
            <TooltipArrow class="fill-popover" />
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import Avatar from './Avatar.vue'

export interface AvatarAuthor {
  name: string
  email: string
  imageUrl?: string | null
}

withDefaults(
  defineProps<{
    authors: AvatarAuthor[]
    size?: 'xs' | 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'xs',
  },
)
</script>
