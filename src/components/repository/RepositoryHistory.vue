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
        <div
          class="shrink-0 px-4 py-3 border-b flex items-center justify-between h-[55px]"
        >
          <h2 class="font-semibold text-sm flex items-center gap-1.5">
            Commits
            <span class="text-muted-foreground font-normal">
              (<NumberFlow
                :value="totalCommits"
                :animated="true"
                :transformTiming="{ duration: 500, easing: 'ease-out' }"
                :spinTiming="{ duration: 500, easing: 'ease-out' }"
                :trend="-1"
              />)
            </span>
            <button
              @click="rescan"
              class="p-1 rounded hover:bg-accent transition-colors"
              title="Rescan commits"
            >
              <RefreshCw
                class="size-3.5 text-muted-foreground"
                :stroke-width="1.5"
              />
            </button>
            <span
              v-if="isScanning"
              class="text-xs text-muted-foreground font-normal animate-pulse"
            >
              Scanning...
            </span>
          </h2>
          <div class="flex items-center gap-2">
            <!-- View toggle -->
            <div class="flex items-center rounded-md border bg-muted/50 p-0.5">
              <button
                @click="viewMode = 'timeline'"
                class="p-1 rounded-sm transition-colors"
                :class="
                  viewMode === 'timeline'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                "
                title="Timeline view"
              >
                <GitCommitVertical class="size-3.5" :stroke-width="1.5" />
              </button>
              <button
                @click="viewMode = 'list'"
                class="p-1 rounded-sm transition-colors"
                :class="
                  viewMode === 'list'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                "
                title="List view"
              >
                <List class="size-3.5" :stroke-width="1.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Search bar -->
        <div class="shrink-0 px-3 py-2">
          <div class="relative">
            <Search
              class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
              :stroke-width="1.5"
            />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search commits..."
              class="w-full pl-8 pr-8 py-1.5 text-sm border rounded-md bg-background/70 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent transition-colors"
            >
              <X class="size-3 text-muted-foreground" :stroke-width="1.5" />
            </button>
          </div>
        </div>

        <div
          v-if="commits.length > 0"
          class="flex-1 min-h-0 overflow-y-auto"
          ref="commitListRef"
          v-lenis
        >
          <!-- List view -->
          <TooltipProvider
            v-if="viewMode === 'list'"
            :delay-duration="isScrolling ? 999999 : 400"
            :skip-delay-duration="0"
          >
            <TooltipRoot
              v-for="commit in commits"
              :key="commit.hash"
              :open="isScrolling ? false : undefined"
              @update:open="(open) => open && (hoveredCommit = commit.hash)"
            >
              <TooltipTrigger as-child>
                <button
                  @click="selectCommit(commit)"
                  @contextmenu.prevent="openContextMenu($event, commit)"
                  class="group/commit w-full text-left px-4 py-2.5 border-b hover:bg-accent/50 transition-colors"
                  :class="{ 'bg-accent': selectedCommit?.hash === commit.hash }"
                >
                  <div class="flex items-start gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <p class="text-sm font-medium truncate">
                          {{ commit.message }}
                        </p>
                        <span
                          v-for="tag in tagMap[commit.hash] || []"
                          :key="tag"
                          class="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
                        >
                          <Tag class="size-2.5" :stroke-width="2" />
                          {{ tag }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <!-- Author avatar(s) -->
                        <AvatarStack :authors="getAvatarAuthors(commit)" />
                        <span class="text-xs text-muted-foreground truncate">
                          {{ commit.authorName }}
                        </span>
                        <span class="text-xs text-muted-foreground shrink-0">
                          {{ formatDate(commit.date) }}
                        </span>
                      </div>
                    </div>
                    <div class="shrink-0 flex items-center gap-1">
                      <button
                        class="p-0.5 rounded opacity-0 group-hover/commit:opacity-100 hover:bg-accent transition-all"
                        @click.stop="copyHash(commit.hash)"
                        title="Copy full hash"
                      >
                        <Check
                          v-if="copiedHash === commit.hash"
                          class="size-3 text-green-500"
                          :stroke-width="2"
                        />
                        <Copy
                          v-else
                          class="size-3 text-muted-foreground"
                          :stroke-width="1.5"
                        />
                      </button>
                      <code
                        class="text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded"
                      >
                        {{ commit.abbreviatedHash }}
                      </code>
                    </div>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipPortal
                v-if="!isScrolling && hoveredCommit === commit.hash"
              >
                <TooltipContent
                  side="right"
                  :side-offset="8"
                  class="z-50 max-w-sm rounded-md bg-popover px-3 py-2 text-popover-foreground shadow-md border animate-in fade-in-0 zoom-in-95"
                >
                  <p class="text-sm font-medium">{{ commit.message }}</p>
                  <p
                    v-if="commit.body"
                    class="mt-1.5 text-xs text-muted-foreground whitespace-pre-line max-h-48 overflow-y-auto pr-1"
                  >
                    {{ commit.body }}
                  </p>
                  <TooltipArrow class="fill-popover" />
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
          </TooltipProvider>

          <!-- Timeline view -->
          <div v-else class="px-4 py-3">
            <TooltipProvider
              :delay-duration="isScrolling ? 999999 : 400"
              :skip-delay-duration="0"
            >
              <div class="relative">
                <!-- Timeline line -->
                <div
                  class="absolute left-[11px] top-0 bottom-0 w-px bg-border"
                />

                <!-- Date separators + commit items -->
                <template v-for="(commit, idx) in commits" :key="commit.hash">
                  <!-- Sticky date separator -->
                  <template
                    v-if="
                      idx === 0 ||
                      getDateLabel(commit.date) !==
                        getDateLabel(commits[idx - 1].date)
                    "
                  >
                    <!-- Sentinel to detect stuck state -->
                    <div
                      :ref="(el) => registerSentinel(el as HTMLElement, idx)"
                      class="h-0"
                    />
                    <div
                      class="sticky top-0 z-10 pl-8 py-2.5 -mx-4 px-4 bg-background/80 backdrop-blur-md transition-shadow duration-150"
                      :class="[
                        idx > 0 ? 'mt-2' : '',
                        stuckLabels.has(idx)
                          ? 'shadow-[0_2px_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(160,160,160,0.12)]'
                          : 'shadow-none',
                      ]"
                    >
                      <div
                        class="text-xs font-bold text-foreground tracking-wide flex items-center gap-1.5"
                      >
                        <CalendarDays
                          class="size-3 text-muted-foreground"
                          :stroke-width="2"
                        />
                        {{ getDateLabel(commit.date) }}
                        <span
                          class="text-[10px] font-medium text-muted-foreground/70"
                        >
                          {{ getDateCommitCount(getDateLabel(commit.date)) }}
                          {{
                            getDateCommitCount(getDateLabel(commit.date)) === 1
                              ? "commit"
                              : "commits"
                          }}
                        </span>
                        <span
                          class="ml-auto text-[10px] font-normal text-muted-foreground"
                        >
                          {{ getDaysAgo(commit.date) }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <!-- Commit row with dot -->
                  <div class="relative pl-8 pb-4 last:pb-0">
                    <TimelineNode
                      :active="selectedCommit?.hash === commit.hash"
                      @click="selectCommit(commit)"
                    />

                    <!-- Commit content with tooltip -->
                    <TooltipRoot
                      :open="isScrolling ? false : undefined"
                      @update:open="
                        (open) => open && (hoveredCommit = commit.hash)
                      "
                    >
                      <TooltipTrigger as-child>
                        <button
                          @click="selectCommit(commit)"
                          @contextmenu.prevent="openContextMenu($event, commit)"
                          class="group/commit w-full text-left rounded-lg px-3 py-2 -mx-1 border border-transparent hover:bg-card-translucent/80 transition-colors"
                          :class="{
                            'bg-card-translucent/70 border-card-translucent/90':
                              selectedCommit?.hash === commit.hash,
                          }"
                        >
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <p class="text-sm font-medium leading-snug">
                              {{ commit.message }}
                            </p>
                            <span
                              v-for="tag in tagMap[commit.hash] || []"
                              :key="tag"
                              class="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
                            >
                              <Tag class="size-2.5" :stroke-width="2" />
                              {{ tag }}
                            </span>
                          </div>
                          <div class="flex items-center gap-2 mt-1.5">
                            <!-- Author avatar(s) -->
                            <AvatarStack :authors="getAvatarAuthors(commit)" />
                            <span
                              class="text-xs text-muted-foreground truncate"
                              >{{ commit.authorName }}</span
                            >
                            <span
                              class="text-xs text-muted-foreground shrink-0"
                              >{{ formatDate(commit.date) }}</span
                            >
                            <div
                              class="flex items-center gap-1 ml-auto shrink-0 opacity-0 group-hover/commit:opacity-100 transition-opacity"
                            >
                              <button
                                class="p-0.5 rounded hover:bg-accent transition-all"
                                @click.stop="copyHash(commit.hash)"
                                title="Copy full hash"
                              >
                                <Check
                                  v-if="copiedHash === commit.hash"
                                  class="size-3 text-green-500"
                                  :stroke-width="2"
                                />
                                <Copy
                                  v-else
                                  class="size-3 text-muted-foreground"
                                  :stroke-width="1.5"
                                />
                              </button>
                              <code
                                class="text-[10px] text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded"
                              >
                                {{ commit.abbreviatedHash }}
                              </code>
                            </div>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipPortal
                        v-if="!isScrolling && hoveredCommit === commit.hash"
                      >
                        <TooltipContent
                          side="right"
                          :side-offset="8"
                          class="z-50 max-w-sm rounded-md bg-popover px-3 py-2 text-popover-foreground shadow-md border animate-in fade-in-0 zoom-in-95"
                        >
                          <p class="text-sm font-medium">
                            {{ commit.message }}
                          </p>
                          <p
                            v-if="commit.body"
                            class="mt-1.5 text-xs text-muted-foreground whitespace-pre-line max-h-48 overflow-y-auto pr-1"
                          >
                            {{ commit.body }}
                          </p>
                          <TooltipArrow class="fill-popover" />
                        </TooltipContent>
                      </TooltipPortal>
                    </TooltipRoot>
                  </div>
                </template>
              </div>
            </TooltipProvider>
          </div>

          <div v-if="isLoadingMore" class="py-3 text-center">
            <span class="text-xs text-muted-foreground">Loading more...</span>
          </div>
        </div>

        <div
          v-else-if="isScanning"
          class="flex-1 flex items-center justify-center"
        >
          <div class="text-center">
            <RefreshCw
              class="size-8 mx-auto mb-3 text-muted-foreground animate-spin"
              :stroke-width="1"
            />
            <p class="text-sm text-muted-foreground">Scanning commits...</p>
            <p v-if="scanProgress" class="text-xs text-muted-foreground mt-1">
              {{ scanProgress.scanned }} / {{ scanProgress.total }}
            </p>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <Search
              v-if="searchQuery.trim()"
              class="size-8 mx-auto mb-3 text-muted-foreground"
              :stroke-width="1"
            />
            <GitCommitVertical
              v-else
              class="size-8 mx-auto mb-3 text-muted-foreground"
              :stroke-width="1"
            />
            <p class="text-sm text-muted-foreground">
              {{
                searchQuery.trim() ? "No matching commits" : "No commits found"
              }}
            </p>
            <button
              v-if="searchQuery.trim()"
              @click="clearSearch"
              class="mt-2 text-xs text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        </div>
      </SplitterPanel>

      <SplitterResizeHandle
        class="flex items-center justify-center group border-x"
      >
        <div
          class="h-8 rounded-full bg-border group-hover:bg-muted-foreground/50 transition-colors"
        />
      </SplitterResizeHandle>

      <!-- Columns 2+3: Changed files + Diff (switchable layout) -->
      <SplitterPanel
        :default-size="60"
        :min-size="30"
        class="flex flex-col overflow-hidden"
      >
        <SplitterGroup
          :direction="detailLayout"
          :auto-save-id="`history-detail-${detailLayout}`"
          :key="detailLayout"
          class="flex-1 min-h-0"
        >
          <!-- Changed files -->
          <SplitterPanel
            :default-size="detailLayout === 'horizontal' ? 40 : 40"
            :min-size="20"
            :max-size="60"
            class="flex flex-col overflow-hidden"
          >
            <div
              class="flex flex-row gap-2 justify-between items-center shrink-0 px-4 py-3 border-b h-[55px]"
            >
              <h2 class="font-semibold text-sm">
                Changed Files
                <span
                  v-if="commitFiles.length > 0"
                  class="text-muted-foreground font-normal"
                >
                  ({{ commitFiles.length }})
                </span>
              </h2>
              <div
                class="flex items-center rounded-md border bg-muted/50 p-0.5"
              >
                <button
                  @click="detailLayout = 'horizontal'"
                  class="p-1 rounded-sm transition-colors"
                  :class="
                    detailLayout === 'horizontal'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  "
                  title="Side by side"
                >
                  <Columns2 class="size-3" :stroke-width="1.5" />
                </button>
                <button
                  @click="detailLayout = 'vertical'"
                  class="p-1 rounded-sm transition-colors"
                  :class="
                    detailLayout === 'vertical'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  "
                  title="Top and bottom"
                >
                  <Rows2 class="size-3" :stroke-width="1.5" />
                </button>
              </div>
            </div>

            <div
              v-if="isLoadingFiles"
              class="flex-1 flex items-center justify-center"
            >
              <span class="text-xs text-muted-foreground"
                >Loading files...</span
              >
            </div>

            <div
              v-else-if="commitFiles.length > 0"
              class="flex-1 min-h-0 overflow-y-auto"
              v-lenis
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

            <div
              v-else-if="selectedCommit"
              class="flex-1 flex items-center justify-center"
            >
              <p class="text-sm text-muted-foreground">No files changed</p>
            </div>

            <div v-else class="flex-1 flex items-center justify-center">
              <div class="text-center">
                <FileText
                  class="size-8 mx-auto mb-3 text-muted-foreground"
                  :stroke-width="1"
                />
                <p class="text-sm text-muted-foreground">
                  Select a commit to view changes
                </p>
              </div>
            </div>
          </SplitterPanel>

          <SplitterResizeHandle
            class="flex items-center justify-center group"
            :class="detailLayout === 'horizontal' ? 'border-x' : 'border-y'"
          >
            <div
              class="rounded-full bg-border group-hover:bg-muted-foreground/50 transition-colors"
              :class="detailLayout === 'horizontal' ? 'h-8 w-px' : 'w-8 h-px'"
            />
          </SplitterResizeHandle>

          <!-- Diff preview -->
          <SplitterPanel
            :default-size="60"
            :min-size="20"
            class="flex flex-col overflow-hidden"
          >
            <div
              class="flex flex-row gap-2 justify-between items-center shrink-0 px-4 py-3 border-b h-[55px]"
            >
              <h2 class="font-semibold text-sm truncate">
                {{ selectedFile ? selectedFile.file : "Diff" }}
              </h2>
            </div>

            <div
              v-if="isLoadingDiff"
              class="flex-1 flex items-center justify-center"
            >
              <span class="text-xs text-muted-foreground">Loading diff...</span>
            </div>

            <div
              v-else-if="fileDiff"
              class="flex-1 min-h-0 overflow-auto"
              v-lenis
            >
              <NxDiffViewer
                :diff="fileDiff"
                :theme="codeViewerTheme"
                :language="selectedFileLanguage"
                :show-header="false"
                :file-extension="selectedFileExtension"
                border-style="none"
              />
            </div>

            <div v-else class="flex-1 flex items-center justify-center">
              <div class="text-center">
                <Code
                  class="size-8 mx-auto mb-3 text-muted-foreground"
                  :stroke-width="1"
                />
                <p class="text-sm text-muted-foreground">
                  {{
                    selectedCommit
                      ? "Select a file to view diff"
                      : "Select a commit to get started"
                  }}
                </p>
              </div>
            </div>
          </SplitterPanel>
        </SplitterGroup>
      </SplitterPanel>
    </SplitterGroup>

    <!-- Commit context menu -->
    <Teleport to="body">
      <div
        v-if="ctxMenu.commit"
        class="fixed inset-0 z-50"
        @click="closeContextMenu"
        @contextmenu.prevent="closeContextMenu"
      >
        <div
          class="absolute w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        >
          <button
            class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            @click="copyHash(ctxMenu.commit!.hash)"
          >
            <Copy class="w-4 h-4 mr-2" :stroke-width="1.5" />
            Copy Commit Hash
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { getLenisInstance } from "@/directives/lenis";
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
import AvatarStack from "@/components/ui/AvatarStack.vue";
import TimelineNode from "./TimelineNode.vue";
import type { AvatarAuthor } from "@/components/ui/AvatarStack.vue";
import {
  RefreshCw,
  GitCommitVertical,
  FileText,
  Code,
  Copy,
  Check,
  List,
  CalendarDays,
  Columns2,
  Rows2,
  Tag,
  Search,
  X,
} from "lucide-vue-next";
import NumberFlow from "@number-flow/vue";
import { DiffViewer as NxDiffViewer } from "@ngeenx/nx-vue-code-viewer";
import { useRepositoriesStore } from "@/shared/stores";
import { useCodeViewerTheme } from "@/composables/useCodeViewerTheme";
import { useToast } from "@/composables/useToast";

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
const { codeViewerTheme } = useCodeViewerTheme();
const { toast } = useToast();
const currentRepository = computed(() => repositoriesStore.currentRepository);

