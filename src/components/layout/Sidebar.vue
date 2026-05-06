<template>
  <aside class="relative flex h-full w-full flex-col overflow-hidden">
    <!-- User dropdown button -->
    <div class="app-no-drag relative z-40 px-3 pt-2 pb-2">
      <Popover v-model:open="userDropdownOpen">
        <PopoverTrigger as-child>
          <button
            class="hover:bg-accent/60 mx-auto mt-2 flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors"
            title="Switch user"
          >
            <div
              v-if="!activeAccount"
              class="bg-foreground/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
            >
              <User class="text-foreground h-4 w-4" :stroke-width="1.5" />
            </div>
            <Avatar v-else :name="activeAccount.name" size="lg" class="flex-shrink-0 !rounded-lg" />
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold">
                {{ activeAccount?.name || 'User' }}
              </div>
              <div class="text-muted-foreground truncate text-xs">
                {{ activeAccount?.email || 'Not signed in' }}
              </div>
            </div>
            <ChevronsUpDown
              class="text-muted-foreground h-4 w-4 flex-shrink-0"
              :stroke-width="1.5"
            />
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            side="bottom"
            align="start"
            :side-offset="4"
            class="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 z-50 w-[240px] rounded-lg border p-1 shadow-md outline-none"
          >
            <!-- Existing accounts -->
            <div v-if="accounts.length > 0" class="pb-1">
              <div class="text-muted-foreground px-2 py-1.5 text-xs font-medium">Accounts</div>
              <button
                v-for="account in accounts"
                :key="account.id"
                @click="switchAccount(account.id)"
                class="hover:bg-accent flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
              >
                <Avatar :name="account.name" size="sm" class="flex-shrink-0 !rounded-md" />
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium">
                    {{ account.name }}
                  </div>
                  <div class="text-muted-foreground truncate text-xs">
                    {{ account.email }}
                  </div>
                </div>
                <Check
                  v-if="account.id === activeAccountId"
                  class="text-primary h-3.5 w-3.5 flex-shrink-0"
                  :stroke-width="2"
                />
              </button>
            </div>

            <!-- Separator -->
            <div v-if="accounts.length > 0" class="bg-border my-1 h-px" />

            <!-- Add account form -->
            <div v-if="showAddForm" class="space-y-2 p-2">
              <div class="text-muted-foreground text-xs font-medium">New account</div>
              <input
                v-model="newAccountName"
                type="text"
                placeholder="Name"
                class="bg-accent/50 focus:ring-ring placeholder:text-muted-foreground w-full rounded-md px-2.5 py-1.5 text-sm outline-none focus:ring-1"
                @keydown.enter="submitAddAccount"
              />
              <input
                v-model="newAccountEmail"
                type="email"
                placeholder="Email"
                class="bg-accent/50 focus:ring-ring placeholder:text-muted-foreground w-full rounded-md px-2.5 py-1.5 text-sm outline-none focus:ring-1"
                @keydown.enter="submitAddAccount"
              />
              <div class="flex gap-1.5">
                <button
                  @click="showAddForm = false"
                  class="hover:bg-accent flex-1 rounded-md px-2 py-1.5 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  @click="submitAddAccount"
                  :disabled="!newAccountName.trim() || !newAccountEmail.trim()"
                  class="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-md px-2 py-1.5 text-xs transition-colors disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="!showAddForm">
              <button
                @click="showAddForm = true"
                class="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              >
                <Plus class="h-3.5 w-3.5" :stroke-width="1.5" />
                <span>Add account</span>
              </button>
              <button
                v-if="activeAccount"
                @click="removeCurrentAccount"
                class="hover:bg-destructive/10 text-destructive flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              >
                <LogOut class="h-3.5 w-3.5" :stroke-width="1.5" />
                <span>Remove account</span>
              </button>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </div>

    <!-- Search -->
    <div class="px-3 py-2">
      <div class="relative">
        <Search
          class="text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2"
          :stroke-width="1.5"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search"
          class="bg-accent/50 focus:ring-ring placeholder:text-muted-foreground w-full rounded-lg py-1.5 pr-8 pl-7 text-sm outline-none focus:ring-1"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
        >
          <X class="h-3.5 w-3.5" :stroke-width="1.5" />
        </button>
        <kbd
          v-else
          class="text-muted-foreground bg-background/80 absolute top-1/2 right-2 -translate-y-1/2 rounded border px-1 py-0.5 font-mono text-[10px]"
          >/</kbd
        >
      </div>
    </div>

    <!-- Repository section -->
    <div class="flex-1 overflow-y-auto" v-lenis>
      <div class="px-2 py-4">
        <div class="mb-2 flex items-center justify-between pl-2">
          <h3 class="text-sm font-medium">Repositories</h3>
          <div class="flex items-center">
            <button
              @click="collapseAllGroups"
              class="hover:bg-accent rounded p-1 transition-colors"
              title="Collapse all groups"
            >
              <ChevronsDownUp class="h-4 w-4" :stroke-width="1" />
            </button>
            <button
              @click="openAddRepository"
              class="hover:bg-accent rounded p-1 transition-colors"
              title="Add repository"
            >
              <Plus class="h-4 w-4" :stroke-width="1" />
            </button>
          </div>
        </div>

        <!-- No results -->
        <div
          v-if="filteredRepositoriesByOwner.length === 0 && searchQuery"
          class="text-muted-foreground px-2 py-6 text-center text-sm"
        >
          No results for "{{ searchQuery }}"
        </div>

        <!-- Repository list grouped by owner -->
        <div class="space-y-2">
          <div v-for="group in filteredRepositoriesByOwner" :key="group.owner">
            <!-- Owner header -->
            <OwnerContextMenu :owner="group.owner" :repos="group.repos">
              <button
                @click="toggleGroup(group.owner)"
                class="text-muted-foreground hover:text-foreground mb-2 flex w-full items-center gap-2 px-2 py-1 text-xs font-medium transition-colors"
              >
                <ChevronDown
                  v-if="!isGroupCollapsed(group.owner) || searchQuery"
                  class="h-3 w-3 flex-shrink-0"
                  :stroke-width="1.5"
                />
                <ChevronRight v-else class="h-3 w-3 flex-shrink-0" :stroke-width="1.5" />
                <Avatar
                  :name="group.owner"
                  :image-url="ownerAvatars[group.owner.toLowerCase()]"
                  size="xs"
                />
                <span class="truncate">{{ group.owner }}</span>
                <span class="ml-auto text-[10px] opacity-60">{{ group.repos.length }}</span>
              </button>
            </OwnerContextMenu>

            <!-- Repositories in group -->
            <div v-if="!isGroupCollapsed(group.owner) || searchQuery" class="ml-6 space-y-0.5">
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
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-200 ease-in-out',
                    currentRepository?.id === repo.id
                      ? 'bg-card-translucent/50 hover:bg-card-translucent/80 text-accent-foreground'
                      : 'hover:bg-card-translucent/70',
                  ]"
                  :title="repo.name"
                >
                  <Folder class="h-4 w-4 shrink-0" :stroke-width="1" />
                  <div class="min-w-0 flex-1 truncate text-sm font-medium">
                    {{ repo.name }}
                  </div>
                  <Star
                    v-if="repo.isFavorite"
                    class="h-3 w-3 shrink-0 text-yellow-500"
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
    <div class="space-y-1 p-2">
      <SidebarButton :icon="Settings" label="Settings" @click="openSettings" />
    </div>

    <!-- Add / Create / Clone Dialog -->
    <AddRepositoryDialog
      ref="addRepoDialog"
      @clone-complete="handleCloneComplete"
      @repository-opened="handleRepositoryOpened"
      @repository-created="handleRepositoryCreated"
    />

    <!-- App Settings Dialog -->
    <AppSettingsDialog ref="appSettingsDialog" />
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { perf } from '@/shared/perf'
import { useRouter } from 'vue-router'
import {
  User,
  Plus,
  Folder,
  Star,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ChevronsDownUp,
  Check,
  LogOut,
  Search,
  X,
} from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent, PopoverPortal } from '../ui/Popover'
import { useRepositoriesStore } from '@/shared/stores'
import { useAccountsStore } from '@/stores/accounts.store'
import SidebarButton from '../ui/SidebarButton.vue'
import AddRepositoryDialog from '../dialogs/AddRepositoryDialog.vue'
import AppSettingsDialog from '../dialogs/AppSettingsDialog.vue'
import RepositoryContextMenu from '../RepositoryContextMenu.vue'
import OwnerContextMenu from '../OwnerContextMenu.vue'
import Avatar from '../ui/Avatar.vue'

