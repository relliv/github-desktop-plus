<template>
  <ContextMenu>
    <ContextMenuTrigger>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent class="w-64">
      <!-- Open in Editor submenu -->
      <ContextMenuSub v-if="hasSelectedEditors">
        <ContextMenuSubTrigger>
          <FileCode2 class="w-4 h-4 mr-2" />
          Open in Editor
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-48">
          <ContextMenuItem
            v-for="editor in contextMenuEditors"
            :key="editor.id"
            @click="() => openInEditor(editor)"
          >
            <component 
              :is="getEditorIconComponent(editor)" 
              class="w-4 h-4 mr-2"
            />
            {{ editor.name }}
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      
      <!-- Fallback if no editors selected -->
      <ContextMenuItem 
        v-else 
        @click="goToEditorSettings"
      >
        <Settings class="w-4 h-4 mr-2" />
        Configure Editors...
      </ContextMenuItem>
      
      <ContextMenuSeparator />
      
      <!-- Other file operations -->
      <ContextMenuItem @click="copyPath">
        <Copy class="w-4 h-4 mr-2" />
        Copy Path
      </ContextMenuItem>
      
      <ContextMenuItem @click="showInFolder">
        <Folder class="w-4 h-4 mr-2" />
        Show in Folder
      </ContextMenuItem>
      
      <slot name="extra-items" />
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useEditorContextMenu } from '@/composables/useEditorContextMenu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { 
  FileCode2, 
  Settings, 
  Copy, 
  Folder,
  FileText, 
  Globe, 
  Lightbulb, 
  Terminal, 
  Zap, 
  Hammer,
  MousePointer2,
  Wind
} from 'lucide-vue-next'

interface Props {
  filePath: string
  lineNumber?: number
}

const props = defineProps<Props>()
const router = useRouter()
const { toast } = useToast()
const { contextMenuEditors, hasSelectedEditors, openFileInEditor, getEditorIcon } = useEditorContextMenu()

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

const openInEditor = async (editor: any) => {
  try {
    await openFileInEditor(props.filePath, editor, props.lineNumber)
    toast({
      title: 'File opened',
      description: `Opened in ${editor.name}`,
    })
  } catch (error) {
    toast({
      title: 'Failed to open file',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive',
    })
  }
}

const goToEditorSettings = () => {
  router.push('/external-editor')
}

const copyPath = async () => {
  try {
    await navigator.clipboard.writeText(props.filePath)
    toast({
      title: 'Path copied',
      description: 'File path copied to clipboard',
    })
  } catch (error) {
    toast({
      title: 'Failed to copy',
      description: 'Could not copy path to clipboard',
      variant: 'destructive',
    })
  }
}

const showInFolder = async () => {
  try {
    await window.api.shell.openPath(props.filePath)
  } catch (error) {
    toast({
      title: 'Failed to open',
      description: 'Could not open file location',
      variant: 'destructive',
    })
  }
}
</script>