<template>
  <div class="external-editor-page flex h-full flex-col">
    <!-- Header -->
    <div class="border-b px-6 py-4">
      <h1 class="text-2xl font-semibold">External Editor</h1>
      <p class="text-muted-foreground mt-1">
        Configure your preferred code editor for opening files and repositories
      </p>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 py-6" v-lenis>
      <div class="max-w-3xl space-y-6">
        <!-- Editor Selection Info -->
        <Card>
          <CardHeader>
            <CardTitle>Editor Selection</CardTitle>
            <CardDescription>
              Select multiple editors to appear in context menus. You can quickly switch between
              your favorite editors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="bg-muted flex items-center gap-2 rounded-lg p-3">
              <Info class="text-muted-foreground h-4 w-4" />
              <p class="text-muted-foreground text-sm">
                Selected editors will appear in the "Open in Editor" context menu. Toggle the
                checkbox next to each editor to add or remove it.
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
                <CardDescription> All detected editors and IDEs on your system </CardDescription>
              </div>
              <Button variant="outline" size="sm" @click="refreshEditors" :disabled="loading">
                <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
                <span class="ml-2">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="flex items-center justify-center py-8">
              <Loader2 class="text-muted-foreground h-6 w-6 animate-spin" />
              <span class="text-muted-foreground ml-2">Detecting editors...</span>
            </div>

            <div v-else-if="error" class="py-8 text-center">
              <AlertCircle class="text-destructive mx-auto mb-3 h-12 w-12" />
              <p class="text-destructive">{{ error }}</p>
              <Button variant="outline" size="sm" @click="refreshEditors" class="mt-4">
                Try Again
              </Button>
            </div>

            <div v-else-if="availableEditors.length === 0" class="py-8 text-center">
              <FileQuestion class="text-muted-foreground mx-auto mb-3 h-12 w-12" />
              <p class="text-muted-foreground">No editors detected</p>
              <p class="text-muted-foreground mt-1 text-sm">
                Make sure your editors are installed in standard locations
              </p>
            </div>

            <div v-else class="space-y-3">
              <div class="mb-4 flex items-center justify-between">
                <p class="text-muted-foreground text-sm">
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
                class="group hover:bg-accent/50 relative flex items-center gap-4 rounded-lg border p-4 transition-colors"
                :class="{
                  'border-primary bg-accent': isEditorSelected(editor.id),
                }"
              >
                <Checkbox
                  :checked="isEditorSelected(editor.id)"
                  @update:checked="() => toggleEditor(editor)"
                  class="ml-1"
                />

                <component
                  :is="getEditorIconComponent(editor)"
                  class="text-muted-foreground h-8 w-8"
                />

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold">{{ editor.name }}</h3>
                    <Badge v-if="isEditorSelected(editor.id)" class="text-xs"> Selected </Badge>
                  </div>
                  <p class="text-muted-foreground truncate font-mono text-sm">
                    {{ editor.executable }}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <Button size="sm" variant="ghost" @click="testEditor(editor)">
                    <PlayCircle class="mr-1 h-4 w-4" />
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
                <h4 class="mb-2 font-medium">Supported Features</h4>
                <ul class="text-muted-foreground space-y-1">
                  <li class="flex items-center gap-2">
                    <Check class="h-4 w-4 text-green-500" />
                    Open files and folders
                  </li>
                  <li class="flex items-center gap-2">
                    <Check class="h-4 w-4 text-green-500" />
                    Jump to specific line numbers
                  </li>
                  <li class="flex items-center gap-2">
                    <Check class="h-4 w-4 text-green-500" />
                    Open from commit history
                  </li>
                  <li class="flex items-center gap-2">
                    <Check class="h-4 w-4 text-green-500" />
                    Open from file changes
                  </li>
                </ul>
              </div>

              <div>
                <h4 class="mb-2 font-medium">Keyboard Shortcuts</h4>
                <ul class="text-muted-foreground space-y-1">
                  <li class="flex items-center gap-2">
                    <Keyboard class="h-4 w-4" />
                    <kbd class="bg-muted rounded px-2 py-1 text-xs">Cmd/Ctrl + Shift + A</kbd>
                    Open in editor
                  </li>
                  <li class="flex items-center gap-2">
                    <Keyboard class="h-4 w-4" />
                    <kbd class="bg-muted rounded px-2 py-1 text-xs">Cmd/Ctrl + Shift + O</kbd>
                    Open repository
                  </li>
                </ul>
              </div>
            </div>

            <Separator />

            <div class="text-muted-foreground text-sm">
              <p class="mb-2">
                <strong>Note:</strong> If your editor is not detected, make sure it's installed in a
                standard location or available in your system's PATH.
              </p>
              <p>
                The default editor is determined by your system's
                <code class="bg-muted rounded px-1 py-0.5">EDITOR</code> or
                <code class="bg-muted rounded px-1 py-0.5">VISUAL</code> environment variables.
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
  Wind,
} from 'lucide-vue-next'

const { toast } = useToast()
const settingsStore = useSettingsStore()
const { availableEditors, loading, error, detectEditors, openInEditor, getEditorIcon } = useEditor()

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
    FileCode2: FileCode2,
    MousePointer2: MousePointer2,
    FileText: FileText,
    Globe: Globe,
    Lightbulb: Lightbulb,
    Terminal: Terminal,
    Zap: Zap,
    Hammer: Hammer,
    Wind: Wind,
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
  const allIds = availableEditors.value.map((e) => e.id)
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
    // Test by opening the editor without a specific file
    // This will open the editor with its default behavior
    const result = await window.api.editor.openFile({
      editor,
      filePath: '', // Empty path to just launch the editor
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to open editor')
    }

    toast({
      title: 'Editor opened',
      description: `Successfully launched ${editor.name}`,
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
