<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="
      cn(
        'peer border-primary ring-offset-background focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-4 w-4 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check class="h-4 w-4" :stroke-width="2" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import {
  CheckboxRoot,
  CheckboxIndicator,
  type CheckboxRootProps,
  type CheckboxRootEmits,
  useForwardPropsEmits,
} from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>
