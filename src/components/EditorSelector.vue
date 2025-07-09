<template>
  <div class="editor-selector">
    <div v-if="loading" class="flex items-center justify-center p-4">
      <Loader2 class="w-5 h-5 animate-spin" />
      <span class="ml-2">Detecting editors...</span>
    </div>
    
    <div v-else-if="error" class="text-red-500 p-4">
      {{ error }}
    </div>
    
    <div v-else class="space-y-2">
      <div class="flex items-center justify-between mb-4">
        <Label>External Editor</Label>
        <Button
          variant="ghost"
          size="sm"
          @click="detectEditors"
          :disabled="loading"
        >
          <RefreshCw class="w-4 h-4" />
        </Button>
      </div>
      
      <Select v-model="selectedEditorId" @update:modelValue="onEditorChange">
        <SelectTrigger>
          <SelectValue placeholder="Select an editor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem 
            v-for="editor in availableEditors" 
            :key="editor.id"
            :value="editor.id"
          >
            <div class="flex items-center gap-2">
              <component 
                :is="getEditorIconComponent(editor)" 
                class="w-4 h-4"
              />
              <span>{{ editor.name }}</span>
              <span v-if="defaultEditor?.id === editor.id" class="text-xs text-muted-foreground ml-auto">
                (default)
              </span>
            </div>
          </SelectItem>
          <SelectItem v-if="availableEditors.length === 0" value="" disabled>
            No editors detected
          </SelectItem>
        </SelectContent>
      </Select>
      
      <p class="text-sm text-muted-foreground mt-2">
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
  SelectValue 
} from '@/components/ui/select'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
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
  Hammer 
} from 'lucide-vue-next'

interface Props {
  modelValue?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'editor-selected': [editor: any]
}>()

const { 
  availableEditors, 
  defaultEditor, 
  loading, 
  error, 
  detectEditors, 
  getEditorIcon 
} = useEditor()

const selectedEditorId = ref(props.modelValue || '')

const getEditorIconComponent = (editor: any) => {
  const iconName = getEditorIcon(editor)
  const iconMap: Record<string, any> = {
    'FileCode2': FileCode2,
    'MousePointer2': MousePointer2,
    'FileText': FileText,
    'Globe': Globe,
    'Lightbulb': Lightbulb,
    'Terminal': Terminal,
    'Zap': Zap,
    'Hammer': Hammer,
  }
  
  return iconMap[iconName] || FileText
}

const onEditorChange = (editorId: string) => {
  emit('update:modelValue', editorId)
  
  const editor = availableEditors.value.find(e => e.id === editorId)
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