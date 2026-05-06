<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent class="w-56">
      <ContextMenuItem v-if="parentFolder" @click="openInFolder(parentFolder)">
        <FolderOpen class="mr-2 h-4 w-4" />
        Open in Parent Folder
      </ContextMenuItem>
      <ContextMenuSub v-if="props.repos.length > 0">
        <ContextMenuSubTrigger>
          <FolderOpen class="mr-2 h-4 w-4" />
          Open in Folder
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-48">
          <ContextMenuItem
            v-for="repo in props.repos"
            :key="repo.path"
            @click="openInFolder(repo.path)"
          >
            {{ repo.name || repo.path.split('/').pop() }}
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
      <ContextMenuItem :disabled="repositoriesStore.isScanning" @click="scanFolder">
        <FolderSearch class="mr-2 h-4 w-4" />
        {{ repositoriesStore.isScanning ? 'Scanning...' : 'Scan Folder' }}
      </ContextMenuItem>
      <ContextMenuSeparator v-if="githubUrl" />
      <ContextMenuItem v-if="githubUrl" @click="viewOnGitHub">
        <ExternalLink class="mr-2 h-4 w-4" />
        View on GitHub
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem @click="refreshRemotes">
        <RefreshCw class="mr-2 h-4 w-4" />
        Refresh Remotes
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink, FolderOpen, FolderSearch, RefreshCw } from 'lucide-vue-next'
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
import { useRepositoriesStore } from '@/shared/stores'

interface Props {
  owner: string
  repos: Array<{ path: string; name?: string; remoteUrl?: string }>
}

const props = defineProps<Props>()
const repositoriesStore = useRepositoriesStore()

const parentFolder = computed(() => {
  if (props.repos.length === 0) return null
  const firstPath = props.repos[0].path
  const parent = firstPath.split('/').slice(0, -1).join('/')
  return parent || null
})

const githubUrl = computed(() => {
  const hasGitHub = props.repos.some(
    (repo) => repo.remoteUrl && repo.remoteUrl.includes('github.com'),
  )
  return hasGitHub ? `https://github.com/${props.owner}` : null
})

const openInFolder = (path: string) => {
  window.api.shell.openPath(path)
}

const viewOnGitHub = () => {
  if (githubUrl.value) {
    window.api.shell.openExternal(githubUrl.value)
  }
}

const refreshRemotes = () => {
  window.api.repository.refreshRemotes().catch(console.error)
}

const scanFolder = () => {
  // Use the parent folder as default scan target if available
  repositoriesStore.scanFolder(parentFolder.value || undefined).catch(console.error)
}
</script>