const selectedFileExtension = computed(() => {
  if (!selectedFile.value) return undefined;
  const parts = selectedFile.value.file.split(".");
  return parts.length > 1 ? parts.pop() : undefined;
});

const selectedFileLanguage = computed(() => {
  const ext = selectedFileExtension.value;
  if (!ext) return "plaintext";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    vue: "vue",
    css: "css",
    scss: "scss",
    html: "html",
    json: "json",
    md: "markdown",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    rb: "ruby",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
    toml: "toml",
    xml: "xml",
    sql: "sql",
    swift: "swift",
    kt: "kotlin",
    dart: "dart",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
  };
  return map[ext] || "plaintext";
});

const commits = ref<CommitRecord[]>([]);
const totalCommits = ref(0);
const selectedCommit = ref<CommitRecord | null>(null);
const commitFiles = ref<CommitFile[]>([]);
const selectedFile = ref<CommitFile | null>(null);
const fileDiff = ref<string>("");

const VIEW_MODE_KEY = "repository-history-view-mode";
const viewMode = ref<"list" | "timeline">(
  (localStorage.getItem(VIEW_MODE_KEY) as "list" | "timeline") || "list",
);
watch(viewMode, (v) => localStorage.setItem(VIEW_MODE_KEY, v));

const DETAIL_LAYOUT_KEY = "history-detail-layout";
const detailLayout = ref<"horizontal" | "vertical">(
  (localStorage.getItem(DETAIL_LAYOUT_KEY) as "horizontal" | "vertical") ||
    "horizontal",
);
watch(detailLayout, (v) => localStorage.setItem(DETAIL_LAYOUT_KEY, v));

