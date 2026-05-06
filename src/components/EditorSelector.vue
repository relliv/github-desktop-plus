<template>
  <div class="editor-selector">
    <div v-if="loading" class="flex items-center justify-center p-4">
      <Loader2 class="h-5 w-5 animate-spin" />
      <span class="ml-2">Detecting editors...</span>
    </div>

    <div v-else-if="error" class="p-4 text-red-500">
      {{ error }}
    </div>

    <div v-else class="space-y-2">
      <div class="mb-4 flex items-center justify-between">
        <Label>External Editor</Label>
        <Button variant="ghost" size="sm" @click="detectEditors" :disabled="loading">
          <RefreshCw class="h-4 w-4" />
        </Button>
      </div>

      <Select v-model="selectedEditorId" @update:modelValue="onEditorChange">
        <SelectTrigger>
          <SelectValue placeholder="Select an editor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="editor in availableEditors" :key="editor.id" :value="editor.id">
            <div class="flex items-center gap-2">
              <component :is="getEditorIconComponent(editor)" class="h-4 w-4" />
              <span>{{ editor.name }}</span>
              <span
                v-if="defaultEditor?.id === editor.id"
                class="text-muted-foreground ml-auto text-xs"
              >
                (default)
              </span>
            </div>
          </SelectItem>
          <SelectItem v-if="availableEditors.length === 0" value="" disabled>
            No editors detected
          </SelectItem>
        </SelectContent>
      </Select>

      <p class="text-muted-foreground mt-2 text-sm">
        {{ availableEditors.length }} editor{{ availableEditors.length !== 1 ? 's' : '' }} detected
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEditor } from '@/composables/useEditor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Label from '@/components/ui/Label.vue'
import Button from '@/components/ui/Button.vue'
import {
  RefreshCw,
  Loader2,
  FileCode2,
  MousePointer2,
  FileText,
  Globe,
  Lightbulb,
  Terminal,
  Zap,
  Hammer,
} from 'lucide-vue-next'

interface Props {
  modelValue?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'editor-selected': [editor: any]
}>()

const { availableEditors, defaultEditor, loading, error, detectEditors, getEditorIcon } =
  useEditor()

const selectedEditorId = ref(props.modelValue || '')

const getEditorIconComponent = (editor: any) => {
  const iconName = getEditorIcon(editor)
  const iconMap: Record<string, any> = {
    FileCode2: FileCode2,
    MousePointer2: MousePointer2,
    FileText: FileText,
    Globe: Globe,
    Lightbulb: Lightbulb,
    Terminal: Terminal,
    Zap: Zap,
    Hammer: Hammer,
  }

  return iconMap[iconName] || FileText
}

const onEditorChange = (editorId: string) => {
  emit('update:modelValue', editorId)

  const editor = availableEditors.value.find((e) => e.id === editorId)
  if (editor) {
    emit('editor-selected', editor)
  }
}

onMounted(() => {
  // Set default editor if no value is provided
  if (!props.modelValue && defaultEditor.value) {
    selectedEditorId.value = defaultEditor.value.id
    onEditorChange(defaultEditor.value.id)
  }
})
</script>
