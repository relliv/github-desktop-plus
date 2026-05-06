<template>
  <ContextMenuPortal>
    <ContextMenuContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'relative isolate z-50 min-w-[8rem] overflow-hidden rounded-lg border p-1 text-popover-foreground shadow-md',
          'before:content-[\'\'] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-popover before:backdrop-blur-xs',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.class,
        )
      "
    >
      <slot />
    </ContextMenuContent>
  </ContextMenuPortal>
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import {
  ContextMenuContent,
  ContextMenuPortal,
  type ContextMenuContentProps,
  type ContextMenuContentEmits,
  useForwardPropsEmits,
} from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  ContextMenuContentProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<ContextMenuContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>
