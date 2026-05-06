<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <div v-if="hasChanges" class="flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden p-2">
      <!-- Staged changes -->
      <div v-if="stagedFiles.length > 0" class="flex min-h-0 flex-1 flex-col">
        <div class="mb-2 flex shrink-0 items-center justify-between">
          <h3 class="text-sm font-medium">Staged Changes ({{ stagedFiles.length }})</h3>
          <Button variant="ghost" size="sm" @click="unstageAll"> Unstage all </Button>
        </div>
        <div class="min-h-0 flex-1 space-y-0.5 overflow-y-auto" v-lenis>
          <FileItem
            v-for="file in stagedFiles"
            :key="file"
            :file="file"
            :staged="true"
            :status="getFileStatus(file)"
            :renamed-from="renamedMap.get(file)"
            @click="selectFile(file, true)"
            @unstage="unstageFile(file)"
            @discard="requestDiscard(file, getFileStatus(file), true)"
          />
        </div>
      </div>

      <!-- Unstaged changes -->
      <div v-if="unstagedEntries.length > 0" class="flex min-h-0 flex-1 flex-col">
        <div class="mb-2 flex shrink-0 items-center justify-between">
          <h3 class="text-sm font-medium">Changes ({{ unstagedEntries.length }})</h3>
          <Button variant="ghost" size="sm" @click="stageAll"> Stage all </Button>
        </div>
        <div class="min-h-0 flex-1 space-y-1 overflow-y-auto" v-lenis>
          <FileItem
            v-for="entry in unstagedEntries"
            :key="entry.path"
            :file="entry.path"
            :staged="false"
            :status="entry.status"
            @click="selectFile(entry.path)"
            @stage="stageFile(entry.path)"
            @discard="requestDiscard(entry.path, entry.status, false)"
          />
        </div>
      </div>
    </div>

    <!-- No changes -->
    <div v-else class="flex h-full items-center justify-center">
      <div class="text-center">
        <FileText class="text-muted-foreground mx-auto mb-3 h-12 w-12" :stroke-width="1" />
        <p class="text-muted-foreground text-sm">No changes in repository</p>
      </div>
    </div>

    <!-- Discard confirmation -->
    <AlertDialog v-model:open="discardDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to discard all changes to
            <strong>{{ pendingDiscard?.path }}</strong
            >? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmDiscard"
          >
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Commit section -->
    <div v-if="hasChanges" class="shrink-0 space-y-2 border-t p-3">
      <textarea
        v-model="commitMessage"
        placeholder="Summary (required)"
        class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        rows="1"
      />
      <textarea
        v-model="commitDescription"
        placeholder="Description"
        class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        rows="2"
      />
      <Button
        @click="commit"
        :disabled="!commitMessage.trim() || stagedFiles.length === 0"
        class="w-full"
        size="sm"
      >
        <GitCommit class="mr-2 h-4 w-4" :stroke-width="1.5" />
        Commit Changes
      </Button>
      <p v-if="stagedFiles.length === 0" class="text-muted-foreground text-center text-xs">
        Stage changes to commit
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText, GitCommit } from 'lucide-vue-next'
import { useRepositoriesStore } from '@/shared/stores'
import Button from '../ui/Button.vue'
import FileItem from './FileItem.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

const repositoriesStore = useRepositoriesStore()
const commitMessage = ref('')
const commitDescription = ref('')
export type FileStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'conflicted'

export interface FileEntry {
  path: string
  status: FileStatus
}

const emit = defineEmits<{
  fileSelected: [file: string, staged: boolean, status: FileStatus]
}>()

const selectedFile = ref<string | null>(null)

const gitStatus = computed(() => repositoriesStore.gitStatus)
const currentRepository = computed(() => repositoriesStore.currentRepository)
const hasChanges = computed(() => repositoriesStore.hasChanges)

const stagedFiles = computed(() => gitStatus.value?.staged || [])

// Map of renamed files: new path → old path
const renamedMap = computed(() => {
  const map = new Map<string, string>()
  for (const r of gitStatus.value?.renamed || []) {
    map.set(r.to, r.from)
  }
  return map
})

const unstagedEntries = computed<FileEntry[]>(() => {
  if (!gitStatus.value) return []
  const staged = new Set(stagedFiles.value)
  const entries: FileEntry[] = []
  for (const f of gitStatus.value.modified) {
    if (!staged.has(f)) entries.push({ path: f, status: 'modified' })
  }
  for (const f of gitStatus.value.added) {
    if (!staged.has(f)) entries.push({ path: f, status: 'added' })
  }
  for (const f of gitStatus.value.deleted) {
    if (!staged.has(f)) entries.push({ path: f, status: 'deleted' })
  }
  return entries
})

const unstagedFiles = computed(() => unstagedEntries.value.map((e) => e.path))

const getFileStatus = (file: string): FileStatus => {
  if (!gitStatus.value) return 'modified'
  if (renamedMap.value.has(file)) return 'renamed'
  if (gitStatus.value.added.includes(file)) return 'added'
  if (gitStatus.value.deleted.includes(file)) return 'deleted'
  if (gitStatus.value.conflicted.includes(file)) return 'conflicted'
  return 'modified'
}

const selectFile = (file: string, staged: boolean = false) => {
  selectedFile.value = file
  emit('fileSelected', file, staged, getFileStatus(file))
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

type DiscardMode = 'untracked' | 'staged-add' | 'tracked'
const discardDialogOpen = ref(false)
const pendingDiscard = ref<{ path: string; status: FileStatus; staged: boolean } | null>(null)

const requestDiscard = (path: string, status: FileStatus, staged: boolean) => {
  pendingDiscard.value = { path, status, staged }
  discardDialogOpen.value = true
}

const getDiscardMode = (status: FileStatus, staged: boolean): DiscardMode => {
  if (status === 'added') return staged ? 'staged-add' : 'untracked'
  return 'tracked'
}

const confirmDiscard = async () => {
  if (!currentRepository.value || !pendingDiscard.value) return
  const { path, status, staged } = pendingDiscard.value
  const renamedFrom = renamedMap.value.get(path)
  const targets: Array<{ path: string; mode: DiscardMode }> = [
    { path, mode: getDiscardMode(status, staged) },
  ]
  if (renamedFrom) targets.push({ path: renamedFrom, mode: 'tracked' })

  try {
    await window.api.git.discard(currentRepository.value.path, targets)
    await repositoriesStore.fetchGitStatus()
  } catch (error) {
    console.error('Failed to discard changes:', error)
  } finally {
    pendingDiscard.value = null
    discardDialogOpen.value = false
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
    // Combine summary and description with blank line separator
    const fullMessage = commitDescription.value.trim()
      ? `${commitMessage.value.trim()}\n\n${commitDescription.value.trim()}`
      : commitMessage.value.trim()

    await window.api.git.commit(currentRepository.value.path, fullMessage)
    commitMessage.value = ''
    commitDescription.value = ''
    await repositoriesStore.fetchGitStatus()
  } catch (error) {
    console.error('Failed to commit:', error)
  }
}
</script>