const router = useRouter()
const repositoriesStore = useRepositoriesStore()
const accountsStore = useAccountsStore()

// Accounts
const accounts = computed(() => accountsStore.accounts)
const activeAccount = computed(() => accountsStore.activeAccount)
const activeAccountId = computed(() => accountsStore.activeAccountId)
const userDropdownOpen = ref(false)
const showAddForm = ref(false)
const newAccountName = ref('')
const newAccountEmail = ref('')

function switchAccount(id: string) {
  accountsStore.setActive(id)
  userDropdownOpen.value = false
}

function submitAddAccount() {
  const name = newAccountName.value.trim()
  const email = newAccountEmail.value.trim()
  if (!name || !email) return
  accountsStore.addAccount(name, email)
  newAccountName.value = ''
  newAccountEmail.value = ''
  showAddForm.value = false
}

function removeCurrentAccount() {
  if (activeAccount.value) {
    accountsStore.removeAccount(activeAccount.value.id)
  }
  userDropdownOpen.value = false
}

watch(userDropdownOpen, (open) => {
  if (!open) {
    showAddForm.value = false
    newAccountName.value = ''
    newAccountEmail.value = ''
  }
})

const addRepoDialog = ref<InstanceType<typeof AddRepositoryDialog>>()
const appSettingsDialog = ref<InstanceType<typeof AppSettingsDialog>>()

