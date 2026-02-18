<template>
  <div
    class="flex-1 min-h-0 flex flex-col overflow-hidden"
    v-if="currentRepository"
  >
    <!-- Repository header -->
    <div
      class="shrink-0 h-[50px] px-6 border-b flex items-center justify-between"
    >
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold">{{ currentRepository.name }}</h1>
        <div class="w-px h-6 bg-border" />
        <BranchSelector />
      </div>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="fetchChanges">
          <RefreshCw class="w-4 h-4 mr-2" :stroke-width="1" />
          Fetch
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="pullChanges"
          :disabled="!gitStatus?.behind"
        >
          <Download class="w-4 h-4 mr-2" :stroke-width="1" />
          Pull {{ gitStatus?.behind ? `(${gitStatus.behind})` : "" }}
        </Button>
        <Button
          variant="default"
          size="sm"
          @click="pushChanges"
          :disabled="!gitStatus?.ahead"
        >
          <Upload class="w-4 h-4 mr-2" :stroke-width="1" />
          Push {{ gitStatus?.ahead ? `(${gitStatus.ahead})` : "" }}
        </Button>
      </div>
    </div>

    <!-- Repository tabs -->
    <Tabs
      v-model="activeTab"
      class="flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      <div class="shrink-0 pl-3 pr-6 border-b">
        <TabsList class="h-9 bg-transparent p-0 rounded-none">
          <TabsTrigger
            value="history"
            class="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <History class="size-4" :stroke-width="1.5" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="changes"
            class="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <FileDiff class="size-4" :stroke-width="1.5" />
            Changes
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            class="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <BarChart2 class="size-4" :stroke-width="1.5" />
            Stats
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            class="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Settings class="size-4" :stroke-width="1.5" />
            Settings
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- History tab content -->
      <TabsContent value="history" class="flex-1 min-h-0 mt-0 overflow-hidden">
        <RepositoryHistory />
      </TabsContent>

      <!-- Changes tab content -->
      <TabsContent value="changes" class="flex-1 min-h-0 mt-0 overflow-hidden">
        <SplitterGroup
          direction="horizontal"
          auto-save-id="repository-splitter"
          class="h-full"
        >
          <!-- Changes panel -->
          <SplitterPanel
            :default-size="30"
            :min-size="20"
            :max-size="50"
            class="flex flex-col overflow-hidden"
            :collapsible="false"
          >
            <div class="shrink-0 px-4 py-3 border-b">
              <h2 class="font-semibold">Changes</h2>
            </div>
            <ChangesPanel />
          </SplitterPanel>

          <SplitterResizeHandle
            class="flex items-center justify-center group border-x"
          >
            <div
              class="h-8 rounded-full bg-border group-hover:bg-muted-foreground/50 transition-colors"
            />
          </SplitterResizeHandle>

          <!-- Diff viewer -->
          <SplitterPanel
            :default-size="70"
            :min-size="30"
            class="flex flex-col"
          >
            <div class="px-4 py-3 border-b">
              <h2 class="font-semibold">Diff</h2>
            </div>
            <DiffViewer />
          </SplitterPanel>
        </SplitterGroup>
      </TabsContent>

      <!-- Stats tab content -->
      <TabsContent value="stats" class="flex-1 min-h-0 mt-0 overflow-hidden">
        <RepositoryStats />
      </TabsContent>

      <!-- Settings tab content -->
      <TabsContent
        value="settings"
        class="flex-1 min-h-0 mt-0 overflow-hidden py-2 pr-2"
      >
        <RepositorySettings />
      </TabsContent>
    </Tabs>
  </div>

  <!-- No repository selected -->
  <div v-else class="flex-1 flex flex-col">
    <!-- Header -->
    <div class="h-[50px] px-6 border-b flex items-center">
      <h1 class="text-lg font-semibold">Welcome to GitHub Desktop Plus</h1>
    </div>

    <!-- Recent repositories -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Recent Repositories Section -->
        <div v-if="recentRepositories.length > 0" class="mb-8">
          <h2 class="text-lg font-semibold mb-4">Recent Repositories</h2>
          <div class="grid gap-3">
            <button
              v-for="repo in recentRepositories"
              :key="repo.id"
              @click="selectRepository(repo)"
              class="p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-left group"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <GitBranch
                      class="w-4 h-4 text-muted-foreground"
                      :stroke-width="1"
                    />
                    <span class="font-medium">{{ repo.name }}</span>
                    <Star
                      v-if="repo.isFavorite"
                      class="w-3 h-3 text-yellow-500 fill-yellow-500"
                      :stroke-width="1"
                    />
                  </div>
                  <p class="text-sm text-muted-foreground truncate">
                    {{ repo.path }}
                  </p>
                  <div
                    class="flex items-center gap-4 mt-2 text-xs text-muted-foreground"
                  >
                    <span v-if="repo.currentBranch">
                      Branch: {{ repo.currentBranch }}
                    </span>
                    <span>
                      Last opened: {{ formatDate(repo.lastOpenedAt) }}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  class="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  :stroke-width="1"
                />
              </div>
            </button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
          <div class="grid grid-cols-3 gap-4">
            <button
              @click="createRepository"
              class="p-6 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-center"
            >
              <FilePlus
                class="w-8 h-8 mx-auto mb-2 text-primary"
                :stroke-width="1"
              />
              <h3 class="font-medium mb-1">Create Repository</h3>
              <p class="text-sm text-muted-foreground">Start a new project</p>
            </button>

            <button
              @click="cloneRepository"
              class="p-6 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-center"
            >
              <GitBranch
                class="w-8 h-8 mx-auto mb-2 text-primary"
                :stroke-width="1"
              />
              <h3 class="font-medium mb-1">Clone Repository</h3>
              <p class="text-sm text-muted-foreground">Clone from a URL</p>
            </button>

            <button
              @click="openRepository"
              class="p-6 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-center"
            >
              <FolderOpen
                class="w-8 h-8 mx-auto mb-2 text-primary"
                :stroke-width="1"
              />
              <h3 class="font-medium mb-1">Open Repository</h3>
              <p class="text-sm text-muted-foreground">
                Add a local repository
              </p>
            </button>
          </div>
        </div>

        <!-- Favorites -->
        <div v-if="favoriteRepositories.length > 0" class="mb-8">
          <h2 class="text-lg font-semibold mb-4">Favorite Repositories</h2>
          <div class="grid gap-3">
            <button
              v-for="repo in favoriteRepositories"
              :key="repo.id"
              @click="selectRepository(repo)"
              class="p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors text-left group"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <Star
                      class="w-4 h-4 text-yellow-500 fill-yellow-500"
                      :stroke-width="1"
                    />
                    <span class="font-medium">{{ repo.name }}</span>
                  </div>
                  <p class="text-sm text-muted-foreground truncate">
                    {{ repo.path }}
                  </p>
                </div>
                <ChevronRight
                  class="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
    <OpenRepositoryDialog
      ref="openRepoDialog"
      @repository-opened="handleRepositoryAction"
    />
    <CreateRepositoryDialog
      ref="createRepoDialog"
      @repository-created="handleRepositoryAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import {
  GitBranch,
  Star,
  RefreshCw,
  Download,
  Upload,
  ChevronRight,
  FilePlus,
  FolderOpen,
  FileDiff,
  BarChart2,
  Settings,
  History,
} from "lucide-vue-next";
import { useRepositoriesStore } from "@/shared/stores";
import Button from "../components/ui/Button.vue";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import BranchSelector from "../components/repository/BranchSelector.vue";
import ChangesPanel from "../components/repository/ChangesPanel.vue";
import DiffViewer from "../components/repository/DiffViewer.vue";
import RepositorySettings from "../components/repository/RepositorySettings.vue";
import RepositoryStats from "../components/repository/RepositoryStats.vue";
import RepositoryHistory from "../components/repository/RepositoryHistory.vue";
import CloneDialog from "../components/dialogs/CloneDialog.vue";
import OpenRepositoryDialog from "../components/dialogs/OpenRepositoryDialog.vue";
import CreateRepositoryDialog from "../components/dialogs/CreateRepositoryDialog.vue";

