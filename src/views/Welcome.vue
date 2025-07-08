<template>
  <div class="flex-1 flex items-center justify-center p-8">
    <div class="max-w-2xl w-full text-center">
      <div class="mb-8">
        <GitBranch class="w-24 h-24 mx-auto text-primary mb-4" />
        <h1 class="text-4xl font-bold mb-4">Welcome to GitHub Desktop Plus</h1>
        <p class="text-lg text-muted-foreground">
          A powerful Git client built with Electron and Vue 3
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card class="p-6 cursor-pointer hover:bg-accent/50 transition-colors" @click="openRepository">
          <FolderOpen class="w-12 h-12 mb-4 text-primary" />
          <h3 class="text-lg font-semibold mb-2">Open Repository</h3>
          <p class="text-sm text-muted-foreground">
            Open an existing Git repository from your computer
          </p>
        </Card>
        
        <Card class="p-6 cursor-pointer hover:bg-accent/50 transition-colors" @click="cloneRepository">
          <Download class="w-12 h-12 mb-4 text-primary" />
          <h3 class="text-lg font-semibold mb-2">Clone Repository</h3>
          <p class="text-sm text-muted-foreground">
            Clone a repository from GitHub or any Git URL
          </p>
        </Card>
      </div>
      
      <div v-if="recentRepositories.length > 0" class="text-left">
        <h2 class="text-xl font-semibold mb-4">Recent Repositories</h2>
        <div class="space-y-2">
          <Card 
            v-for="repo in recentRepositories"
            :key="repo.id"
            class="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            @click="selectRepository(repo)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <GitBranch class="w-5 h-5 text-muted-foreground" />
                <div>
                  <div class="font-medium">{{ repo.name }}</div>
                  <div class="text-sm text-muted-foreground">{{ repo.path }}</div>
                </div>
              </div>
              <Star v-if="repo.isFavorite" class="w-4 h-4 text-yellow-500" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { GitBranch, FolderOpen, Download, Star } from 'lucide-vue-next'
import { useRepositoryStore } from '../stores/repository.store'
import Card from '../components/ui/Card.vue'

const router = useRouter()
const repositoryStore = useRepositoryStore()

const recentRepositories = computed(() => repositoryStore.recentRepositories)

const openRepository = async () => {
  const path = await window.api.dialog.openDirectory()
  if (path) {
    try {
      await repositoryStore.addRepository(path)
      router.push('/repository')
    } catch (error) {
      console.error('Failed to open repository:', error)
    }
  }
}

const cloneRepository = () => {
  // TODO: Implement clone dialog
  console.log('Clone repository')
}

const selectRepository = (repo: any) => {
  repositoryStore.setCurrentRepository(repo)
  router.push('/repository')
}
</script>