const repositories = computed(() => repositoriesStore.repositories)
const currentRepository = computed(() => repositoriesStore.currentRepository)

watch(currentRepository, (repo) => {
  if (!repo) return
  const owner = getOwner(repo.remoteUrl)
  if (collapsedGroups.value.has(owner)) {
    collapsedGroups.value.delete(owner)
    saveCollapsedGroups()
  }
})

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
      }),
    })
  }

  return sortedGroups.sort((a, b) => a.owner.localeCompare(b.owner))
})

const searchQuery = ref('')

const filteredRepositoriesByOwner = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return repositoriesByOwner.value

  return repositoriesByOwner.value
    .map((group) => {
      const ownerMatches = group.owner.toLowerCase().includes(q)
      const filteredRepos = ownerMatches
        ? group.repos
        : group.repos.filter((repo) => repo.name.toLowerCase().includes(q))
      return { ...group, repos: filteredRepos }
    })
    .filter((group) => group.repos.length > 0)
})

// Owner avatar cache: lowercase owner -> avatar URL
const ownerAvatars = ref<Record<string, string | null>>({})

async function fetchOwnerAvatars(owners: string[]) {
  const toFetch = owners.filter((o) => o !== 'Local' && !(o.toLowerCase() in ownerAvatars.value))
  if (toFetch.length === 0) return

  return perf.measure(`sidebar:fetch-avatars(${toFetch.length})`, async () => {
    try {
      const result = await window.api.avatar.getOwners(toFetch)
      if (result.success && result.data) {
        ownerAvatars.value = { ...ownerAvatars.value, ...result.data }
      }
    } catch (error) {
      console.error('Failed to fetch owner avatars:', error)
    }
  })
}

