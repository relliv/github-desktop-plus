<template>
  <div ref="containerRef" class="flex-1 flex flex-col overflow-hidden">
    <div v-if="hasChanges" class="flex-1 flex flex-col overflow-hidden">
      <!-- Staged changes -->
      <div v-if="stagedFiles.length > 0" class="flex flex-col min-h-0" :class="unstagedFiles.length > 0 ? 'max-h-[50%]' : 'flex-1'">
        <div ref="stagedHeaderRef" class="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 class="text-sm font-medium">Staged Changes ({{ stagedFiles.length }})</h3>
          <Button variant="ghost" size="sm" @click="unstageAll">
            Unstage all
          </Button>
        </div>
        <RecycleScroller
          v-if="stagedFiles.length > 10"
          class="px-4"
          :style="{ height: `${stagedScrollerHeight}px` }"
          :items="stagedFilesWithId"
          :item-size="40"
          key-field="id"
          v-slot="{ item }"
        >
          <FileItem
            :file="item.file"
            :staged="true"
            @click="selectFile(item.file)"
            @unstage="unstageFile(item.file)"
          />
        </RecycleScroller>
        <div v-else class="flex-1 space-y-1 px-4 overflow-y-auto">
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
      <div v-if="unstagedFiles.length > 0" class="flex-1 flex flex-col min-h-0">
        <div ref="unstagedHeaderRef" class="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 class="text-sm font-medium">Changes ({{ unstagedFiles.length }})</h3>
          <Button variant="ghost" size="sm" @click="stageAll">
            Stage all
          </Button>
        </div>
        <RecycleScroller
          v-if="unstagedFiles.length > 10"
          class="px-4"
          :style="{ height: `${unstagedScrollerHeight}px` }"
          :items="unstagedFilesWithId"
          :item-size="40"
          key-field="id"
          v-slot="{ item }"
        >
          <FileItem
            :file="item.file"
            :staged="false"
            @click="selectFile(item.file)"
            @stage="stageFile(item.file)"
          />
        </RecycleScroller>
        <div v-else class="flex-1 space-y-1 px-4 overflow-y-auto">
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
    <div v-if="stagedFiles.length > 0" ref="commitSectionRef" class="shrink-0 border-t p-4">
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import { FileText } from 'lucide-vue-next'
import { useRepositoriesStore } from '@/shared/stores'
import Button from '../ui/Button.vue'
import FileItem from './FileItem.vue'

const repositoriesStore = useRepositoriesStore()
const commitMessage = ref('')
const selectedFile = ref<string | null>(null)

// Refs for size calculation
const containerRef = ref<HTMLElement | null>(null)
const stagedHeaderRef = ref<HTMLElement | null>(null)
const unstagedHeaderRef = ref<HTMLElement | null>(null)
const commitSectionRef = ref<HTMLElement | null>(null)

// Scroller heights
const stagedScrollerHeight = ref(200)
const unstagedScrollerHeight = ref(200)

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

const stagedFilesWithId = computed(() =>
  stagedFiles.value.map((file, index) => ({ id: `staged-${index}`, file }))
)
const unstagedFilesWithId = computed(() =>
  unstagedFiles.value.map((file, index) => ({ id: `unstaged-${index}`, file }))
)

const currentBranch = computed(() => currentRepository.value?.currentBranch || 'main')

let resizeObserver: ResizeObserver | null = null

const calculateScrollerHeights = () => {
  if (!containerRef.value) return

  const containerHeight = containerRef.value.clientHeight
  const stagedHeaderHeight = stagedHeaderRef.value?.clientHeight || 0
  const unstagedHeaderHeight = unstagedHeaderRef.value?.clientHeight || 0
  const commitSectionHeight = commitSectionRef.value?.clientHeight || 0

  const availableHeight = containerHeight - commitSectionHeight

  const hasBothSections = stagedFiles.value.length > 0 && unstagedFiles.value.length > 0

  if (hasBothSections) {
    // Split available height between both sections
    const halfHeight = availableHeight / 2
    stagedScrollerHeight.value = Math.max(100, halfHeight - stagedHeaderHeight)
    unstagedScrollerHeight.value = Math.max(100, halfHeight - unstagedHeaderHeight)
  } else if (stagedFiles.value.length > 0) {
    stagedScrollerHeight.value = Math.max(100, availableHeight - stagedHeaderHeight)
  } else if (unstagedFiles.value.length > 0) {
    unstagedScrollerHeight.value = Math.max(100, availableHeight - unstagedHeaderHeight)
  }
}

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    calculateScrollerHeights()
  })

  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }

  nextTick(() => calculateScrollerHeights())
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// Recalculate when file lists change
watch([stagedFiles, unstagedFiles], () => {
  nextTick(() => calculateScrollerHeights())
})

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

