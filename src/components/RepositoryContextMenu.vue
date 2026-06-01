<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent class="w-64">
      <!-- Open in Editor submenu -->
      <ContextMenuSub v-if="hasSelectedEditors">
        <ContextMenuSubTrigger>
          <FileCode2 class="mr-2 h-4 w-4" />
          Open in Editor
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-48">
          <ContextMenuItem
            v-for="editor in contextMenuEditors"
            :key="editor.id"
            @click="() => openInEditor(editor)"
          >
            <img :src="getEditorIconUrl(editor)" :alt="editor.name" class="mr-2 h-4 w-4" />
            {{ editor.name }}
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <!-- Fallback if no editors selected -->
      <ContextMenuItem v-else @click="goToEditorSettings">
        <Settings class="mr-2 h-4 w-4" />
        Configure Editors...
      </ContextMenuItem>

      <ContextMenuSeparator />

      <!-- Repository actions -->
      <ContextMenuItem @click="openInNewWindow">
        <ExternalLink class="mr-2 h-4 w-4" />
        Open in New Window
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem @click="openInFinder">
        <Folder class="mr-2 h-4 w-4" />
        Show in {{ finderName }}
      </ContextMenuItem>

      <!-- Open in Terminal: submenu when multiple selected, single click otherwise -->
      <ContextMenuSub v-if="contextMenuTerminals.length > 1">
        <ContextMenuSubTrigger>
          <Terminal class="mr-2 h-4 w-4" />
          Open in Terminal
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-48">
          <ContextMenuItem
            v-for="terminal in contextMenuTerminals"
            :key="terminal.id"
            @click="() => openInSelectedTerminal(terminal)"
          >
            <img :src="getTerminalIconUrl(terminal)" :alt="terminal.name" class="mr-2 h-4 w-4" />
            {{ terminal.name }}
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuItem v-else @click="openInTerminal">
        <Terminal class="mr-2 h-4 w-4" />
        Open in Terminal
      </ContextMenuItem>

      <ContextMenuItem @click="copyPath">
        <Copy class="mr-2 h-4 w-4" />
        Copy Path
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem @click="toggleFavorite">
        <Star
          :class="['mr-2 h-4 w-4', repository.isFavorite ? 'fill-yellow-500 text-yellow-500' : '']"
        />
        {{ repository.isFavorite ? 'Remove from Favorites' : 'Add to Favorites' }}
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem @click="removeRepository" class="text-destructive">
        <Trash2 class="mr-2 h-4 w-4" />
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
import { useTerminalContextMenu } from '@/composables/useTerminalContextMenu'
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
  Terminal,
  Star,
  Trash2,
  ExternalLink,
} from 'lucide-vue-next'

interface Props {
  repository: {
    id: number
    name: string
    path: string
    isFavorite?: boolean
    currentBranch?: string | null
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
const { contextMenuEditors, hasSelectedEditors, openFileInEditor, getEditorIconUrl } =
  useEditorContextMenu()
const {
  contextMenuTerminals,
  openInTerminal: openInTerminalById,
  getTerminalIconUrl,
} = useTerminalContextMenu()

// Platform-specific finder name
const finderName = computed(() => {
  const platform = navigator.platform.toLowerCase()
  if (platform.includes('mac')) return 'Finder'
  if (platform.includes('win')) return 'Explorer'
  return 'File Manager'
})

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

const openInNewWindow = () => {
  window.api.window.newWindowWithRepo(props.repository.id)
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

const openInSelectedTerminal = async (terminal: any) => {
  try {
    await openInTerminalById(props.repository.path, terminal)
    toast({
      title: 'Terminal opened',
      description: `Opened in ${terminal.name}`,
    })
  } catch (error) {
    toast({
      title: 'Failed to open terminal',
      description: error instanceof Error ? error.message : 'Could not open terminal',
      variant: 'destructive',
    })
  }
}

const openInTerminal = async () => {
  // If exactly one terminal is selected, use it; otherwise fall back to OS default.
  const [selected] = contextMenuTerminals.value
  if (selected) {
    await openInSelectedTerminal(selected)
    return
  }
  try {
    const result = await window.api.shell.openTerminal(props.repository.path)
    if (!result.success) {
      throw new Error(result.error || 'Failed to open terminal')
    }
  } catch (error) {
    toast({
      title: 'Failed to open terminal',
      description:
        error instanceof Error ? error.message : 'Could not open terminal at repository location',
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

const removeRepository = () => {
  emit('remove')
}
</script>