const isScanning = ref(false);
const isLoadingMore = ref(false);
const isLoadingFiles = ref(false);
const isLoadingDiff = ref(false);
const scanProgress = ref<{ scanned: number; total: number } | null>(null);
const commitListRef = ref<HTMLElement | null>(null);

// Avatar cache: email -> avatar URL
const avatarMap = ref<Record<string, string | null>>({});

// Tags: commit hash -> tag names
const tagMap = ref<Record<string, string[]>>({});

const copiedHash = ref<string | null>(null);
const hoveredCommit = ref<string | null>(null);

// Search state
const searchQuery = ref("");
const isSearching = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Dismiss tooltips on scroll
const isScrolling = ref(false);
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

// Sticky date label detection
const stuckLabels = ref(new Set<number>());
const sentinelMap = new Map<number, HTMLElement>();
let stickyObserver: IntersectionObserver | null = null;

// Context menu state
const ctxMenu = ref<{ commit: CommitRecord | null; x: number; y: number }>({
  commit: null,
  x: 0,
  y: 0,
});

function openContextMenu(event: MouseEvent, commit: CommitRecord) {
  ctxMenu.value = { commit, x: event.clientX, y: event.clientY };
}

function closeContextMenu() {
  ctxMenu.value = { commit: null, x: 0, y: 0 };
}

