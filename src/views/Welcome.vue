<template>
  <div class="flex flex-1 items-center justify-center p-8">
    <div class="w-full max-w-2xl text-center">
      <div class="mb-8">
        <GitBranch class="text-primary mx-auto mb-4 h-24 w-24" :stroke-width="1" />
        <h1 class="mb-4 text-4xl font-bold">Welcome to GitHub Desktop Plus</h1>
        <p class="text-muted-foreground text-lg">
          A powerful Git client built with Electron and Vue 3
        </p>
      </div>

      <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          class="hover:bg-accent/50 flex cursor-pointer flex-col items-center justify-center p-6 transition-colors"
          @click="openRepository"
        >
          <FolderOpen class="text-primary mb-4 h-12 w-12" :stroke-width="1" />
          <h3 class="mb-2 text-lg font-semibold">Open Repository</h3>
          <p class="text-muted-foreground text-sm">
            Open an existing Git repository from your computer
          </p>
        </Card>

        <Card
          class="hover:bg-accent/50 flex cursor-pointer flex-col items-center justify-center p-6 transition-colors"
          @click="cloneRepository"
        >
          <Download class="text-primary mb-4 h-12 w-12" :stroke-width="1" />
          <h3 class="mb-2 text-lg font-semibold">Clone Repository</h3>
          <p class="text-muted-foreground text-sm">Clone a repository from GitHub or any Git URL</p>
        </Card>
      </div>

      <div v-if="recentRepositories.length > 0" class="text-left">
        <h2 class="mb-4 text-xl font-semibold">Recent Repositories</h2>
        <div class="space-y-2">
          <Card
            v-for="repo in recentRepositories"
            :key="repo.id"
            class="hover:bg-accent/50 cursor-pointer p-4 transition-colors"
            @click="selectRepository(repo)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <GitBranch class="text-muted-foreground h-5 w-5" :stroke-width="1" />
                <div>
                  <div class="font-medium">{{ repo.name }}</div>
                  <div class="text-muted-foreground text-sm">{{ repo.path }}</div>
                </div>
              </div>
              <Star v-if="repo.isFavorite" class="h-4 w-4 text-yellow-500" :stroke-width="1" />
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
import { useRepositoriesStore } from '@/shared/stores'
import Card from '../components/ui/Card.vue'

const router = useRouter()
const repositoriesStore = useRepositoriesStore()

const recentRepositories = computed(() => repositoriesStore.recentRepositories)

const openRepository = async () => {
  try {
    const repo = await repositoriesStore.openRepositoryDialog()
    if (repo) {
      router.push('/repository')
    }
  } catch (error) {
    console.error('Failed to open repository:', error)
  }
}

const cloneRepository = () => {
  // TODO: Implement clone dialog
  console.log('Clone repository')
}

const selectRepository = (repo: any) => {
  repositoriesStore.setCurrentRepository(repo)
  router.push('/repository')
}
</script>
