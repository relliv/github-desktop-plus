<template>
  <div class="h-full flex flex-col overflow-hidden">
    <SplitterGroup
      direction="horizontal"
      auto-save-id="history-splitter"
      class="flex-1 min-h-0"
    >
      <!-- Column 1: Commit list -->
      <SplitterPanel
        :default-size="40"
        :min-size="25"
        :max-size="60"
        class="flex flex-col overflow-hidden"
      >
        <div class="shrink-0 px-4 py-3 border-b flex items-center justify-between">
          <h2 class="font-semibold text-sm">
            Commits
            <span v-if="totalCommits > 0" class="text-muted-foreground font-normal">
              ({{ totalCommits }})
            </span>
          </h2>
          <div class="flex items-center gap-1">
            <span
              v-if="isScanning"
              class="text-xs text-muted-foreground animate-pulse"
            >
              Scanning...
            </span>
            <button
              @click="rescan"
              class="p-1 rounded hover:bg-accent transition-colors"
              title="Rescan commits"
            >
              <RefreshCw class="size-3.5 text-muted-foreground" :stroke-width="1.5" />
            </button>
          </div>
        </div>

        <div
          v-if="commits.length > 0"
          class="flex-1 min-h-0 overflow-y-auto"
          @scroll="handleScroll"
          ref="commitListRef"
        >
          <TooltipProvider :delay-duration="400">
            <TooltipRoot v-for="commit in commits" :key="commit.hash">
              <TooltipTrigger as-child>
                <button
                  @click="selectCommit(commit)"
                  class="w-full text-left px-4 py-2.5 border-b hover:bg-accent/50 transition-colors"
                  :class="{ 'bg-accent': selectedCommit?.hash === commit.hash }"
                >
                  <div class="flex items-start gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">{{ commit.message }}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <!-- Author avatar(s) -->
                        <div class="shrink-0 flex items-center" :class="getAuthors(commit).length > 1 ? '-space-x-1' : ''">
                          <TooltipRoot v-for="(author, i) in getAuthors(commit)" :key="i">
                            <TooltipTrigger as-child>
                              <div
                                class="size-4 rounded-full flex items-center justify-center text-[7px] font-semibold text-white ring-1 ring-background cursor-default hover:!z-50 transition-transform hover:scale-125 overflow-hidden"
                                :style="{ backgroundColor: getAvatarColor(author.name), zIndex: getAuthors(commit).length - i }"
                              >
                                <img
                                  v-if="avatarMap[author.email.toLowerCase()]"
                                  :src="avatarMap[author.email.toLowerCase()]!"
                                  :alt="author.name"
                                  class="size-full object-cover"
                                />
                                <span v-else>{{ getInitials(author.name) }}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent
                                side="top"
                                :side-offset="6"
                                class="z-[60] rounded-md bg-popover px-2.5 py-1.5 text-popover-foreground shadow-md border"
                              >
                                <p class="text-xs font-medium">{{ author.name }}</p>
                                <p class="text-[11px] text-muted-foreground">{{ author.email }}</p>
                                <TooltipArrow class="fill-popover" />
                              </TooltipContent>
                            </TooltipPortal>
                          </TooltipRoot>
                        </div>
                        <span class="text-xs text-muted-foreground truncate">
                          {{ commit.authorName }}
                        </span>
                        <span class="text-xs text-muted-foreground shrink-0">
                          {{ formatDate(commit.date) }}
                        </span>
                      </div>
                    </div>
                    <code class="text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {{ commit.abbreviatedHash }}
                    </code>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent
                  side="right"
                  :side-offset="8"
                  class="z-50 max-w-sm rounded-md bg-popover px-3 py-2 text-popover-foreground shadow-md border animate-in fade-in-0 zoom-in-95"
                >
                  <p class="text-sm font-medium">{{ commit.message }}</p>
                  <p
                    v-if="commit.body"
                    class="mt-1.5 text-xs text-muted-foreground whitespace-pre-line"
                  >
                    {{ commit.body }}
                  </p>
                  <TooltipArrow class="fill-popover" />
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
          </TooltipProvider>

          <div v-if="isLoadingMore" class="py-3 text-center">
            <span class="text-xs text-muted-foreground">Loading more...</span>
          </div>
        </div>

        <div v-else-if="isScanning" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <RefreshCw class="size-8 mx-auto mb-3 text-muted-foreground animate-spin" :stroke-width="1" />
            <p class="text-sm text-muted-foreground">Scanning commits...</p>
            <p v-if="scanProgress" class="text-xs text-muted-foreground mt-1">
              {{ scanProgress.scanned }} / {{ scanProgress.total }}
            </p>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <GitCommitVertical class="size-8 mx-auto mb-3 text-muted-foreground" :stroke-width="1" />
            <p class="text-sm text-muted-foreground">No commits found</p>
          </div>
        </div>
      </SplitterPanel>

      <SplitterResizeHandle class="flex items-center justify-center group border-x">
        <div class="h-8 rounded-full bg-border group-hover:bg-muted-foreground/50 transition-colors" />
      </SplitterResizeHandle>

      <!-- Column 2: Changed files -->
      <SplitterPanel
        :default-size="25"
        :min-size="15"
        :max-size="40"
        class="flex flex-col overflow-hidden"
      >
        <div class="shrink-0 px-4 py-3 border-b">
          <h2 class="font-semibold text-sm">
            Changed Files
            <span v-if="commitFiles.length > 0" class="text-muted-foreground font-normal">
              ({{ commitFiles.length }})
            </span>
          </h2>
        </div>

        <div v-if="isLoadingFiles" class="flex-1 flex items-center justify-center">
          <span class="text-xs text-muted-foreground">Loading files...</span>
        </div>

        <div
          v-else-if="commitFiles.length > 0"
          class="flex-1 min-h-0 overflow-y-auto"
        >
          <button
            v-for="file in commitFiles"
            :key="file.file"
            @click="selectFile(file)"
            class="w-full text-left px-4 py-2 border-b hover:bg-accent/50 transition-colors flex items-center gap-2"
            :class="{ 'bg-accent': selectedFile?.file === file.file }"
          >
            <span
              class="shrink-0 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded"
              :class="fileStatusClass(file.status)"
            >
              {{ file.status }}
            </span>
            <span class="text-sm truncate" :title="file.file">
              {{ getFileName(file.file) }}
            </span>
            <span
              v-if="getFilePath(file.file)"
              class="text-xs text-muted-foreground truncate ml-auto shrink-0"
            >
              {{ getFilePath(file.file) }}
            </span>
          </button>
        </div>

        <div v-else-if="selectedCommit" class="flex-1 flex items-center justify-center">
          <p class="text-sm text-muted-foreground">No files changed</p>
        </div>

        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <FileText class="size-8 mx-auto mb-3 text-muted-foreground" :stroke-width="1" />
            <p class="text-sm text-muted-foreground">Select a commit to view changes</p>
          </div>
        </div>
      </SplitterPanel>

      <SplitterResizeHandle class="flex items-center justify-center group border-x">
        <div class="h-8 rounded-full bg-border group-hover:bg-muted-foreground/50 transition-colors" />
      </SplitterResizeHandle>

      <!-- Column 3: Diff preview -->
      <SplitterPanel
        :default-size="35"
        :min-size="20"
        class="flex flex-col overflow-hidden"
      >
        <div class="shrink-0 px-4 py-3 border-b">
          <h2 class="font-semibold text-sm truncate">
            {{ selectedFile ? selectedFile.file : 'Diff' }}
          </h2>
        </div>

        <div v-if="isLoadingDiff" class="flex-1 flex items-center justify-center">
          <span class="text-xs text-muted-foreground">Loading diff...</span>
        </div>

        <div
          v-else-if="fileDiff"
          class="flex-1 min-h-0 overflow-auto bg-muted/30"
        >
          <pre class="text-xs font-mono p-4 leading-relaxed"><code>{{ fileDiff }}</code></pre>
        </div>

        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <Code class="size-8 mx-auto mb-3 text-muted-foreground" :stroke-width="1" />
            <p class="text-sm text-muted-foreground">
              {{ selectedCommit ? 'Select a file to view diff' : 'Select a commit to get started' }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              Code diff viewer coming soon
            </p>
          </div>
        </div>
      </SplitterPanel>
    </SplitterGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import {
  SplitterGroup,
  SplitterPanel,
  SplitterResizeHandle,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "reka-ui";
import {
  RefreshCw,
  GitCommitVertical,
  FileText,
  Code,
} from "lucide-vue-next";
import { useRepositoriesStore } from "@/shared/stores";

interface CommitRecord {
  id: number;
  repositoryId: number;
  hash: string;
  abbreviatedHash: string;
  authorName: string;
  authorEmail: string;
  date: string | Date;
  message: string;
  body: string | null;
  parentHashes: string | null;
}

interface CommitFile {
  status: "A" | "M" | "D" | "R" | "C";
  file: string;
}

const repositoriesStore = useRepositoriesStore();
const currentRepository = computed(() => repositoriesStore.currentRepository);

const commits = ref<CommitRecord[]>([]);
const totalCommits = ref(0);
const selectedCommit = ref<CommitRecord | null>(null);
const commitFiles = ref<CommitFile[]>([]);
const selectedFile = ref<CommitFile | null>(null);
const fileDiff = ref<string>("");

const isScanning = ref(false);
const isLoadingMore = ref(false);
const isLoadingFiles = ref(false);
const isLoadingDiff = ref(false);
const scanProgress = ref<{ scanned: number; total: number } | null>(null);
const commitListRef = ref<HTMLElement | null>(null);

// Avatar cache: email -> avatar URL
const avatarMap = ref<Record<string, string | null>>({});

const PAGE_SIZE = 50;
let currentOffset = 0;
let hasMore = true;

// Cleanup functions for IPC listeners
let cleanupProgress: (() => void) | null = null;
let cleanupComplete: (() => void) | null = null;

onMounted(() => {
  // Listen for scan progress
  cleanupProgress = window.api.commits.onScanProgress((data) => {
    if (currentRepository.value && data.repositoryId === currentRepository.value.id) {
      isScanning.value = true;
      scanProgress.value = { scanned: data.scanned, total: data.total };
    }
  });

  // Listen for scan completion
  cleanupComplete = window.api.commits.onScanComplete((data) => {
    if (currentRepository.value && data.repositoryId === currentRepository.value.id) {
      isScanning.value = false;
      scanProgress.value = null;
      if (data.added > 0) {
        loadCommits(true);
      }
    }
  });

  // Load commits if a repository is already selected
  if (currentRepository.value) {
    loadCommits(true);
  }
});

onUnmounted(() => {
  cleanupProgress?.();
  cleanupComplete?.();
});

// Watch for repository changes
watch(
  () => currentRepository.value?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      resetState();
      loadCommits(true);
    }
  }
);