function registerSentinel(el: HTMLElement | null, idx: number) {
  if (!el) {
    sentinelMap.delete(idx);
    return;
  }
  sentinelMap.set(idx, el);
  if (stickyObserver) stickyObserver.observe(el);
}
let copiedTimeout: ReturnType<typeof setTimeout> | null = null;

function copyHash(hash: string) {
  navigator.clipboard.writeText(hash);
  copiedHash.value = hash;
  closeContextMenu();
  if (copiedTimeout) clearTimeout(copiedTimeout);
  copiedTimeout = setTimeout(() => {
    copiedHash.value = null;
  }, 2000);
  toast({
    title: "Commit hash copied",
    description: hash.slice(0, 7),
    duration: 3000,
  });
}

const PAGE_SIZE = 20;
let currentOffset = 0;
let hasMore = true;

// Cleanup functions for IPC listeners
let cleanupProgress: (() => void) | null = null;
let cleanupComplete: (() => void) | null = null;

onMounted(() => {
  // Set up IntersectionObserver for sticky date labels
  stickyObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const idx = [...sentinelMap.entries()].find(
          ([, el]) => el === entry.target,
        )?.[0];
        if (idx === undefined) continue;
        if (!entry.isIntersecting) {
          stuckLabels.value.add(idx);
        } else {
          stuckLabels.value.delete(idx);
        }
        stuckLabels.value = new Set(stuckLabels.value);
      }
    },
    { threshold: 0 },
  );
  for (const el of sentinelMap.values()) {
    stickyObserver.observe(el);
  }

  // Listen for scan progress
  cleanupProgress = window.api.commits.onScanProgress((data) => {
    if (
      currentRepository.value &&
      data.repositoryId === currentRepository.value.id
    ) {
      isScanning.value = true;
      scanProgress.value = { scanned: data.scanned, total: data.total };
    }
  });

  // Listen for scan completion
  cleanupComplete = window.api.commits.onScanComplete((data) => {
    if (
      currentRepository.value &&
      data.repositoryId === currentRepository.value.id
    ) {
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

  // Attach Lenis scroll listener (nextTick ensures v-lenis directive has mounted)
  nextTick(() => setupLenisListener());
});

// Re-attach Lenis listener when commit list appears (v-if becomes true)
watch(
  () => commits.value.length,
  (len, oldLen) => {
    if (len > 0 && oldLen === 0) {
      nextTick(() => setupLenisListener());
    }
  },
);

onUnmounted(() => {
  cleanupProgress?.();
  cleanupComplete?.();
  stickyObserver?.disconnect();
  stickyObserver = null;
});

// Watch for repository changes
watch(
  () => currentRepository.value?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      resetState();
      loadCommits(true);
    }
  },
);

