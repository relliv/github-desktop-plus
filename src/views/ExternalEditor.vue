<template>
  <div class="external-editor-page h-full flex flex-col">
    <!-- Header -->
    <div class="px-6 py-4 border-b">
      <h1 class="text-2xl font-semibold">External Editor</h1>
      <p class="text-muted-foreground mt-1">
        Configure your preferred code editor for opening files and repositories
      </p>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 py-6">
      <div class="max-w-3xl space-y-6">
        <!-- Current Editor Selection -->
        <Card>
          <CardHeader>
            <CardTitle>Default Editor</CardTitle>
            <CardDescription>
              Select the editor that will be used when opening files from the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditorSelector 
              v-model="selectedEditorId"
              @editor-selected="onEditorSelected"
            />
            
            <div v-if="selectedEditor" class="mt-4 p-3 bg-muted rounded-lg">
              <div class="flex items-center gap-3">
                <component 
                  :is="getEditorIconComponent(selectedEditor)" 
                  class="w-5 h-5 text-muted-foreground"
                />
                <div class="flex-1">
                  <div class="font-medium">{{ selectedEditor.name }}</div>
                  <div class="text-sm text-muted-foreground font-mono">{{ selectedEditor.executable }}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- All Available Editors -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Available Editors</CardTitle>
                <CardDescription>
                  All detected editors and IDEs on your system
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="refreshEditors"
                :disabled="loading"
              >
                <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
                <span class="ml-2">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="flex items-center justify-center py-8">
              <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
              <span class="ml-2 text-muted-foreground">Detecting editors...</span>
            </div>

            <div v-else-if="error" class="text-center py-8">
              <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
              <p class="text-destructive">{{ error }}</p>
              <Button variant="outline" size="sm" @click="refreshEditors" class="mt-4">
                Try Again
              </Button>
            </div>

            <div v-else-if="availableEditors.length === 0" class="text-center py-8">
              <FileQuestion class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p class="text-muted-foreground">No editors detected</p>
              <p class="text-sm text-muted-foreground mt-1">
                Make sure your editors are installed in standard locations
              </p>
            </div>

            <div v-else class="space-y-3">
              <div 
                v-for="editor in sortedEditors" 
                :key="editor.id"
                class="group relative flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                :class="{
                  'border-primary bg-accent': selectedEditor?.id === editor.id
                }"
              >
                <component 
                  :is="getEditorIconComponent(editor)" 
                  class="w-8 h-8 text-muted-foreground"
                />
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold">{{ editor.name }}</h3>
                    <Badge v-if="defaultEditor?.id === editor.id" variant="secondary" class="text-xs">
                      System Default
                    </Badge>
                    <Badge v-if="selectedEditor?.id === editor.id" class="text-xs">
                      Selected
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground font-mono truncate">
                    {{ editor.executable }}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    @click="testEditor(editor)"
                    class="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <PlayCircle class="w-4 h-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    v-if="selectedEditor?.id !== editor.id"
                    size="sm"
                    variant="default"
                    @click="selectEditor(editor)"
                  >
                    Select
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Editor Information -->
        <Card>
          <CardHeader>
            <CardTitle>Integration Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 class="font-medium mb-2">Supported Features</h4>
                <ul class="space-y-1 text-muted-foreground">
                  <li class="flex items-center gap-2">
                    <Check class="w-4 h-4 text-green-500" />
                    Open files and folders
                  </li>
                  <li class="flex items-center gap-2">
                    <Check class="w-4 h-4 text-green-500" />
                    Jump to specific line numbers
                  </li>
                  <li class="flex items-center gap-2">
                    <Check class="w-4 h-4 text-green-500" />
                    Open from commit history
                  </li>
                  <li class="flex items-center gap-2">
                    <Check class="w-4 h-4 text-green-500" />
                    Open from file changes
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 class="font-medium mb-2">Keyboard Shortcuts</h4>
                <ul class="space-y-1 text-muted-foreground">
                  <li class="flex items-center gap-2">
                    <Keyboard class="w-4 h-4" />
                    <kbd class="px-2 py-1 text-xs bg-muted rounded">Cmd/Ctrl + Shift + A</kbd>
                    Open in editor
                  </li>
                  <li class="flex items-center gap-2">
                    <Keyboard class="w-4 h-4" />
                    <kbd class="px-2 py-1 text-xs bg-muted rounded">Cmd/Ctrl + Shift + O</kbd>
                    Open repository
                  </li>
                </ul>
              </div>
            </div>

            <Separator />

            <div class="text-sm text-muted-foreground">
              <p class="mb-2">
                <strong>Note:</strong> If your editor is not detected, make sure it's installed in a standard location 
                or available in your system's PATH.
              </p>
              <p>
                The default editor is determined by your system's <code class="px-1 py-0.5 bg-muted rounded">EDITOR</code> or 
                <code class="px-1 py-0.5 bg-muted rounded">VISUAL</code> environment variables.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEditor } from '@/composables/useEditor'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/Separator'
import EditorSelector from '@/components/EditorSelector.vue'
import { 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  FileQuestion,
  PlayCircle,
  Check,
  Keyboard,
  FileCode2, 
  MousePointer2, 
  FileText, 
  Globe, 
  Lightbulb, 
  Terminal, 
  Zap, 
  Hammer,
  Atom 
} from 'lucide-vue-next'

const { toast } = useToast()
const settingsStore = useSettingsStore()
const { 
  availableEditors, 
  defaultEditor, 
  loading, 
  error, 
  detectEditors, 
  openInEditor,
  getEditorIcon 
} = useEditor()

const selectedEditorId = ref(settingsStore.externalEditor || '')
const selectedEditor = ref<any>(null)

const sortedEditors = computed(() => {
  return [...availableEditors.value].sort((a, b) => {
    // Put default editor first
    if (defaultEditor.value?.id === a.id) return -1
    if (defaultEditor.value?.id === b.id) return 1
    // Then selected editor
    if (selectedEditor.value?.id === a.id) return -1
    if (selectedEditor.value?.id === b.id) return 1
    // Then alphabetical
    return a.name.localeCompare(b.name)
  })
})

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
  settingsStore.setExternalEditor(editor.id)
}

const selectEditor = (editor: any) => {
  selectedEditorId.value = editor.id
  selectedEditor.value = editor
  settingsStore.setExternalEditor(editor.id)
  
  toast({
    title: 'Editor selected',
    description: `${editor.name} is now your default editor`,
  })
}

const testEditor = async (editor: any) => {
  try {
    // Create a test file path (current directory)
    const testPath = process.cwd()
    await openInEditor(testPath, editor)
    
    toast({
      title: 'Editor opened',
      description: `Successfully opened ${editor.name}`,
    })
  } catch (error) {
    toast({
      title: 'Failed to open editor',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive',
    })
  }
}

const refreshEditors = async () => {
  await detectEditors()
  
  if (!error.value) {
    toast({
      title: 'Editors refreshed',
      description: `Found ${availableEditors.value.length} editor${availableEditors.value.length !== 1 ? 's' : ''}`,
    })
  }
}

onMounted(() => {
  // Set selected editor from settings or default
  const savedEditorId = settingsStore.externalEditor
  if (savedEditorId) {
    const editor = availableEditors.value.find(e => e.id === savedEditorId)
    if (editor) {
      selectedEditor.value = editor
      selectedEditorId.value = savedEditorId
    }
  } else if (defaultEditor.value) {
    selectedEditor.value = defaultEditor.value
    selectedEditorId.value = defaultEditor.value.id
  }
})
</script>