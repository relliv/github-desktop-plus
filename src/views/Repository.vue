<template>
  <div class="flex-1 flex flex-col" v-if="currentRepository">
    <!-- Repository header -->
    <div class="h-[73px] px-6 border-b flex items-center justify-between">
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
          />
        </button>
      </div>
      
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="fetchChanges">
          <RefreshCw class="w-4 h-4 mr-2" />
          Fetch
        </Button>
        <Button variant="ghost" size="sm" @click="pullChanges" :disabled="!gitStatus?.behind">
          <Download class="w-4 h-4 mr-2" />
          Pull {{ gitStatus?.behind ? `(${gitStatus.behind})` : '' }}
        </Button>
        <Button variant="default" size="sm" @click="pushChanges" :disabled="!gitStatus?.ahead">
          <Upload class="w-4 h-4 mr-2" />
          Push {{ gitStatus?.ahead ? `(${gitStatus.ahead})` : '' }}
        </Button>
      </div>
    </div>
    
    <!-- Branch selector -->
    <div class="px-6 py-3 border-b flex items-center gap-4">
      <div class="flex items-center gap-2">
        <GitBranch class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-medium">Current branch:</span>
        <BranchSelector />
      </div>
    </div>
    
    <!-- Main content area -->
    <div class="flex-1 flex">
      <!-- Changes panel -->
      <div class="w-1/3 border-r flex flex-col">
        <div class="px-4 py-3 border-b">
          <h2 class="font-semibold">Changes</h2>
        </div>
        <ChangesPanel />
      </div>
      
      <!-- Diff viewer -->
      <div class="flex-1 flex flex-col">
        <div class="px-4 py-3 border-b">
          <h2 class="font-semibold">Diff</h2>
        </div>
        <DiffViewer />
      </div>
    </div>
  </div>
  
  <!-- No repository selected -->
  <div v-else class="flex-1 flex items-center justify-center">
    <div class="text-center">
      <GitBranch class="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h2 class="text-xl font-semibold mb-2">No repository selected</h2>
      <p class="text-muted-foreground">
        Select a repository from the sidebar or open a new one
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GitBranch, Star, RefreshCw, Download, Upload } from 'lucide-vue-next'
import { useRepositoryStore } from '../stores/repository.store'
import Button from '../components/ui/Button.vue'
import BranchSelector from '../components/repository/BranchSelector.vue'
import ChangesPanel from '../components/repository/ChangesPanel.vue'
import DiffViewer from '../components/repository/DiffViewer.vue'

const repositoryStore = useRepositoryStore()

const currentRepository = computed(() => repositoryStore.currentRepository)
const gitStatus = computed(() => repositoryStore.gitStatus)

const toggleFavorite = () => {
  if (currentRepository.value) {
    repositoryStore.toggleFavorite(currentRepository.value.id)
  }
}

const fetchChanges = async () => {
  if (currentRepository.value) {
    try {
      await window.api.git.fetch(currentRepository.value.path)
      await repositoryStore.fetchGitStatus()
    } catch (error) {
      console.error('Failed to fetch:', error)
    }
  }
}

const pullChanges = async () => {
  if (currentRepository.value) {
    try {
      await window.api.git.pull(currentRepository.value.path)
      await repositoryStore.fetchGitStatus()
    } catch (error) {
      console.error('Failed to pull:', error)
    }
  }
}

const pushChanges = async () => {
  if (currentRepository.value) {
    try {
      await window.api.git.push(currentRepository.value.path)
      await repositoryStore.fetchGitStatus()
    } catch (error) {
      console.error('Failed to push:', error)
    }
  }
}
</script>