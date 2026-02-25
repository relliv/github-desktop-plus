<template>
  <aside class="relative bg-card border-r flex flex-col h-full w-full overflow-hidden">
    
    <!-- User section -->
    <div class="h-[50px] px-4 border-b flex items-center">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <User class="w-4 h-4 text-primary-foreground" :stroke-width="1" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">User</div>
          <div class="text-xs text-muted-foreground truncate">Not signed in</div>
        </div>
      </div>
    </div>
    
    <!-- Repository section -->
    <div class="flex-1 overflow-y-auto">
      <div class="px-2 py-4">
        <div class="flex items-center justify-between px-2 mb-2">
          <h3 class="font-medium text-sm">Repositories</h3>
          <div class="flex gap-1">
            <button
              @click="createRepository"
              class="p-1 hover:bg-accent rounded transition-colors"
              title="Create new repository"
            >
              <FilePlus class="w-4 h-4" :stroke-width="1" />
            </button>
            <button
              @click="cloneRepository"
              class="p-1 hover:bg-accent rounded transition-colors"
              title="Clone repository"
            >
              <GitBranch class="w-4 h-4" :stroke-width="1" />
            </button>
            <button
              @click="openRepository"
              class="p-1 hover:bg-accent rounded transition-colors"
              title="Add repository"
            >
              <Plus class="w-4 h-4" :stroke-width="1" />
            </button>
          </div>
        </div>
        
        <!-- Repository list grouped by owner -->
        <div class="space-y-2">
          <div v-for="group in repositoriesByOwner" :key="group.owner">
            <!-- Owner header -->
            <button
              @click="toggleGroup(group.owner)"
              class="w-full flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                v-if="!collapsedGroups.has(group.owner)"
                class="w-3 h-3 flex-shrink-0"
                :stroke-width="1.5"
              />
              <ChevronRight
                v-else
                class="w-3 h-3 flex-shrink-0"
                :stroke-width="1.5"
              />
              <span class="truncate">{{ group.owner }}</span>
              <span class="ml-auto text-[10px] opacity-60">{{ group.repos.length }}</span>
            </button>

            <!-- Repositories in group -->
            <div v-if="!collapsedGroups.has(group.owner)" class="space-y-0.5 ml-2">
              <RepositoryContextMenu
                v-for="repo in group.repos"
                :key="repo.id"
                :repository="repo"
                @select="selectRepository(repo)"
                @remove="removeRepository(repo)"
                @toggle-favorite="toggleFavorite(repo)"
              >
                <button
                  @click="selectRepository(repo)"
                  :class="[
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left',
                    currentRepository?.id === repo.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  ]"
                  :title="repo.name"
                >
                  <Folder class="w-4 h-4 flex-shrink-0" :stroke-width="1" />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ repo.name }}</div>
                    <div class="text-xs text-muted-foreground truncate">
                      {{ repo.currentBranch || 'No branch' }}
                    </div>
                  </div>
                  <Star
                    v-if="repo.isFavorite"
                    class="w-3 h-3 text-yellow-500 flex-shrink-0"
                    :stroke-width="1"
                  />
                </button>
              </RepositoryContextMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom actions -->
    <div class="border-t p-2 space-y-1">
      <SidebarButton
        :icon="Settings"
        label="Settings"
        @click="openSettings"
      />
    </div>
    
    <!-- Clone Dialog -->
    <CloneDialog ref="cloneDialog" @clone-complete="handleCloneComplete" />

    <!-- Open Repository Dialog -->
    <OpenRepositoryDialog ref="openRepoDialog" @repository-opened="handleRepositoryOpened" />

    <!-- Create Repository Dialog -->
    <CreateRepositoryDialog ref="createRepoDialog" @repository-created="handleRepositoryCreated" />

    <!-- App Settings Dialog -->
    <AppSettingsDialog ref="appSettingsDialog" />
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  Plus,
  GitBranch,
  Folder,
  Star,
  Settings,
  FilePlus,
  ChevronDown,
  ChevronRight
} from 'lucide-vue-next'
import { useRepositoriesStore } from '@/shared/stores'
import SidebarButton from '../ui/SidebarButton.vue'
import CloneDialog from '../dialogs/CloneDialog.vue'
import OpenRepositoryDialog from '../dialogs/OpenRepositoryDialog.vue'
import CreateRepositoryDialog from '../dialogs/CreateRepositoryDialog.vue'
import AppSettingsDialog from '../dialogs/AppSettingsDialog.vue'
import RepositoryContextMenu from '../RepositoryContextMenu.vue'

const router = useRouter()
const repositoriesStore = useRepositoriesStore()

const cloneDialog = ref<InstanceType<typeof CloneDialog>>()
const openRepoDialog = ref<InstanceType<typeof OpenRepositoryDialog>>()
const createRepoDialog = ref<InstanceType<typeof CreateRepositoryDialog>>()
const appSettingsDialog = ref<InstanceType<typeof AppSettingsDialog>>()

const repositories = computed(() => repositoriesStore.repositories)
const currentRepository = computed(() => repositoriesStore.currentRepository)

// Extract owner from repository remote URL
const getOwner = (remoteUrl?: string): string => {
  if (!remoteUrl) return 'Local'

  // Handle HTTPS URLs: https://github.com/owner/repo.git
  const httpsMatch = remoteUrl.match(/https?:\/\/[^/]+\/([^/]+)\//)
  if (httpsMatch) return httpsMatch[1]

  // Handle SSH URLs: git@github.com:owner/repo.git
  const sshMatch = remoteUrl.match(/git@[^:]+:([^/]+)\//)
  if (sshMatch) return sshMatch[1]

  return 'Local'
}

// Group repositories by owner
const repositoriesByOwner = computed(() => {
  const groups: Record<string, typeof repositories.value> = {}

  for (const repo of repositories.value) {
    const owner = getOwner(repo.remoteUrl)
    if (!groups[owner]) {
      groups[owner] = []
    }
    groups[owner].push(repo)
  }

  // Sort groups alphabetically, but put favorites first within each group
  const sortedGroups: { owner: string; repos: typeof repositories.value }[] = []
  for (const [owner, repos] of Object.entries(groups)) {
    sortedGroups.push({
      owner,
      repos: repos.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        return a.name.localeCompare(b.name)
      })
    })
  }

  return sortedGroups.sort((a, b) => a.owner.localeCompare(b.owner))
})

// Track collapsed state for each owner group
const collapsedGroups = ref<Set<string>>(new Set())

const toggleGroup = (owner: string) => {
  if (collapsedGroups.value.has(owner)) {
    collapsedGroups.value.delete(owner)
  } else {
    collapsedGroups.value.add(owner)
  }
}

const openRepository = () => {
  openRepoDialog.value?.open()
}

const createRepository = () => {
  createRepoDialog.value?.open()
}

const cloneRepository = () => {
  cloneDialog.value?.open()
}

const selectRepository = (repo: any) => {
  repositoriesStore.setCurrentRepository(repo)
  router.push('/repository')
}

const openSettings = () => {
  appSettingsDialog.value?.open()
}

const handleCloneComplete = () => {
  router.push('/repository')
}

const handleRepositoryOpened = () => {
  router.push('/repository')
}

const handleRepositoryCreated = () => {
  router.push('/repository')
}

const removeRepository = async (repo: any) => {
  await repositoriesStore.removeRepository(repo.id)
}

const toggleFavorite = async (repo: any) => {
  await repositoriesStore.toggleFavorite(repo.id)
}
</script>