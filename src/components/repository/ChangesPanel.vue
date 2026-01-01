<template>
  <div class="flex-1 overflow-y-auto">
    <div v-if="hasChanges" class="p-4 space-y-4">
      <!-- Staged changes -->
      <div v-if="stagedFiles.length > 0">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">Staged Changes ({{ stagedFiles.length }})</h3>
          <Button variant="ghost" size="sm" @click="unstageAll">
            Unstage all
          </Button>
        </div>
        <div class="space-y-1">
          <FileItem
            v-for="file in stagedFiles"
            :key="file"
            :file="file"
            :staged="true"
            @click="selectFile(file)"
            @unstage="unstageFile(file)"
          />
        </div>
      </div>
      
      <!-- Unstaged changes -->
      <div v-if="unstagedFiles.length > 0">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">Changes ({{ unstagedFiles.length }})</h3>
          <Button variant="ghost" size="sm" @click="stageAll">
            Stage all
          </Button>
        </div>
        <div class="space-y-1">
          <FileItem
            v-for="file in unstagedFiles"
            :key="file"
            :file="file"
            :staged="false"
            @click="selectFile(file)"
            @stage="stageFile(file)"
          />
        </div>
      </div>
    </div>
    
    <!-- No changes -->
    <div v-else class="flex items-center justify-center h-full">
      <div class="text-center">
        <FileText class="w-12 h-12 mx-auto mb-3 text-muted-foreground" :stroke-width="1" />
        <p class="text-sm text-muted-foreground">No changes in repository</p>
      </div>
    </div>
    
    <!-- Commit section -->
    <div v-if="stagedFiles.length > 0" class="border-t p-4">
      <textarea
        v-model="commitMessage"
        placeholder="Commit message"
        class="w-full px-3 py-2 text-sm border rounded-md resize-none h-20 bg-background"
      />
      <Button
        @click="commit"
        :disabled="!commitMessage.trim()"
        class="w-full mt-2"
      >
        Commit to {{ currentBranch }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText } from 'lucide-vue-next'
import { useRepositoriesStore } from '@/shared/stores'
import Button from '../ui/Button.vue'
import FileItem from './FileItem.vue'

const repositoriesStore = useRepositoriesStore()
const commitMessage = ref('')
const selectedFile = ref<string | null>(null)

const gitStatus = computed(() => repositoriesStore.gitStatus)
const currentRepository = computed(() => repositoriesStore.currentRepository)
const hasChanges = computed(() => repositoriesStore.hasChanges)

const stagedFiles = computed(() => gitStatus.value?.staged || [])
const unstagedFiles = computed(() => {
  if (!gitStatus.value) return []
  return [
    ...gitStatus.value.modified,
    ...gitStatus.value.added,
    ...gitStatus.value.deleted
  ].filter(file => !stagedFiles.value.includes(file))
})

const currentBranch = computed(() => currentRepository.value?.currentBranch || 'main')

const selectFile = (file: string) => {
  selectedFile.value = file
  // TODO: Emit event to update diff viewer
}

const stageFile = async (file: string) => {
  if (!currentRepository.value) return
  try {
    await window.api.git.stage(currentRepository.value.path, [file])
    await repositoriesStore.fetchGitStatus()
  } catch (error) {
    console.error('Failed to stage file:', error)
  }
}

const unstageFile = async (file: string) => {
  if (!currentRepository.value) return
  try {
    await window.api.git.unstage(currentRepository.value.path, [file])
    await repositoriesStore.fetchGitStatus()
  } catch (error) {
    console.error('Failed to unstage file:', error)
  }
}

const stageAll = async () => {
  if (!currentRepository.value) return
  try {
    // Convert reactive array to plain array for IPC serialization
    await window.api.git.stage(currentRepository.value.path, [...unstagedFiles.value])
    await repositoriesStore.fetchGitStatus()
  } catch (error) {
    console.error('Failed to stage all:', error)
  }
}

const unstageAll = async () => {
  if (!currentRepository.value) return
  try {
    // Convert reactive array to plain array for IPC serialization
    await window.api.git.unstage(currentRepository.value.path, [...stagedFiles.value])
    await repositoriesStore.fetchGitStatus()
  } catch (error) {
    console.error('Failed to unstage all:', error)
  }
}

const commit = async () => {
  if (!currentRepository.value || !commitMessage.value.trim()) return
  
  try {
    await window.api.git.commit(currentRepository.value.path, commitMessage.value)
    commitMessage.value = ''
    await repositoriesStore.fetchGitStatus()
  } catch (error) {
    console.error('Failed to commit:', error)
  }
}
</script>