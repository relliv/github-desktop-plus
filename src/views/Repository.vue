<template>
  <div class="flex-1 flex flex-col" v-if="currentRepository">
    <!-- Repository header -->
    <div class="h-[50px] px-6 border-b flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold">{{ currentRepository.name }}</h1>
        <button
          @click="toggleFavorite"
          class="p-1 hover:bg-accent rounded transition-colors"
          :title="currentRepository.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
        >
          <Star 
            :class="[
              'w-5 h-5',
              currentRepository.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''
            ]"
            :stroke-width="1"
          />
        </button>
      </div>
      
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="openRepositorySettings">
          <Settings class="w-4 h-4" :stroke-width="1" />
        </Button>
        <div class="w-px h-6 bg-border" />
        <Button variant="ghost" size="sm" @click="fetchChanges">
          <RefreshCw class="w-4 h-4 mr-2" :stroke-width="1" />
          Fetch
        </Button>
        <Button variant="ghost" size="sm" @click="pullChanges" :disabled="!gitStatus?.behind">
          <Download class="w-4 h-4 mr-2" :stroke-width="1" />
          Pull {{ gitStatus?.behind ? `(${gitStatus.behind})` : '' }}
        </Button>
        <Button variant="default" size="sm" @click="pushChanges" :disabled="!gitStatus?.ahead">
          <Upload class="w-4 h-4 mr-2" :stroke-width="1" />
          Push {{ gitStatus?.ahead ? `(${gitStatus.ahead})` : '' }}
        </Button>
      </div>
    </div>
    
    <!-- Branch selector -->
    <div class="px-6 py-3 border-b flex items-center gap-4">
      <div class="flex items-center gap-2">
        <GitBranch class="w-4 h-4 text-muted-foreground" :stroke-width="1" />
        <span class="text-sm font-medium">Current branch:</span>
        <BranchSelector />
      </div>
    </div>
    
    <!-- Main content area -->
    <SplitterGroup direction="horizontal" auto-save-id="repository-splitter" class="flex-1">
      <!-- Changes panel -->
      <SplitterPanel :default-size="30" :min-size="20" :max-size="50" class="flex flex-col">
        <div class="px-4 py-3 border-b">
          <h2 class="font-semibold">Changes</h2>
        </div>
        <ChangesPanel />
      </SplitterPanel>

      <SplitterResizeHandle class="w-2 flex items-center justify-center group border-x">
        <div class="h-8 w-1 rounded-full bg-border group-hover:bg-muted-foreground/50 transition-colors" />
      </SplitterResizeHandle>

      <!-- Diff viewer -->
      <SplitterPanel :default-size="70" :min-size="30" class="flex flex-col">
        <div class="px-4 py-3 border-b">
          <h2 class="font-semibold">Diff</h2>
        </div>
        <DiffViewer />
      </SplitterPanel>
    </SplitterGroup>
    
    <!-- Repository Settings Dialog -->
    <RepositorySettingsDialog ref="repoSettingsDialog" @repository-removed="handleRepositoryRemoved" />
  </div>
  
  <!-- No repository selected -->
  <div v-else class="flex-1 flex flex-col">
    <!-- Header -->
    <div class="h-[50px] px-6 border-b flex items-center">
      <h1 class="text-lg font-semibold">Welcome to GitHub Desktop Plus</h1>
    </div>
    
    <!-- Recent repositories -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Recent Repositories Section -->
        <div v-if="recentRepositories.length > 0" class="mb-8">
          <h2 class="text-lg font-semibold mb-4">Recent Repositories</h2>
          <div class="grid gap-3">
            <button
              v-for="repo in recentRepositories"
              :key="repo.id"
              @click="selectRepository(repo)"
              class="p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-left group"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <GitBranch class="w-4 h-4 text-muted-foreground" :stroke-width="1" />
                    <span class="font-medium">{{ repo.name }}</span>
                    <Star 
                      v-if="repo.isFavorite"
                      class="w-3 h-3 text-yellow-500 fill-yellow-500"
                      :stroke-width="1"
                    />
                  </div>
                  <p class="text-sm text-muted-foreground truncate">{{ repo.path }}</p>
                  <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span v-if="repo.currentBranch">
                      Branch: {{ repo.currentBranch }}
                    </span>
                    <span>
                      Last opened: {{ formatDate(repo.lastOpenedAt) }}
                    </span>
                  </div>
                </div>
                <ChevronRight class="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" :stroke-width="1" />
              </div>
            </button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
          <div class="grid grid-cols-3 gap-4">
            <button
              @click="createRepository"
              class="p-6 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-center"
            >
              <FilePlus class="w-8 h-8 mx-auto mb-2 text-primary" :stroke-width="1" />
              <h3 class="font-medium mb-1">Create Repository</h3>
              <p class="text-sm text-muted-foreground">
                Start a new project
              </p>
            </button>
            
            <button
              @click="cloneRepository"
              class="p-6 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-center"
            >
              <GitBranch class="w-8 h-8 mx-auto mb-2 text-primary" :stroke-width="1" />
              <h3 class="font-medium mb-1">Clone Repository</h3>
              <p class="text-sm text-muted-foreground">
                Clone from a URL
              </p>
            </button>
            
            <button
              @click="openRepository"
              class="p-6 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-center"
            >
              <FolderOpen class="w-8 h-8 mx-auto mb-2 text-primary" :stroke-width="1" />
              <h3 class="font-medium mb-1">Open Repository</h3>
              <p class="text-sm text-muted-foreground">
                Add a local repository
              </p>
            </button>
          </div>
        </div>

        <!-- Favorites -->
        <div v-if="favoriteRepositories.length > 0" class="mb-8">
          <h2 class="text-lg font-semibold mb-4">Favorite Repositories</h2>
          <div class="grid gap-3">
            <button
              v-for="repo in favoriteRepositories"
              :key="repo.id"
              @click="selectRepository(repo)"
              class="p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-left group"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <Star class="w-4 h-4 text-yellow-500 fill-yellow-500" :stroke-width="1" />
                    <span class="font-medium">{{ repo.name }}</span>
                  </div>
                  <p class="text-sm text-muted-foreground truncate">{{ repo.path }}</p>
                </div>
                <ChevronRight class="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" :stroke-width="1" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Dialogs -->
    <CloneDialog ref="cloneDialog" @clone-complete="handleRepositoryAction" />
    <OpenRepositoryDialog ref="openRepoDialog" @repository-opened="handleRepositoryAction" />
    <CreateRepositoryDialog ref="createRepoDialog" @repository-created="handleRepositoryAction" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import { GitBranch, Star, RefreshCw, Download, Upload, ChevronRight, FilePlus, FolderOpen, Settings } from 'lucide-vue-next'