const repositoriesStore = useRepositoriesStore();

const cloneDialog = ref<InstanceType<typeof CloneDialog>>();
const openRepoDialog = ref<InstanceType<typeof OpenRepositoryDialog>>();
const createRepoDialog = ref<InstanceType<typeof CreateRepositoryDialog>>();

const activeTab = ref("changes");

const currentRepository = computed(() => repositoriesStore.currentRepository);

// Rescan changes when window regains focus and changes tab is active
const handleWindowFocus = () => {
  if (activeTab.value === "changes" && currentRepository.value) {
    repositoriesStore.fetchGitStatus();
  }
};

onMounted(() => {
  window.addEventListener("focus", handleWindowFocus);
});

onUnmounted(() => {
  window.removeEventListener("focus", handleWindowFocus);
});
const gitStatus = computed(() => repositoriesStore.gitStatus);
const recentRepositories = computed(() => repositoriesStore.recentRepositories);
const favoriteRepositories = computed(
  () => repositoriesStore.favoriteRepositories,
);

const toggleFavorite = () => {
  if (currentRepository.value) {
    repositoriesStore.toggleFavorite(currentRepository.value.id);
  }
};

const fetchChanges = async () => {
  if (currentRepository.value) {
    try {
      await window.api.git.fetch(currentRepository.value.path);
      await repositoriesStore.fetchGitStatus();
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
  }
};

const pullChanges = async () => {
  if (currentRepository.value) {
    try {
      await window.api.git.pull(currentRepository.value.path);
      await repositoriesStore.fetchGitStatus();
    } catch (error) {
      console.error("Failed to pull:", error);
    }
  }
};

const pushChanges = async () => {
  if (currentRepository.value) {
    try {
      await window.api.git.push(currentRepository.value.path);
      await repositoriesStore.fetchGitStatus();
    } catch (error) {
      console.error("Failed to push:", error);
    }
  }
};

const selectRepository = (repo: any) => {
  repositoriesStore.setCurrentRepository(repo);
};

const createRepository = () => {
  createRepoDialog.value?.open();
};

const cloneRepository = () => {
  cloneDialog.value?.open();
};

const openRepository = () => {
  openRepoDialog.value?.open();
};

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

const handleRepositoryAction = () => {
  // Repository is already added and set as current by the dialog
  // The view will automatically update via computed properties
};
</script>