function resetState() {
  commits.value = [];
  totalCommits.value = 0;
  selectedCommit.value = null;
  commitFiles.value = [];
  selectedFile.value = null;
  fileDiff.value = "";
  tagMap.value = {};
  currentOffset = 0;
  hasMore = true;
  searchQuery.value = "";
}

// Search commits with debounce
watch(searchQuery, (query) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    if (query.trim()) {
      performSearch(true);
    } else {
      loadCommits(true);
    }
  }, 300);
});

async function performSearch(reset = false) {
  if (!currentRepository.value) return;
  const query = searchQuery.value.trim();
  if (!query) return;

  if (reset) {
    currentOffset = 0;
    hasMore = true;
  }

  if (!hasMore && !reset) return;

  isSearching.value = true;
  if (!reset) isLoadingMore.value = true;

  try {
    const result = await window.api.commits.search(
      currentRepository.value.id,
      query,
      currentOffset,
      PAGE_SIZE,
    );

    if (result.success && result.data) {
      if (reset) {
        commits.value = result.data.commits;
      } else {
        commits.value.push(...result.data.commits);
      }
      currentOffset += result.data.commits.length;
      hasMore = result.data.commits.length === PAGE_SIZE;
      totalCommits.value = result.data.total;

      fetchAvatars(result.data.commits);

      nextTick(() => {
        if (commitListRef.value) {
          getLenisInstance(commitListRef.value)?.resize();
        }
      });
    }
  } catch (error) {
    console.error("Failed to search commits:", error);
  } finally {
    isSearching.value = false;
    isLoadingMore.value = false;
  }
}

