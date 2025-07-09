<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
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
      
      <!-- Repository actions -->
      <ContextMenuItem @click="openInFinder">
        <Folder class="w-4 h-4 mr-2" />
        Show in {{ finderName }}
      </ContextMenuItem>
      
      <ContextMenuItem @click="openInTerminal">
        <Terminal class="w-4 h-4 mr-2" />
        Open in Terminal
      </ContextMenuItem>
      
      <ContextMenuItem @click="copyPath">
        <Copy class="w-4 h-4 mr-2" />
        Copy Path
      </ContextMenuItem>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem @click="toggleFavorite">
        <Star 
          :class="[
            'w-4 h-4 mr-2',
            repository.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''
          ]"
        />
        {{ repository.isFavorite ? 'Remove from Favorites' : 'Add to Favorites' }}
      </ContextMenuItem>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem @click="openSettings">
        <Settings2 class="w-4 h-4 mr-2" />
        Repository Settings...
      </ContextMenuItem>
      
      <ContextMenuItem @click="removeRepository" class="text-destructive">
        <Trash2 class="w-4 h-4 mr-2" />
        Remove
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
  Settings2,
  Copy, 
  Folder,
  Terminal,
  Star,
  Trash2,
  FileText, 
  Globe, 
  Lightbulb, 
  Zap, 
  Hammer,
  MousePointer2
} from 'lucide-vue-next'

interface Props {
  repository: {
    id: number
    name: string
    path: string
    isFavorite?: boolean
    currentBranch?: string
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: []
  remove: []
  'toggle-favorite': []
}>()

const router = useRouter()
const { toast } = useToast()
const { contextMenuEditors, hasSelectedEditors, openFileInEditor, getEditorIcon } = useEditorContextMenu()

// Platform-specific finder name
const finderName = computed(() => {
  const platform = navigator.platform.toLowerCase()
  if (platform.includes('mac')) return 'Finder'
  if (platform.includes('win')) return 'Explorer'
  return 'File Manager'
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

const openInEditor = async (editor: any) => {
  try {
    await openFileInEditor(props.repository.path, editor)
    toast({
      title: 'Repository opened',
      description: `Opened in ${editor.name}`,
    })
  } catch (error) {
    toast({
      title: 'Failed to open repository',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive',
    })
  }
}

const goToEditorSettings = () => {
  router.push('/external-editor')
}

const openInFinder = async () => {
  try {
    await window.api.shell.openPath(props.repository.path)
  } catch (error) {
    toast({
      title: 'Failed to open',
      description: 'Could not open repository location',
      variant: 'destructive',
    })
  }
}

const openInTerminal = async () => {
  try {
    const result = await window.api.shell.openTerminal(props.repository.path)
    if (!result.success) {
      throw new Error(result.error || 'Failed to open terminal')
    }
  } catch (error) {
    toast({
      title: 'Failed to open terminal',
      description: error instanceof Error ? error.message : 'Could not open terminal at repository location',
      variant: 'destructive',
    })
  }
}

const copyPath = async () => {
  try {
    await navigator.clipboard.writeText(props.repository.path)
    toast({
      title: 'Path copied',
      description: 'Repository path copied to clipboard',
    })
  } catch (error) {
    toast({
      title: 'Failed to copy',
      description: 'Could not copy path to clipboard',
      variant: 'destructive',
    })
  }
}

const toggleFavorite = () => {
  emit('toggle-favorite')
}

const openSettings = () => {
  // You can implement a repository settings dialog here
  toast({
    title: 'Repository Settings',
    description: 'Repository settings dialog not implemented yet',
  })
}

const removeRepository = () => {
  emit('remove')
}
</script>