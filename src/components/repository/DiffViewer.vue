<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <!-- Diff stats bar -->
    <div
      v-if="diff && !isLoading"
      class="text-muted-foreground flex shrink-0 items-center gap-3 border-b px-4 py-2 text-xs"
    >
      <span v-if="diffStats.additions > 0" class="font-medium text-green-600 dark:text-green-400">
        +{{ diffStats.additions }}
      </span>
      <span v-if="diffStats.deletions > 0" class="font-medium text-red-600 dark:text-red-400">
        -{{ diffStats.deletions }}
      </span>
      <span
        v-if="diffStats.additions > 0 || diffStats.deletions > 0"
        class="text-muted-foreground/60"
      >
        {{ diffStats.additions + diffStats.deletions }} changed lines
      </span>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex h-full items-center justify-center">
      <span class="text-muted-foreground text-xs">Loading diff...</span>
    </div>

    <!-- Diff content -->
    <div v-else-if="diff" class="min-h-0 flex-1 overflow-auto" v-lenis>
      <NxDiffViewer
        :diff="diff"
        :theme="codeViewerTheme"
        :language="fileLanguage"
        :show-header="true"
        :old-file-name="selectedFile ?? undefined"
        :new-file-name="selectedFile ?? undefined"
        :file-extension="fileExtension"
        border-style="none"
      />
    </div>

    <!-- Empty diff (file selected but no diff content) -->
    <div v-else-if="selectedFile && !isLoading" class="flex h-full items-center justify-center">
      <div class="text-center">
        <FileCheck class="text-muted-foreground mx-auto mb-3 h-8 w-8" :stroke-width="1" />
        <p class="text-muted-foreground text-sm">No changes to display</p>
      </div>
    </div>

    <!-- Empty state (no file selected) -->
    <div v-else class="flex h-full items-center justify-center">
      <div class="text-center">
        <FileDiff class="text-muted-foreground mx-auto mb-3 h-8 w-8" :stroke-width="1" />
        <p class="text-muted-foreground text-sm">Select a file to view changes</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { FileDiff, FileCheck } from 'lucide-vue-next'
import { DiffViewer as NxDiffViewer } from '@ngeenx/nx-vue-code-viewer'
import { useCodeViewerTheme } from '@/composables/useCodeViewerTheme'
import { useRepositoriesStore } from '@/shared/stores'
import type { FileStatus } from './ChangesPanel.vue'

const props = defineProps<{
  selectedFile?: string | null
  isStaged?: boolean
  fileStatus?: FileStatus
}>()

const { codeViewerTheme } = useCodeViewerTheme()
const repositoriesStore = useRepositoriesStore()

const diff = ref<string>('')
const isLoading = ref(false)

const fileExtension = computed(() => {
  if (!props.selectedFile) return undefined
  const parts = props.selectedFile.split('.')
  return parts.length > 1 ? parts.pop() : undefined
})

const fileLanguage = computed(() => {
  const ext = fileExtension.value
  if (!ext) return 'plaintext'
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    vue: 'vue',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    rb: 'ruby',
    sh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    toml: 'toml',
    xml: 'xml',
    sql: 'sql',
    swift: 'swift',
    kt: 'kotlin',
    dart: 'dart',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
  }
  return map[ext] || 'plaintext'
})

const diffStats = computed(() => {
  let additions = 0
  let deletions = 0
  if (!diff.value) return { additions, deletions }

  const lines = diff.value.split('\n')
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++
  }
  return { additions, deletions }
})

const currentRepository = computed(() => repositoriesStore.currentRepository)

async function loadDiff(
  file: string | null | undefined,
  staged: boolean | undefined,
  status: FileStatus | undefined,
) {
  diff.value = ''
  if (!file || !currentRepository.value) return

  isLoading.value = true
  try {
    let result
    if (staged) {
      result = await window.api.git.diffStaged(currentRepository.value.path, file)
    } else if (status === 'deleted') {
      result = await window.api.git.diffDeleted(currentRepository.value.path, file)
    } else {
      result = await window.api.git.diffFile(currentRepository.value.path, file)
    }

    if (result.success && result.data) {
      diff.value = result.data
    }
  } catch (error) {
    console.error('Failed to load diff:', error)
  } finally {
    isLoading.value = false
  }
}

// Watch all relevant props together so switching staged/unstaged for same file works
watch(
  () => [props.selectedFile, props.isStaged, props.fileStatus] as const,
  ([file, staged, status]) => {
    loadDiff(file, staged, status)
  },
)

// Re-load diff when git status changes (e.g. after stage/unstage)
watch(
  () => repositoriesStore.gitStatus,
  () => {
    if (props.selectedFile) {
      loadDiff(props.selectedFile, props.isStaged, props.fileStatus)
    }
  },
)
</script>