function resetState() {
  commits.value = [];
  totalCommits.value = 0;
  selectedCommit.value = null;
  commitFiles.value = [];
  selectedFile.value = null;
  fileDiff.value = "";
  currentOffset = 0;
  hasMore = true;
}

async function loadCommits(reset = false) {
  if (!currentRepository.value) return;

  if (reset) {
    currentOffset = 0;
    hasMore = true;
  }

  if (!hasMore && !reset) return;

  const isInitialLoad = reset;
  if (!isInitialLoad) {
    isLoadingMore.value = true;
  }

  try {
    const [listResult, countResult] = await Promise.all([
      window.api.commits.list(currentRepository.value.id, currentOffset, PAGE_SIZE),
      isInitialLoad
        ? window.api.commits.count(currentRepository.value.id)
        : Promise.resolve(null),
    ]);

    if (listResult.success && listResult.data) {
      if (reset) {
        commits.value = listResult.data;
      } else {
        commits.value.push(...listResult.data);
      }
      currentOffset += listResult.data.length;
      hasMore = listResult.data.length === PAGE_SIZE;

      // Fetch avatars for new commits in background
      fetchAvatars(listResult.data);
    }

    if (countResult?.success) {
      totalCommits.value = countResult.data;
    }
  } catch (error) {
    console.error("Failed to load commits:", error);
  } finally {
    isLoadingMore.value = false;
  }
}

