<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden" v-if="currentRepository">
    <!-- Repository header -->
    <div class="flex h-[50px] shrink-0 items-center justify-between border-b px-2 pr-4">
      <div class="flex items-center gap-4">
        <!-- Owner repo switcher -->
        <Popover v-model:open="repoSwitcherOpen">
          <PopoverTrigger as-child>
            <button
              class="hover:bg-accent/60 flex items-center gap-2 rounded-lg px-2 py-1 transition-colors"
            >
              <Avatar :name="currentOwner" :image-url="ownerAvatarUrl" size="sm" />
              <h1 class="text-xl font-bold">{{ currentRepository.name }}</h1>
              <ChevronDown class="text-muted-foreground size-4 shrink-0" :stroke-width="1.5" />
            </button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent class="z-50 w-[260px] p-0" align="start" :side-offset="8">
              <div
                class="dark:bg-card border-border rounded-md border bg-white shadow-md dark:shadow-lg"
              >
                <div class="border-b px-3 py-2">
                  <p class="text-muted-foreground text-xs font-medium">
                    {{ currentOwner }} repositories
                  </p>
                </div>
                <div class="max-h-[300px] overflow-y-auto" v-lenis>
                  <button
                    v-for="repo in ownerRepositories"
                    :key="repo.id"
                    @click="switchRepository(repo)"
                    :class="[
                      'hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      repo.id === currentRepository.id ? 'bg-accent' : '',
                    ]"
                  >
                    <GitBranch class="text-muted-foreground size-3.5 shrink-0" :stroke-width="1" />
                    <span class="flex-1 truncate">{{ repo.name }}</span>
                    <Check
                      v-if="repo.id === currentRepository.id"
                      class="text-primary size-3.5 shrink-0"
                      :stroke-width="2"
                    />
                  </button>
                  <div
                    v-if="ownerRepositories.length === 0"
                    class="text-muted-foreground px-3 py-4 text-center text-xs"
                  >
                    No other repositories
                  </div>
                </div>
              </div>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
        <div class="bg-border h-6 w-px" />
        <BranchSelector />
      </div>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="fetchChanges">
          <RefreshCw class="mr-2 h-4 w-4" :stroke-width="1" />
          Fetch
        </Button>
        <Button variant="ghost" size="sm" @click="pullChanges" :disabled="!gitStatus?.behind">
          <Download class="mr-2 h-4 w-4" :stroke-width="1" />
          Pull {{ gitStatus?.behind ? `(${gitStatus.behind})` : '' }}
        </Button>
        <Button variant="default" size="sm" @click="pushChanges" :disabled="!gitStatus?.ahead">
          <Upload class="mr-2 h-4 w-4" :stroke-width="1" />
          Push {{ gitStatus?.ahead ? `(${gitStatus.ahead})` : '' }}
        </Button>
      </div>
    </div>

    <!-- Repository tabs -->
    <Tabs v-model="activeTab" class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="shrink-0 border-b pr-6 pl-3">
        <TabsList class="h-9 rounded-none bg-transparent p-0">
          <TabsTrigger
            value="history"
            class="data-[state=active]:border-primary gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <History class="size-4" :stroke-width="1.5" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="changes"
            class="data-[state=active]:border-primary gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <FileDiff class="size-4" :stroke-width="1.5" />
            Changes
            <span
              class="bg-primary text-primary-foreground ml-0.5 flex h-[18px] min-w-[18px] origin-center items-center justify-center rounded-full px-1 text-[10px] font-semibold transition-all duration-300"
              v-if="changeCount > 0"
            >
              <NumberFlow
                :value="changeCount"
                :animated="true"
                :transformTiming="{ duration: 400, easing: 'ease-out' }"
                :spinTiming="{ duration: 400, easing: 'ease-out' }"
              />
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            class="data-[state=active]:border-primary gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <CalendarDays class="size-4" :stroke-width="1.5" />
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            class="data-[state=active]:border-primary gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <BarChart2 class="size-4" :stroke-width="1.5" />
            Stats
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            class="data-[state=active]:border-primary gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Settings class="size-4" :stroke-width="1.5" />
            Settings
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- History tab content -->
      <TabsContent value="history" class="mt-0 min-h-0 flex-1 overflow-hidden">
        <RepositoryHistory />
      </TabsContent>

      <!-- Changes tab content -->
      <TabsContent value="changes" class="mt-0 min-h-0 flex-1 overflow-hidden">
        <SplitterGroup
          :direction="changesLayout"
          :auto-save-id="`changes-splitter-${changesLayout}`"
          :key="changesLayout"
          class="h-full"
        >
          <!-- Changes panel -->
          <SplitterPanel
            :default-size="changesLayout === 'horizontal' ? 30 : 40"
            :min-size="20"
            :max-size="50"
            class="flex flex-col overflow-hidden"
            :collapsible="false"
          >
            <div class="flex shrink-0 items-center justify-between border-b px-4 py-3">
              <h2 class="font-semibold">Changes</h2>
              <div class="bg-muted/50 flex items-center rounded-md border p-0.5">
                <button
                  @click="changesLayout = 'horizontal'"
                  class="rounded-sm p-1 transition-colors"
                  :class="
                    changesLayout === 'horizontal'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  "
                  title="Side by side"
                >
                  <Columns2 class="size-3.5" :stroke-width="1.5" />
                </button>
                <button
                  @click="changesLayout = 'vertical'"
                  class="rounded-sm p-1 transition-colors"
                  :class="
                    changesLayout === 'vertical'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  "
                  title="Top and bottom"
                >
                  <Rows2 class="size-3.5" :stroke-width="1.5" />
                </button>
              </div>
            </div>
            <ChangesPanel @file-selected="onChangeFileSelected" />
          </SplitterPanel>

          <SplitterResizeHandle
            class="group flex items-center justify-center"
            :class="changesLayout === 'horizontal' ? 'border-x' : 'border-y'"
          >
            <div
              class="bg-border group-hover:bg-muted-foreground/50 rounded-full transition-colors"
              :class="changesLayout === 'horizontal' ? 'h-8 w-px' : 'h-px w-8'"
            />
          </SplitterResizeHandle>

          <!-- Diff viewer -->
          <SplitterPanel
            :default-size="changesLayout === 'horizontal' ? 70 : 60"
            :min-size="30"
            class="flex flex-col"
          >
            <div class="flex items-center gap-2 border-b px-4 py-3">
              <h2 class="flex-1 truncate font-semibold">
                {{ changesSelectedFile || 'Diff' }}
              </h2>
              <span
                v-if="changesSelectedFile && changesIsStaged"
                class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              >
                STAGED
              </span>
              <button
                @click="isDiffFullWindow = true"
                class="text-muted-foreground hover:text-foreground hover:bg-accent rounded p-1 transition-colors"
                title="Full window"
              >
                <Maximize2 class="size-3.5" :stroke-width="1.5" />
              </button>
            </div>
            <DiffViewer
              :selected-file="changesSelectedFile"
              :is-staged="changesIsStaged"
              :file-status="changesFileStatus"
            />
          </SplitterPanel>
        </SplitterGroup>
      </TabsContent>

      <!-- Activity tab content -->
      <TabsContent value="activity" class="mt-0 min-h-0 flex-1 overflow-hidden">
        <ActivityCalendar />
      </TabsContent>

      <!-- Stats tab content — lazy-rendered so charts get correct dimensions -->
      <TabsContent value="stats" class="mt-0 min-h-0 flex-1 overflow-hidden">
        <RepositoryStats v-if="activeTab === 'stats'" />
      </TabsContent>

      <!-- Settings tab content -->
      <TabsContent value="settings" class="mt-0 min-h-0 flex-1 overflow-hidden py-2 pr-2">
        <RepositorySettings />
      </TabsContent>
    </Tabs>

    <!-- Full window diff overlay -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isDiffFullWindow"
          class="bg-card fixed inset-2 z-50 flex flex-col rounded-xl border shadow-2xl"
        >
          <div class="flex items-center gap-2 border-b px-4 py-3">
            <h2 class="flex-1 truncate font-semibold">
              {{ changesSelectedFile || 'Diff' }}
            </h2>
            <span
              v-if="changesSelectedFile && changesIsStaged"
              class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            >
              STAGED
            </span>
            <button
              @click="isDiffFullWindow = false"
              class="text-muted-foreground hover:text-foreground hover:bg-accent rounded p-1 transition-colors"
              title="Exit full window"
            >
              <Minimize2 class="size-3.5" :stroke-width="1.5" />
            </button>
          </div>
          <DiffViewer
            :selected-file="changesSelectedFile"
            :is-staged="changesIsStaged"
            :file-status="changesFileStatus"
          />
        </div>
      </Transition>
    </Teleport>
  </div>

  <!-- No repository selected -->
  <div v-else class="flex flex-1 flex-col">
    <!-- Header -->
    <div class="flex h-[50px] items-center border-b px-6">
      <h1 class="text-lg font-semibold">Welcome to GitHub Desktop Plus</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-6" v-lenis>
      <div class="mx-auto max-w-4xl">
        <!-- Quick Actions -->
        <div class="mb-8">
          <h2 class="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div class="grid grid-cols-3 gap-4">
            <button
              @click="createRepository"
              class="bg-card-translucent/50 hover:bg-accent/50 rounded-lg border p-6 text-center transition-colors"
            >
              <FilePlus class="text-primary mx-auto mb-2 h-8 w-8" :stroke-width="1" />
              <h3 class="mb-1 font-medium">Create Repository</h3>
              <p class="text-muted-foreground text-sm">Start a new project</p>
            </button>

            <button
              @click="cloneRepository"
              class="bg-card-translucent/50 hover:bg-accent/50 rounded-lg border p-6 text-center transition-colors"
            >
              <GitBranch class="text-primary mx-auto mb-2 h-8 w-8" :stroke-width="1" />
              <h3 class="mb-1 font-medium">Clone Repository</h3>
              <p class="text-muted-foreground text-sm">Clone from a URL</p>
            </button>

            <button
              @click="openRepository"
              class="bg-card-translucent/50 hover:bg-accent/50 rounded-lg border p-6 text-center transition-colors"
            >
              <FolderOpen class="text-primary mx-auto mb-2 h-8 w-8" :stroke-width="1" />
              <h3 class="mb-1 font-medium">Open Repository</h3>
              <p class="text-muted-foreground text-sm">Add a local repository</p>
            </button>
          </div>
        </div>

        <!-- Favorites -->
        <div v-if="favoriteRepositories.length > 0" class="mb-8">
          <h2 class="mb-4 text-lg font-semibold">Favorite Repositories</h2>
          <div class="grid gap-3">
            <button
              v-for="repo in favoriteRepositories"
              :key="repo.id"
              @click="selectRepository(repo)"
              class="bg-card-translucent/50 hover:bg-accent/50 group rounded-lg border p-4 text-left transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="min-w-0 flex-1">
                  <div class="mb-1 flex items-center gap-2">
                    <Star class="h-4 w-4 fill-yellow-500 text-yellow-500" :stroke-width="1" />
                    <span class="font-medium">{{ repo.name }}</span>
                  </div>
                  <p class="text-muted-foreground truncate text-sm">
                    {{ repo.path }}
                  </p>
                </div>
                <ChevronRight
                  class="text-muted-foreground h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                  :stroke-width="1"
                />
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
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { perf } from '@/shared/perf'
import { useToast } from '@/composables/useToast'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import {
  GitBranch,
  Star,
  RefreshCw,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  Check,
  FilePlus,
  FolderOpen,
  FileDiff,
  BarChart2,
  CalendarDays,
  Settings,
  History,
  Columns2,
  Rows2,
  Maximize2,
  Minimize2,
} from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverPortal, PopoverTrigger } from '../components/ui/Popover'
import { useRepositoriesStore } from '@/shared/stores'
import type { RepositoryInfo } from '@/shared/types/git.types'
import Avatar from '../components/ui/Avatar.vue'
import Button from '../components/ui/Button.vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import BranchSelector from '../components/repository/BranchSelector.vue'
import ChangesPanel from '../components/repository/ChangesPanel.vue'
import DiffViewer from '../components/repository/DiffViewer.vue'
import RepositorySettings from '../components/repository/RepositorySettings.vue'
import RepositoryStats from '../components/repository/RepositoryStats.vue'
import RepositoryHistory from '../components/repository/RepositoryHistory.vue'
import ActivityCalendar from '../components/repository/ActivityCalendar.vue'
import CloneDialog from '../components/dialogs/CloneDialog.vue'
import OpenRepositoryDialog from '../components/dialogs/OpenRepositoryDialog.vue'
import CreateRepositoryDialog from '../components/dialogs/CreateRepositoryDialog.vue'
import NumberFlow from '@number-flow/vue'

