<template>
  <div
    class="flex-1 min-h-0 flex flex-col overflow-hidden"
    v-if="currentRepository"
  >
    <!-- Repository header -->
    <div
      class="shrink-0 h-[50px] px-2 pr-4 border-b flex items-center justify-between"
    >
      <div class="flex items-center gap-4">
        <!-- Owner repo switcher -->
        <Popover v-model:open="repoSwitcherOpen">
          <PopoverTrigger as-child>
            <button
              class="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent/60 transition-colors"
            >
              <Avatar
                :name="currentOwner"
                :image-url="ownerAvatarUrl"
                size="sm"
              />
              <h1 class="text-xl font-bold">{{ currentRepository.name }}</h1>
              <ChevronDown
                class="size-4 text-muted-foreground shrink-0"
                :stroke-width="1.5"
              />
            </button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              class="z-50 w-[260px] p-0"
              align="start"
              :side-offset="8"
            >
              <div
                class="bg-white dark:bg-card rounded-md shadow-md dark:shadow-lg border border-border"
              >
                <div class="px-3 py-2 border-b">
                  <p class="text-xs font-medium text-muted-foreground">
                    {{ currentOwner }} repositories
                  </p>
                </div>
                <div class="max-h-[300px] overflow-y-auto" v-lenis>
                  <button
                    v-for="repo in ownerRepositories"
                    :key="repo.id"
                    @click="switchRepository(repo)"
                    :class="[
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2',
                      repo.id === currentRepository.id ? 'bg-accent' : '',
                    ]"
                  >
                    <GitBranch
                      class="size-3.5 shrink-0 text-muted-foreground"
                      :stroke-width="1"
                    />
                    <span class="truncate flex-1">{{ repo.name }}</span>
                    <Check
                      v-if="repo.id === currentRepository.id"
                      class="size-3.5 shrink-0 text-primary"
                      :stroke-width="2"
                    />
                  </button>
                  <div
                    v-if="ownerRepositories.length === 0"
                    class="px-3 py-4 text-center text-xs text-muted-foreground"
                  >
                    No other repositories
                  </div>
                </div>
              </div>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
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
            <span
              v-if="changeCount > 0"
              class="ml-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground flex items-center justify-center"
            >
              {{ changeCount > 99 ? "99+" : changeCount }}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            class="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <CalendarDays class="size-4" :stroke-width="1.5" />
            Activity
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
            <div
              class="shrink-0 px-4 py-3 border-b flex items-center justify-between"
            >
              <h2 class="font-semibold">Changes</h2>
              <div
                class="flex items-center rounded-md border bg-muted/50 p-0.5"
              >
                <button
                  @click="changesLayout = 'horizontal'"
                  class="p-1 rounded-sm transition-colors"
                  :class="
                    changesLayout === 'horizontal'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  "
                  title="Side by side"
                >
                  <Columns2 class="size-3.5" :stroke-width="1.5" />
                </button>
                <button
                  @click="changesLayout = 'vertical'"
                  class="p-1 rounded-sm transition-colors"
                  :class="
                    changesLayout === 'vertical'
                      ? 'bg-background shadow-sm text-foreground'
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
            class="flex items-center justify-center group"
            :class="changesLayout === 'horizontal' ? 'border-x' : 'border-y'"
          >
            <div
              class="rounded-full bg-border group-hover:bg-muted-foreground/50 transition-colors"
              :class="changesLayout === 'horizontal' ? 'h-8 w-px' : 'w-8 h-px'"
            />
          </SplitterResizeHandle>

          <!-- Diff viewer -->
          <SplitterPanel
            :default-size="changesLayout === 'horizontal' ? 70 : 60"
            :min-size="30"
            class="flex flex-col"
          >
            <div class="px-4 py-3 border-b flex items-center gap-2">
              <h2 class="font-semibold truncate flex-1">
                {{ changesSelectedFile || "Diff" }}
              </h2>
              <span
                v-if="changesSelectedFile && changesIsStaged"
                class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              >
                STAGED
              </span>
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
      <TabsContent value="activity" class="flex-1 min-h-0 mt-0 overflow-hidden">
        <ActivityCalendar />
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

    <div class="flex-1 overflow-y-auto p-6" v-lenis>
      <div class="max-w-4xl mx-auto">
        <!-- Quick Actions -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
          <div class="grid grid-cols-3 gap-4">
            <button
              @click="createRepository"
              class="p-6 bg-card-translucent/50 border rounded-lg hover:bg-accent/50 transition-colors text-center"
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
              class="p-6 bg-card-translucent/50 border rounded-lg hover:bg-accent/50 transition-colors text-center"
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
              class="p-6 bg-card-translucent/50 border rounded-lg hover:bg-accent/50 transition-colors text-center"
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
              class="p-4 bg-card-translucent/50 border rounded-lg hover:bg-accent/50 transition-colors text-left group"
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
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { perf } from "@/shared/perf";
import { useToast } from "@/composables/useToast";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
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
} from "lucide-vue-next";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "../components/ui/Popover";
import { useRepositoriesStore } from "@/shared/stores";
import type { RepositoryInfo } from "@/shared/types/git.types";
import Avatar from "../components/ui/Avatar.vue";
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
import ActivityCalendar from "../components/repository/ActivityCalendar.vue";
import CloneDialog from "../components/dialogs/CloneDialog.vue";
import OpenRepositoryDialog from "../components/dialogs/OpenRepositoryDialog.vue";
import CreateRepositoryDialog from "../components/dialogs/CreateRepositoryDialog.vue";