async function fetchAvatars(newCommits: CommitRecord[]) {
  // Collect unique emails not already in the map
  const emails = new Set<string>();
  for (const commit of newCommits) {
    const email = commit.authorEmail.toLowerCase();
    if (!(email in avatarMap.value)) {
      emails.add(email);
    }
    // Also check co-authors
    if (commit.body) {
      const coAuthorRegex = /Co-authored-by:\s*.+?\s*<([^>]+)>/gi;
      let match: RegExpExecArray | null;
      while ((match = coAuthorRegex.exec(commit.body)) !== null) {
        const coEmail = match[1].trim().toLowerCase();
        if (!(coEmail in avatarMap.value)) {
          emails.add(coEmail);
        }
      }
    }
  }

  if (emails.size === 0) return;

  try {
    const result = await window.api.avatar.getBatch([...emails]);
    if (result.success && result.data) {
      avatarMap.value = { ...avatarMap.value, ...result.data };
    }
  } catch (error) {
    console.error("Failed to fetch avatars:", error);
  }
}

async function selectCommit(commit: CommitRecord) {
  selectedCommit.value = commit;
  selectedFile.value = null;
  fileDiff.value = "";
  commitFiles.value = [];

  if (!currentRepository.value) return;

  isLoadingFiles.value = true;
  try {
    const result = await window.api.commits.files(
      currentRepository.value.path,
      commit.hash
    );
    if (result.success && result.data) {
      commitFiles.value = result.data;
    }
  } catch (error) {
    console.error("Failed to load commit files:", error);
  } finally {
    isLoadingFiles.value = false;
  }
}

