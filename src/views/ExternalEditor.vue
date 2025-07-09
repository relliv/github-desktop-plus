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
        <!-- Editor Selection Info -->
        <Card>
          <CardHeader>
            <CardTitle>Editor Selection</CardTitle>
            <CardDescription>
              Select multiple editors to appear in context menus. You can quickly switch between your favorite editors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Info class="w-4 h-4 text-muted-foreground" />
              <p class="text-sm text-muted-foreground">
                Selected editors will appear in the "Open in Editor" context menu. Toggle the checkbox next to each editor to add or remove it.
              </p>
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
              <div class="mb-4 flex items-center justify-between">
                <p class="text-sm text-muted-foreground">
                  {{ selectedEditorIds.length }} of {{ availableEditors.length }} editors selected
                </p>
                <div class="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    @click="selectAll"
                    :disabled="selectedEditorIds.length === availableEditors.length"
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    @click="deselectAll"
                    :disabled="selectedEditorIds.length === 0"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div 
                v-for="editor in sortedEditors" 
                :key="editor.id"
                class="group relative flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                :class="{
                  'border-primary bg-accent': isEditorSelected(editor.id)
                }"
              >
                <Checkbox
                  :checked="isEditorSelected(editor.id)"
                  @update:checked="() => toggleEditor(editor)"
                  class="ml-1"
                />
                
                <component 
                  :is="getEditorIconComponent(editor)" 
                  class="w-8 h-8 text-muted-foreground"
                />
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold">{{ editor.name }}</h3>
                    <Badge v-if="isEditorSelected(editor.id)" class="text-xs">
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
                  >
                    <PlayCircle class="w-4 h-4 mr-1" />
                    Test
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
import Button from '@/components/ui/Button.vue'
import { Badge } from '@/components/ui/badge'
import Separator from '@/components/ui/Separator.vue'
import EditorSelector from '@/components/EditorSelector.vue'
import { Checkbox } from '@/components/ui/checkbox'
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
  Atom,
  Info,
  Wind 
} from 'lucide-vue-next'

const { toast } = useToast()
const settingsStore = useSettingsStore()
const { 
  availableEditors, 
  loading, 
  error, 
  detectEditors, 
  openInEditor,
  getEditorIcon 
} = useEditor()

const selectedEditorIds = computed(() => settingsStore.selectedEditors)

const sortedEditors = computed(() => {
  return [...availableEditors.value].sort((a, b) => {
    // Put selected editors first
    const aSelected = isEditorSelected(a.id)
    const bSelected = isEditorSelected(b.id)
    if (aSelected && !bSelected) return -1
    if (!aSelected && bSelected) return 1
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
    'Wind': Wind,
  }
  
  return iconMap[iconName] || FileText
}

const isEditorSelected = (editorId: string) => {
  return settingsStore.isEditorSelected(editorId)
}

const toggleEditor = (editor: any) => {
  settingsStore.toggleEditor(editor.id)
  
  const action = isEditorSelected(editor.id) ? 'added to' : 'removed from'
  toast({
    title: 'Editor selection updated',
    description: `${editor.name} ${action} context menu`,
  })
}

const selectAll = () => {
  const allIds = availableEditors.value.map(e => e.id)
  settingsStore.setSelectedEditors(allIds)
  
  toast({
    title: 'All editors selected',
    description: 'All available editors added to context menu',
  })
}

const deselectAll = () => {
  settingsStore.setSelectedEditors([])
  
  toast({
    title: 'All editors deselected',
    description: 'All editors removed from context menu',
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

// The selectedEditorIds are automatically loaded from the store
</script>