const repositoriesStore = useRepositoriesStore();
const { toast } = useToast();

function parseGitError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  // Strip nested "Failed to pull: Error: " prefixes
  const inner = msg.replace(/^.*?Failed to \w+:\s*Error:\s*/i, "");
  // Remove stack traces (lines starting with "at ")
  const lines = inner.split("\n").filter((l) => !l.trim().startsWith("at "));
  return lines.join("\n").trim() || msg;
}

const cloneDialog = ref<InstanceType<typeof CloneDialog>>();
const openRepoDialog = ref<InstanceType<typeof OpenRepositoryDialog>>();
const createRepoDialog = ref<InstanceType<typeof CreateRepositoryDialog>>();

const activeTab = ref("history");
const repoSwitcherOpen = ref(false);

// Changes tab layout and file selection
const CHANGES_LAYOUT_KEY = "changes-layout";
const changesLayout = ref<"horizontal" | "vertical">(
  (localStorage.getItem(CHANGES_LAYOUT_KEY) as "horizontal" | "vertical") ||
    "horizontal",
);
watch(changesLayout, (v) => localStorage.setItem(CHANGES_LAYOUT_KEY, v));

const changesSelectedFile = ref<string | null>(null);
const changesIsStaged = ref(false);
const changesFileStatus = ref<'modified' | 'added' | 'deleted' | 'renamed' | 'conflicted'>('modified');

const onChangeFileSelected = (file: string, staged: boolean, status: 'modified' | 'added' | 'deleted' | 'renamed' | 'conflicted' = 'modified') => {
  changesSelectedFile.value = file;
  changesIsStaged.value = staged;
  changesFileStatus.value = status;
};

const currentRepository = computed(() => repositoriesStore.currentRepository);

function getOwner(remoteUrl?: string): string {
  if (!remoteUrl) return "Local";
  const httpsMatch = remoteUrl.match(/https?:\/\/[^/]+\/([^/]+)\//);
  if (httpsMatch) return httpsMatch[1];
  const sshMatch = remoteUrl.match(/git@[^:]+:([^/]+)\//);
  if (sshMatch) return sshMatch[1];
  return "Local";
}

const currentOwner = computed(() =>
  getOwner(currentRepository.value?.remoteUrl),
);

const ownerRepositories = computed(() =>
  repositoriesStore.repositories
    .filter((repo) => getOwner(repo.remoteUrl) === currentOwner.value)
    .sort((a, b) => a.name.localeCompare(b.name)),
);

const ownerAvatarUrl = ref<string | null>(null);

async function fetchOwnerAvatar(owner: string) {
  if (owner === "Local") {
    ownerAvatarUrl.value = null;
    return;
  }
  try {
    const result = await window.api.avatar.getOwner(owner);
    if (result.success && result.data) {
      ownerAvatarUrl.value = result.data;
    }
  } catch {
    ownerAvatarUrl.value = null;
  }
}

watch(
  currentOwner,
  (owner) => {
    ownerAvatarUrl.value = null;
    fetchOwnerAvatar(owner);
  },
  { immediate: true },
);

function switchRepository(repo: RepositoryInfo) {
  repoSwitcherOpen.value = false;
  if (repo.id !== currentRepository.value?.id) {
    repositoriesStore.setCurrentRepository(repo);
  }
}

// Rescan changes when window regains focus and changes tab is active
const handleWindowFocus = () => {
  if (activeTab.value === "changes" && currentRepository.value) {
    repositoriesStore.fetchGitStatus();
  }
};

onMounted(() => {
  perf.mark("repository-view:mounted");
  window.addEventListener("focus", handleWindowFocus);
});

// Git status is loaded by setCurrentRepository — no duplicate call needed here

onUnmounted(() => {
  window.removeEventListener("focus", handleWindowFocus);
});
const gitStatus = computed(() => repositoriesStore.gitStatus);
const changeCount = computed(() => {
  const s = gitStatus.value;
  if (!s) return 0;
  return (
    s.modified.length +
    s.added.length +
    s.deleted.length +
    s.renamed.length +
    s.conflicted.length
  );
});
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
    return perf.measure("repo-view:fetch", async () => {
      try {
        await window.api.git.fetch(currentRepository.value!.path);
        await repositoriesStore.fetchGitStatus();
      } catch (error) {
        console.error("Failed to fetch:", error);
        toast({
          title: "Fetch failed",
          description: parseGitError(error),
          variant: "destructive",
          duration: 5000,
        });
      }
    });
  }
};

const pullChanges = async () => {
  if (currentRepository.value) {
    return perf.measure("repo-view:pull", async () => {
      try {
        await window.api.git.pull(currentRepository.value!.path);
        await repositoriesStore.fetchGitStatus();
      } catch (error) {
        console.error("Failed to pull:", error);
        toast({
          title: "Pull failed",
          description: parseGitError(error),
          variant: "destructive",
          duration: 5000,
        });
      }
    });
  }
};

const pushChanges = async () => {
  if (currentRepository.value) {
    return perf.measure("repo-view:push", async () => {
      try {
        await window.api.git.push(currentRepository.value!.path);
        await repositoriesStore.fetchGitStatus();
      } catch (error) {
        console.error("Failed to push:", error);
        toast({
          title: "Push failed",
          description: parseGitError(error),
          variant: "destructive",
          duration: 5000,
        });
      }
    });
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

const handleRepositoryAction = () => {
  // Repository is already added and set as current by the dialog
  // The view will automatically update via computed properties
};
</script>
