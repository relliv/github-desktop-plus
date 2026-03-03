<template>
  <aside
    class="relative bg-card border-r flex flex-col h-full w-full overflow-hidden"
  >
    <!-- User section -->
    <div class="h-[50px] px-4 border-b flex items-center">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0"
        >
          <User class="w-4 h-4 text-primary-foreground" :stroke-width="1" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">User</div>
          <div class="text-xs text-muted-foreground truncate">
            Not signed in
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="px-3 py-2 border-b">
      <div class="relative">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" :stroke-width="1.5" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="w-full bg-accent/50 text-sm pl-7 pr-7 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X class="w-3.5 h-3.5" :stroke-width="1.5" />
        </button>
      </div>
    </div>

    <!-- Repository section -->
    <div class="flex-1 overflow-y-auto">
      <div class="px-2 py-4">
        <div class="flex items-center justify-between pl-2 mb-2">
          <h3 class="font-medium text-sm">Repositories</h3>
          <button
            @click="openAddRepository"
            class="p-1 hover:bg-accent rounded transition-colors"
            title="Add repository"
          >
            <Plus class="w-4 h-4" :stroke-width="1" />
          </button>
        </div>

        <!-- No results -->
        <div v-if="filteredRepositoriesByOwner.length === 0 && searchQuery" class="px-2 py-6 text-center text-sm text-muted-foreground">
          No results for "{{ searchQuery }}"
        </div>

        <!-- Repository list grouped by owner -->
        <div class="space-y-2">
          <div v-for="group in filteredRepositoriesByOwner" :key="group.owner">
            <!-- Owner header -->
            <OwnerContextMenu :owner="group.owner" :repos="group.repos">
              <button
                @click="toggleGroup(group.owner)"
                class="w-full flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronDown
                  v-if="!collapsedGroups.has(group.owner) || searchQuery"
                  class="w-3 h-3 flex-shrink-0"
                  :stroke-width="1.5"
                />
                <ChevronRight
                  v-else
                  class="w-3 h-3 flex-shrink-0"
                  :stroke-width="1.5"
                />
                <Avatar
                  :name="group.owner"
                  :image-url="ownerAvatars[group.owner.toLowerCase()]"
                  size="xs"
                />
                <span class="truncate">{{ group.owner }}</span>
                <span class="ml-auto text-[10px] opacity-60">{{
                  group.repos.length
                }}</span>
              </button>
            </OwnerContextMenu>

            <!-- Repositories in group -->
            <div
              v-if="!collapsedGroups.has(group.owner) || searchQuery"
              class="space-y-0.5 ml-2"
            >
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
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left',
                    currentRepository?.id === repo.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50',
                  ]"
                  :title="repo.name"
                >
                  <Folder class="w-4 h-4 flex-shrink-0" :stroke-width="1" />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">
                      {{ repo.name }}
                    </div>
                    <div class="text-xs text-muted-foreground truncate">
                      {{ repo.currentBranch || "No branch" }}
                    </div>
                  </div>
                  <Star
                    v-if="repo.isFavorite"
                    class="w-3 h-3 text-yellow-500 flex-shrink-0"
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
    <div class="border-t p-2 space-y-1">
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
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  User,
  Plus,
  Folder,
  Star,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  X,
} from "lucide-vue-next";
import { useRepositoriesStore } from "@/shared/stores";
import SidebarButton from "../ui/SidebarButton.vue";
import AddRepositoryDialog from "../dialogs/AddRepositoryDialog.vue";
import AppSettingsDialog from "../dialogs/AppSettingsDialog.vue";
import RepositoryContextMenu from "../RepositoryContextMenu.vue";
import OwnerContextMenu from "../OwnerContextMenu.vue";
import Avatar from "../ui/Avatar.vue";

const router = useRouter();
const repositoriesStore = useRepositoriesStore();

const addRepoDialog = ref<InstanceType<typeof AddRepositoryDialog>>();
const appSettingsDialog = ref<InstanceType<typeof AppSettingsDialog>>();

const repositories = computed(() => repositoriesStore.repositories);
const currentRepository = computed(() => repositoriesStore.currentRepository);

watch(currentRepository, (repo) => {
  if (!repo) return;
  const owner = getOwner(repo.remoteUrl);
  if (collapsedGroups.value.has(owner)) {
    collapsedGroups.value.delete(owner);
    saveCollapsedGroups();
  }
});