function clearSearch() {
  searchQuery.value = "";
  searchInputRef.value?.focus();
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
      window.api.commits.list(
        currentRepository.value.id,
        currentOffset,
        PAGE_SIZE,
      ),
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

      // Recalculate Lenis dimensions after DOM updates
      nextTick(() => {
        if (commitListRef.value) {
          getLenisInstance(commitListRef.value)?.resize();
        }
      });
    }

    if (countResult?.success) {
      totalCommits.value = countResult.data;
    }

    // Auto-select latest commit on initial load
    if (isInitialLoad && !selectedCommit.value && commits.value.length > 0) {
      selectCommit(commits.value[0]);
    }

    // Fetch tags on initial load
    if (isInitialLoad && currentRepository.value) {
      window.api.git
        .getTags(currentRepository.value.path)
        .then((res: any) => {
          if (res.success && res.data) {
            tagMap.value = res.data;
          }
        })
        .catch(console.error);
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
      commit.hash,
    );
    if (result.success && result.data) {
      commitFiles.value = result.data;
      // Auto-select first file to show its diff immediately
      if (result.data.length > 0) {
        selectFile(result.data[0]);
      }
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
      file.file,
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
      currentRepository.value.path,
    );
  } catch (error) {
    console.error("Failed to rescan:", error);
    isScanning.value = false;
  }
}

