<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent class="w-56">
      <ContextMenuItem
        v-for="repo in props.repos"
        :key="repo.path"
        @click="openInFolder(repo.path)"
      >
        <FolderOpen class="w-4 h-4 mr-2" />
        Open {{ repoName(repo.path) }} in Folder
      </ContextMenuItem>
      <ContextMenuSeparator v-if="githubUrl && props.repos.length > 0" />
      <ContextMenuItem v-if="githubUrl" @click="viewOnGitHub">
        <ExternalLink class="w-4 h-4 mr-2" />
        View on GitHub
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink, FolderOpen } from 'lucide-vue-next'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface Props {
  owner: string
  repos: Array<{ path: string; remoteUrl?: string }>
}

const props = defineProps<Props>()

const githubUrl = computed(() => {
  const hasGitHub = props.repos.some(
    (repo) => repo.remoteUrl && repo.remoteUrl.includes('github.com')
  )
  return hasGitHub ? `https://github.com/${props.owner}` : null
})

const repoName = (path: string) => path.split('/').pop() || path

const openInFolder = (path: string) => {
  window.api.shell.openPath(path)
}

const viewOnGitHub = () => {
  if (githubUrl.value) {
    window.api.shell.openExternal(githubUrl.value)
  }
}
</script>