// Extract owner from repository remote URL
const getOwner = (remoteUrl?: string): string => {
  if (!remoteUrl) return "Local";

  // Handle HTTPS URLs: https://github.com/owner/repo.git
  const httpsMatch = remoteUrl.match(/https?:\/\/[^/]+\/([^/]+)\//);
  if (httpsMatch) return httpsMatch[1];

  // Handle SSH URLs: git@github.com:owner/repo.git
  const sshMatch = remoteUrl.match(/git@[^:]+:([^/]+)\//);
  if (sshMatch) return sshMatch[1];

  return "Local";
};

// Group repositories by owner
const repositoriesByOwner = computed(() => {
  const groups: Record<string, typeof repositories.value> = {};

  for (const repo of repositories.value) {
    const owner = getOwner(repo.remoteUrl);
    if (!groups[owner]) {
      groups[owner] = [];
    }
    groups[owner].push(repo);
  }

  // Sort groups alphabetically, but put favorites first within each group
  const sortedGroups: { owner: string; repos: typeof repositories.value }[] =
    [];
  for (const [owner, repos] of Object.entries(groups)) {
    sortedGroups.push({
      owner,
      repos: repos.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
      }),
    });
  }

  return sortedGroups.sort((a, b) => a.owner.localeCompare(b.owner));
});

const searchQuery = ref("");

const filteredRepositoriesByOwner = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return repositoriesByOwner.value;

  return repositoriesByOwner.value
    .map((group) => {
      const ownerMatches = group.owner.toLowerCase().includes(q);
      const filteredRepos = ownerMatches
        ? group.repos
        : group.repos.filter((repo) => repo.name.toLowerCase().includes(q));
      return { ...group, repos: filteredRepos };
    })
    .filter((group) => group.repos.length > 0);
});

// Owner avatar cache: lowercase owner -> avatar URL
const ownerAvatars = ref<Record<string, string | null>>({});

async function fetchOwnerAvatars(owners: string[]) {
  const toFetch = owners.filter(
    (o) => o !== "Local" && !(o.toLowerCase() in ownerAvatars.value),
  );
  if (toFetch.length === 0) return;

  try {
    const result = await window.api.avatar.getOwners(toFetch);
    if (result.success && result.data) {
      ownerAvatars.value = { ...ownerAvatars.value, ...result.data };
    }
  } catch (error) {
    console.error("Failed to fetch owner avatars:", error);
  }
}

watch(
  repositoriesByOwner,
  (groups) => {
    fetchOwnerAvatars(groups.map((g) => g.owner));
  },
  { immediate: true },
);

// Track collapsed state for each owner group
const collapsedGroups = ref<Set<string>>(new Set());
const COLLAPSED_GROUPS_KEY = "sidebar_collapsed_groups";

onMounted(async () => {
  try {
    const result = await window.api.settings.get(COLLAPSED_GROUPS_KEY);
    if (result.success && result.data) {
      const parsed: string[] = JSON.parse(result.data);
      collapsedGroups.value = new Set(parsed);
    }
  } catch (error) {
    console.error("Failed to load collapsed groups:", error);
  }
});

const saveCollapsedGroups = () => {
  const serialized = JSON.stringify([...collapsedGroups.value]);
  window.api.settings
    .set(COLLAPSED_GROUPS_KEY, serialized)
    .catch(console.error);
};

const toggleGroup = (owner: string) => {
  if (collapsedGroups.value.has(owner)) {
    collapsedGroups.value.delete(owner);
  } else {
    collapsedGroups.value.add(owner);
  }
  saveCollapsedGroups();
};

const openAddRepository = () => {
  addRepoDialog.value?.open();
};

const selectRepository = (repo: any) => {
  repositoriesStore.setCurrentRepository(repo);
  router.push("/repository");
};

const openSettings = () => {
  appSettingsDialog.value?.open();
};

const handleCloneComplete = () => {
  router.push("/repository");
};

const handleRepositoryOpened = () => {
  router.push("/repository");
};

const handleRepositoryCreated = () => {
  router.push("/repository");
};

const removeRepository = async (repo: any) => {
  await repositoriesStore.removeRepository(repo.id);
};

const toggleFavorite = async (repo: any) => {
  await repositoriesStore.toggleFavorite(repo.id);
};
</script>