// Fetch avatars when repo list changes (instant from disk cache)
watch(repositoriesByOwner, (groups) => {
  perf.mark('sidebar:avatar-fetch-triggered')
  fetchOwnerAvatars(groups.map((g) => g.owner)).then(() => {
    perf.mark('sidebar:avatars-rendered')
  })
})

// Track collapsed state for each owner group
// Start hidden until DB state is restored to avoid expand-then-collapse flicker
const collapsedGroups = ref<Set<string>>(new Set())
const collapsedStateLoaded = ref(false)
const COLLAPSED_GROUPS_KEY = 'sidebar_collapsed_groups'

const isGroupCollapsed = (owner: string) => {
  if (!collapsedStateLoaded.value) return true
  return collapsedGroups.value.has(owner)
}

function applyPreloadedData(data: any) {
  // Apply avatars FIRST — before repos, so the repositoriesByOwner watcher
  // sees cached avatars and skips the IPC fetch
  if (data.ownerAvatars) {
    ownerAvatars.value = { ...ownerAvatars.value, ...data.ownerAvatars }
  }
  if (data.accounts) {
    try {
      accountsStore.accounts = JSON.parse(data.accounts)
    } catch {}
  }
  if (data.activeAccountId) {
    accountsStore.activeAccountId = data.activeAccountId
  }
  if (data.collapsedGroups) {
    try {
      collapsedGroups.value = new Set(JSON.parse(data.collapsedGroups))
    } catch {}
  }
  // Apply repos LAST — triggers repositoriesByOwner watcher, which will see avatars already cached
  if (data.repos) {
    repositoriesStore.repositories = data.repos.map((r: any) => ({
      ...r,
      lastOpenedAt: new Date(r.lastOpenedAt),
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    }))
  }
  collapsedStateLoaded.value = true
}

onMounted(() => {
  perf.mark('sidebar:mounted')

  // Check if main process already pushed data (available via preload script global)
  const preloaded = (window as any).__preloadedSidebarData?.get?.()
  if (preloaded) {
    perf.mark('sidebar:using-preloaded-data')
    applyPreloadedData(preloaded)
    return
  }

  // Fallback: listen for push or load via IPC
  window.api.onPreloadedSidebarData((data: any) => {
    perf.mark('sidebar:preloaded-data-received')
    applyPreloadedData(data)
  })

  const endInit = perf.start('sidebar:init-data-fallback')
  Promise.all([
    accountsStore.load(),
    repositoriesStore.loadRepositories(),
    window.api.settings.get(COLLAPSED_GROUPS_KEY).then((result) => {
      if (result.success && result.data) {
        collapsedGroups.value = new Set(JSON.parse(result.data))
      }
    }),
  ])
    .catch((error) => console.error('Failed to initialize sidebar:', error))
    .finally(() => {
      collapsedStateLoaded.value = true
      endInit()
    })
})

const saveCollapsedGroups = () => {
  const serialized = JSON.stringify([...collapsedGroups.value])
  window.api.settings.set(COLLAPSED_GROUPS_KEY, serialized).catch(console.error)
}

const toggleGroup = (owner: string) => {
  if (collapsedGroups.value.has(owner)) {
    collapsedGroups.value.delete(owner)
  } else {
    collapsedGroups.value.add(owner)
  }
  saveCollapsedGroups()
}

const collapseAllGroups = () => {
  const allOwners = repositoriesByOwner.value.map((g) => g.owner)
  const allCollapsed = allOwners.every((o) => collapsedGroups.value.has(o))
  if (allCollapsed) {
    collapsedGroups.value.clear()
  } else {
    collapsedGroups.value = new Set(allOwners)
  }
  saveCollapsedGroups()
}

const openAddRepository = () => {
  addRepoDialog.value?.open()
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

<style scoped>
.app-no-drag {
  -webkit-app-region: no-drag;
}
</style>
