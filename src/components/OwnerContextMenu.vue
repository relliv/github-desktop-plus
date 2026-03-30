<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent class="w-56">
      <ContextMenuItem v-if="parentFolder" @click="openInFolder(parentFolder)">
        <FolderOpen class="w-4 h-4 mr-2" />
        Open in Parent Folder
      </ContextMenuItem>
      <ContextMenuSub v-if="props.repos.length > 0">
        <ContextMenuSubTrigger>
          <FolderOpen class="w-4 h-4 mr-2" />
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
      <ContextMenuSeparator v-if="githubUrl && props.repos.length > 0" />
      <ContextMenuItem v-if="githubUrl" @click="viewOnGitHub">
        <ExternalLink class="w-4 h-4 mr-2" />
        View on GitHub
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem @click="refreshRemotes">
        <RefreshCw class="w-4 h-4 mr-2" />
        Refresh Remotes
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink, FolderOpen, RefreshCw } from 'lucide-vue-next'
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

interface Props {
  owner: string
  repos: Array<{ path: string; name?: string; remoteUrl?: string }>
}

const props = defineProps<Props>()

const parentFolder = computed(() => {
  if (props.repos.length === 0) return null
  const firstPath = props.repos[0].path
  const parent = firstPath.split('/').slice(0, -1).join('/')
  return parent || null
})

const githubUrl = computed(() => {
  const hasGitHub = props.repos.some(
    (repo) => repo.remoteUrl && repo.remoteUrl.includes('github.com')
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
</script>