import { useRepositoriesStore } from '@/shared/stores'
import Button from '../components/ui/Button.vue'
import BranchSelector from '../components/repository/BranchSelector.vue'
import ChangesPanel from '../components/repository/ChangesPanel.vue'
import DiffViewer from '../components/repository/DiffViewer.vue'
import CloneDialog from '../components/dialogs/CloneDialog.vue'
import OpenRepositoryDialog from '../components/dialogs/OpenRepositoryDialog.vue'
import CreateRepositoryDialog from '../components/dialogs/CreateRepositoryDialog.vue'
import RepositorySettingsDialog from '../components/dialogs/RepositorySettingsDialog.vue'

const repositoriesStore = useRepositoriesStore()

const cloneDialog = ref<InstanceType<typeof CloneDialog>>()
const openRepoDialog = ref<InstanceType<typeof OpenRepositoryDialog>>()
const createRepoDialog = ref<InstanceType<typeof CreateRepositoryDialog>>()
const repoSettingsDialog = ref<InstanceType<typeof RepositorySettingsDialog>>()

const currentRepository = computed(() => repositoriesStore.currentRepository)
const gitStatus = computed(() => repositoriesStore.gitStatus)
const recentRepositories = computed(() => repositoriesStore.recentRepositories)
const favoriteRepositories = computed(() => repositoriesStore.favoriteRepositories)

const toggleFavorite = () => {
  if (currentRepository.value) {
    repositoriesStore.toggleFavorite(currentRepository.value.id)
  }
}

const fetchChanges = async () => {
  if (currentRepository.value) {
    try {
      await window.api.git.fetch(currentRepository.value.path)
      await repositoriesStore.fetchGitStatus()
    } catch (error) {
      console.error('Failed to fetch:', error)
    }
  }
}

const pullChanges = async () => {
  if (currentRepository.value) {
    try {
      await window.api.git.pull(currentRepository.value.path)
      await repositoriesStore.fetchGitStatus()
    } catch (error) {
      console.error('Failed to pull:', error)
    }
  }
}

const pushChanges = async () => {
  if (currentRepository.value) {
    try {
      await window.api.git.push(currentRepository.value.path)
      await repositoriesStore.fetchGitStatus()
    } catch (error) {
      console.error('Failed to push:', error)
    }
  }
}

const selectRepository = (repo: any) => {
  repositoriesStore.setCurrentRepository(repo)
}

const createRepository = () => {
  createRepoDialog.value?.open()
}

const cloneRepository = () => {
  cloneDialog.value?.open()
}

const openRepository = () => {
  openRepoDialog.value?.open()
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

const handleRepositoryAction = (path: string) => {
  // Repository is already added and set as current by the dialog
  // The view will automatically update via computed properties
}

const openRepositorySettings = () => {
  if (currentRepository.value) {
    repoSettingsDialog.value?.open(currentRepository.value)
  }
}

const handleRepositoryRemoved = () => {
  // Repository has been removed, current repository will be null
  // The view will automatically show the welcome screen
}
</script>