function handleLenisScroll(lenis: any) {
  // Dismiss tooltips while scrolling
  isScrolling.value = true;
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false;
  }, 150);

  // Close context menu on scroll
  closeContextMenu();

  // Load more when scrolled near bottom
  const remaining = lenis.limit - lenis.animatedScroll;
  if (remaining < 200 && hasMore && !isLoadingMore.value) {
    if (searchQuery.value.trim()) {
      performSearch(false);
    } else {
      loadCommits(false);
    }
  }
}

function setupLenisListener() {
  if (!commitListRef.value) return;
  const lenis = getLenisInstance(commitListRef.value);
  if (lenis) {
    lenis.on("scroll", handleLenisScroll);
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

function getDateLabel(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const commitDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (today.getTime() - commitDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// Pre-computed date commit counts to avoid O(n²) per-render
const dateCommitCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const c of commits.value) {
    const label = getDateLabel(c.date);
    counts[label] = (counts[label] || 0) + 1;
  }
  return counts;
});

function getDateCommitCount(dateLabel: string): number {
  return dateCommitCounts.value[dateLabel] || 0;
}

function getDaysAgo(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const commitDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (today.getTime() - commitDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
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
  const authors: Author[] = [
    { name: commit.authorName, email: commit.authorEmail },
  ];
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

function getAvatarAuthors(commit: CommitRecord): AvatarAuthor[] {
  return getAuthors(commit).map((a) => ({
    name: a.name,
    email: a.email,
    imageUrl: avatarMap.value[a.email.toLowerCase()] ?? null,
  }));
}
</script>