const repositoriesStore = useRepositoriesStore()
const { toast } = useToast()

function parseGitError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  // Strip nested "Failed to pull: Error: " prefixes
  const inner = msg.replace(/^.*?Failed to \w+:\s*Error:\s*/i, '')
  // Remove stack traces (lines starting with "at ")
  const lines = inner.split('\n').filter((l) => !l.trim().startsWith('at '))
  return lines.join('\n').trim() || msg
}

const cloneDialog = ref<InstanceType<typeof CloneDialog>>()
const openRepoDialog = ref<InstanceType<typeof OpenRepositoryDialog>>()
const createRepoDialog = ref<InstanceType<typeof CreateRepositoryDialog>>()

const ACTIVE_TAB_KEY = 'repository-active-tab'
const activeTab = ref(localStorage.getItem(ACTIVE_TAB_KEY) || 'history')
watch(activeTab, (tab) => localStorage.setItem(ACTIVE_TAB_KEY, tab))
const repoSwitcherOpen = ref(false)

// Changes tab layout and file selection
const CHANGES_LAYOUT_KEY = 'changes-layout'
const changesLayout = ref<'horizontal' | 'vertical'>(
  (localStorage.getItem(CHANGES_LAYOUT_KEY) as 'horizontal' | 'vertical') || 'horizontal',
)
watch(changesLayout, (v) => localStorage.setItem(CHANGES_LAYOUT_KEY, v))