async function selectFile(file: CommitFile) {
  selectedFile.value = file;
  fileDiff.value = "";

  if (!currentRepository.value || !selectedCommit.value) return;

  isLoadingDiff.value = true;
  try {
    const result = await window.api.commits.fileDiff(
      currentRepository.value.path,
      selectedCommit.value.hash,
      file.file
    );
    if (result.success && result.data) {
      fileDiff.value = result.data;
    }
  } catch (error) {
    console.error("Failed to load file diff:", error);
  } finally {
    isLoadingDiff.value = false;
  }
}

async function rescan() {
  if (!currentRepository.value) return;
  isScanning.value = true;
  scanProgress.value = null;

  try {
    await window.api.commits.fullScan(
      currentRepository.value.id,
      currentRepository.value.path
    );
  } catch (error) {
    console.error("Failed to rescan:", error);
    isScanning.value = false;
  }
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;

  // Load more when scrolled near bottom
  if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !isLoadingMore.value) {
    loadCommits(false);
  }
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? "just now" : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function fileStatusClass(status: string): string {
  switch (status) {
    case "A":
      return "text-green-600 bg-green-500/15";
    case "M":
      return "text-yellow-600 bg-yellow-500/15";
    case "D":
      return "text-red-600 bg-red-500/15";
    case "R":
      return "text-blue-600 bg-blue-500/15";
    case "C":
      return "text-purple-600 bg-purple-500/15";
    default:
      return "text-muted-foreground bg-muted";
  }
}

function getFileName(filePath: string): string {
  return filePath.split("/").pop() || filePath;
}

function getFilePath(filePath: string): string {
  const parts = filePath.split("/");
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

interface Author {
  name: string;
  email: string;
}

const coAuthorRegex = /^Co-authored-by:\s*(.+?)\s*<([^>]+)>/gim;

function getAuthors(commit: CommitRecord): Author[] {
  const authors: Author[] = [{ name: commit.authorName, email: commit.authorEmail }];
  if (!commit.body) return authors;

  let match: RegExpExecArray | null;
  coAuthorRegex.lastIndex = 0;
  while ((match = coAuthorRegex.exec(commit.body)) !== null) {
    const name = match[1].trim();
    const email = match[2].trim();
    if (!authors.some((a) => a.email === email)) {
      authors.push({ name, email });
    }
  }
  return authors;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const avatarColors = [
  "#e11d48", "#db2777", "#c026d3", "#9333ea",
  "#7c3aed", "#4f46e5", "#2563eb", "#0284c7",
  "#0891b2", "#0d9488", "#059669", "#16a34a",
  "#ca8a04", "#ea580c", "#dc2626", "#6d28d9",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}
</script>
