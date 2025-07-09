<template>
  <Card class="max-w-2xl mx-auto">
    <CardHeader>
      <CardTitle>External Editor Integration</CardTitle>
      <CardDescription>
        Detect and integrate with installed code editors and IDEs
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Editor Selector -->
      <EditorSelector 
        v-model="selectedEditorId"
        @editor-selected="onEditorSelected"
      />
      
      <!-- Test File Opening -->
      <div class="space-y-4">
        <Separator />
        
        <div class="space-y-2">
          <Label>Test File Opening</Label>
          <div class="flex gap-2">
            <Input 
              v-model="testFilePath" 
              placeholder="Enter file path..."
              class="flex-1"
            />
            <Input 
              v-model="testLineNumber" 
              type="number"
              placeholder="Line"
              class="w-20"
            />
          </div>
          <Button 
            @click="openTestFile"
            :disabled="!selectedEditor || !testFilePath"
            class="w-full"
          >
            <FileCode2 class="w-4 h-4 mr-2" />
            Open in {{ selectedEditor?.name || 'Editor' }}
          </Button>
        </div>
      </div>
      
      <!-- All Detected Editors -->
      <div v-if="availableEditors.length > 0" class="space-y-4">
        <Separator />
        
        <div>
          <h3 class="font-medium mb-3">All Detected Editors</h3>
          <div class="space-y-2">
            <div 
              v-for="editor in availableEditors" 
              :key="editor.id"
              class="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div class="flex items-center gap-3">
                <component 
                  :is="getEditorIconComponent(editor)" 
                  class="w-5 h-5 text-muted-foreground"
                />
                <div>
                  <div class="font-medium">{{ editor.name }}</div>
                  <div class="text-sm text-muted-foreground">{{ editor.executable }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge v-if="defaultEditor?.id === editor.id" variant="secondary">
                  Default
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  @click="openInEditor(editor)"
                >
                  Open
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditor } from '@/composables/useEditor'
import { useToast } from '@/composables/useToast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Label from '@/components/ui/Label.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Separator from '@/components/ui/Separator.vue'
import { Badge } from '@/components/ui/badge'
import EditorSelector from '@/components/EditorSelector.vue'
import { 
  FileCode2, 
  MousePointer2, 
  FileText, 
  Globe, 
  Lightbulb, 
  Terminal, 
  Zap, 
  Hammer 
} from 'lucide-vue-next'

const { toast } = useToast()
const { availableEditors, defaultEditor, openInEditor, getEditorIcon } = useEditor()

const selectedEditorId = ref('')
const selectedEditor = ref<any>(null)
const testFilePath = ref('')
const testLineNumber = ref('')

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

const onEditorSelected = (editor: any) => {
  selectedEditor.value = editor
}

const openTestFile = async () => {
  if (!selectedEditor.value || !testFilePath.value) return
  
  try {
    const lineNumber = testLineNumber.value ? parseInt(testLineNumber.value) : undefined
    await openInEditor(testFilePath.value, selectedEditor.value, lineNumber)
    
    toast({
      title: 'File opened',
      description: `Opened ${testFilePath.value} in ${selectedEditor.value.name}`,
    })
  } catch (error) {
    toast({
      title: 'Failed to open file',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive',
    })
  }
}

const openInEditor = async (editor: any) => {
  try {
    // Open current project directory as example
    await window.api.editor.openFile({ 
      editor, 
      filePath: process.cwd() 
    })
    
    toast({
      title: 'Editor opened',
      description: `Opened project in ${editor.name}`,
    })
  } catch (error) {
    toast({
      title: 'Failed to open editor',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive',
    })
  }
}
</script>