const changesSelectedFile = ref<string | null>(null)
const changesIsStaged = ref(false)
const changesFileStatus = ref<'modified' | 'added' | 'deleted' | 'renamed' | 'conflicted'>(
  'modified',
)
const isDiffFullWindow = ref(false)

function handleDiffFullWindowKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isDiffFullWindow.value = false
  }
}

watch(isDiffFullWindow, (active) => {
  if (active) {
    document.addEventListener('keydown', handleDiffFullWindowKeydown)
  } else {
    document.removeEventListener('keydown', handleDiffFullWindowKeydown)
  }
})

const onChangeFileSelected = (
  file: string,
  staged: boolean,
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'conflicted' = 'modified',
) => {
  changesSelectedFile.value = file
  changesIsStaged.value = staged
  changesFileStatus.value = status
}

const currentRepository = computed(() => repositoriesStore.currentRepository)

function getOwner(remoteUrl?: string): string {
  if (!remoteUrl) return 'Local'
  const httpsMatch = remoteUrl.match(/https?:\/\/[^/]+\/([^/]+)\//)
  if (httpsMatch) return httpsMatch[1]
  const sshMatch = remoteUrl.match(/git@[^:]+:([^/]+)\//)
  if (sshMatch) return sshMatch[1]
  return 'Local'
}

const currentOwner = computed(() => getOwner(currentRepository.value?.remoteUrl))

const ownerRepositories = computed(() =>
  repositoriesStore.repositories
    .filter((repo) => getOwner(repo.remoteUrl) === currentOwner.value)
    .sort((a, b) => a.name.localeCompare(b.name)),
)

const ownerAvatarUrl = ref<string | null>(null)

async function fetchOwnerAvatar(owner: string) {
  if (owner === 'Local') {
    ownerAvatarUrl.value = null
    return
  }
  try {
    const result = await window.api.avatar.getOwner(owner)
    if (result.success && result.data) {
      ownerAvatarUrl.value = result.data
    }
  } catch {
    ownerAvatarUrl.value = null
  }
}

watch(
  currentOwner,
  (owner) => {
    ownerAvatarUrl.value = null
    fetchOwnerAvatar(owner)
  },
  { immediate: true },
)

function switchRepository(repo: RepositoryInfo) {
  repoSwitcherOpen.value = false
  if (repo.id !== currentRepository.value?.id) {
    repositoriesStore.setCurrentRepository(repo)
  }
}

// Rescan changes when window regains focus and changes tab is active
const handleWindowFocus = () => {
  if (activeTab.value === 'changes' && currentRepository.value) {
    repositoriesStore.fetchGitStatus()
  }
}

onMounted(() => {
  perf.mark('repository-view:mounted')
  window.addEventListener('focus', handleWindowFocus)
})

// Git status is loaded by setCurrentRepository — no duplicate call needed here

onUnmounted(() => {
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('keydown', handleDiffFullWindowKeydown)
})
const gitStatus = computed(() => repositoriesStore.gitStatus)
const changeCount = computed(() => {
  const s = gitStatus.value
  if (!s) return 0
  return (
    s.modified.length + s.added.length + s.deleted.length + s.renamed.length + s.conflicted.length
  )
})
const favoriteRepositories = computed(() => repositoriesStore.favoriteRepositories)

const toggleFavorite = () => {
  if (currentRepository.value) {
    repositoriesStore.toggleFavorite(currentRepository.value.id)
  }
}

const fetchChanges = async () => {
  if (currentRepository.value) {
    return perf.measure('repo-view:fetch', async () => {
      try {
        await window.api.git.fetch(currentRepository.value!.path)
        await repositoriesStore.fetchGitStatus()
      } catch (error) {
        console.error('Failed to fetch:', error)
        toast({
          title: 'Fetch failed',
          description: parseGitError(error),
          variant: 'destructive',
          duration: 5000,
        })
      }
    })
  }
}

const pullChanges = async () => {
  if (currentRepository.value) {
    return perf.measure('repo-view:pull', async () => {
      try {
        await window.api.git.pull(currentRepository.value!.path)
        await repositoriesStore.fetchGitStatus()
      } catch (error) {
        console.error('Failed to pull:', error)
        toast({
          title: 'Pull failed',
          description: parseGitError(error),
          variant: 'destructive',
          duration: 5000,
        })
      }
    })
  }
}

const pushChanges = async () => {
  if (currentRepository.value) {
    return perf.measure('repo-view:push', async () => {
      try {
        await window.api.git.push(currentRepository.value!.path)
        await repositoriesStore.fetchGitStatus()
      } catch (error) {
        console.error('Failed to push:', error)
        toast({
          title: 'Push failed',
          description: parseGitError(error),
          variant: 'destructive',
          duration: 5000,
        })
      }
    })
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

const handleRepositoryAction = () => {
  // Repository is already added and set as current by the dialog
  // The view will automatically update via computed properties
}
</script>
