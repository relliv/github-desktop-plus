<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div
      v-if="hasChanges"
      class="flex-1 min-h-0 flex flex-col overflow-hidden p-2 space-y-4"
    >
      <!-- Staged changes -->
      <div v-if="stagedFiles.length > 0" class="flex flex-col min-h-0 flex-1">
        <div class="shrink-0 flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">
            Staged Changes ({{ stagedFiles.length }})
          </h3>
          <Button variant="ghost" size="sm" @click="unstageAll">
            Unstage all
          </Button>
        </div>
        <div class="flex-1 min-h-0 space-y-0.5 overflow-y-auto" v-lenis>
          <FileItem
            v-for="file in stagedFiles"
            :key="file"
            :file="file"
            :staged="true"
            :status="getFileStatus(file)"
            @click="selectFile(file, true)"
            @unstage="unstageFile(file)"
          />
        </div>
      </div>

      <!-- Unstaged changes -->
      <div v-if="unstagedEntries.length > 0" class="flex flex-col min-h-0 flex-1">
        <div class="shrink-0 flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium">
            Changes ({{ unstagedEntries.length }})
          </h3>
          <Button variant="ghost" size="sm" @click="stageAll">
            Stage all
          </Button>
        </div>
        <div class="flex-1 min-h-0 space-y-1 overflow-y-auto" v-lenis>
          <FileItem
            v-for="entry in unstagedEntries"
            :key="entry.path"
            :file="entry.path"
            :staged="false"
            :status="entry.status"
            @click="selectFile(entry.path)"
            @stage="stageFile(entry.path)"
          />
        </div>
      </div>
    </div>

    <!-- No changes -->
    <div v-else class="flex items-center justify-center h-full">
      <div class="text-center">
        <FileText
          class="w-12 h-12 mx-auto mb-3 text-muted-foreground"
          :stroke-width="1"
        />
        <p class="text-sm text-muted-foreground">No changes in repository</p>
      </div>
    </div>

    <!-- Commit section -->
    <div v-if="hasChanges" class="shrink-0 border-t p-3 space-y-2">
      <textarea
        v-model="commitMessage"
        placeholder="Summary (required)"
        class="w-full px-3 py-2 text-sm border rounded-md resize-none bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        rows="1"
      />
      <textarea
        v-model="commitDescription"
        placeholder="Description"
        class="w-full px-3 py-2 text-sm border rounded-md resize-none bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        rows="2"
      />
      <Button
        @click="commit"
        :disabled="!commitMessage.trim() || stagedFiles.length === 0"
        class="w-full"
        size="sm"
      >
        <GitCommit class="w-4 h-4 mr-2" :stroke-width="1.5" />
        Commit Changes
      </Button>
      <p v-if="stagedFiles.length === 0" class="text-xs text-muted-foreground text-center">
        Stage changes to commit
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { FileText, GitCommit } from "lucide-vue-next";
import { useRepositoriesStore } from "@/shared/stores";
import Button from "../ui/Button.vue";
import FileItem from "./FileItem.vue";

const repositoriesStore = useRepositoriesStore();
const commitMessage = ref("");
const commitDescription = ref("");
export type FileStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'conflicted'

export interface FileEntry {
  path: string
  status: FileStatus
}

const emit = defineEmits<{
  fileSelected: [file: string, staged: boolean, status: FileStatus];
}>();

const selectedFile = ref<string | null>(null);

const gitStatus = computed(() => repositoriesStore.gitStatus);
const currentRepository = computed(() => repositoriesStore.currentRepository);
const hasChanges = computed(() => repositoriesStore.hasChanges);

const stagedFiles = computed(() => gitStatus.value?.staged || []);

const unstagedEntries = computed<FileEntry[]>(() => {
  if (!gitStatus.value) return [];
  const staged = new Set(stagedFiles.value);
  const entries: FileEntry[] = [];
  for (const f of gitStatus.value.modified) {
    if (!staged.has(f)) entries.push({ path: f, status: 'modified' });
  }
  for (const f of gitStatus.value.added) {
    if (!staged.has(f)) entries.push({ path: f, status: 'added' });
  }
  for (const f of gitStatus.value.deleted) {
    if (!staged.has(f)) entries.push({ path: f, status: 'deleted' });
  }
  return entries;
});

const unstagedFiles = computed(() => unstagedEntries.value.map(e => e.path));

const getFileStatus = (file: string): FileStatus => {
  if (!gitStatus.value) return 'modified';
  if (gitStatus.value.added.includes(file)) return 'added';
  if (gitStatus.value.deleted.includes(file)) return 'deleted';
  if (gitStatus.value.conflicted.includes(file)) return 'conflicted';
  return 'modified';
};

const selectFile = (file: string, staged: boolean = false) => {
  selectedFile.value = file;
  emit("fileSelected", file, staged, getFileStatus(file));
};

const stageFile = async (file: string) => {
  if (!currentRepository.value) return;
  try {
    await window.api.git.stage(currentRepository.value.path, [file]);
    await repositoriesStore.fetchGitStatus();
  } catch (error) {
    console.error("Failed to stage file:", error);
  }
};

const unstageFile = async (file: string) => {
  if (!currentRepository.value) return;
  try {
    await window.api.git.unstage(currentRepository.value.path, [file]);
    await repositoriesStore.fetchGitStatus();
  } catch (error) {
    console.error("Failed to unstage file:", error);
  }
};

const stageAll = async () => {
  if (!currentRepository.value) return;
  try {
    // Convert reactive array to plain array for IPC serialization
    await window.api.git.stage(currentRepository.value.path, [
      ...unstagedFiles.value,
    ]);
    await repositoriesStore.fetchGitStatus();
  } catch (error) {
    console.error("Failed to stage all:", error);
  }
};

const unstageAll = async () => {
  if (!currentRepository.value) return;
  try {
    // Convert reactive array to plain array for IPC serialization
    await window.api.git.unstage(currentRepository.value.path, [
      ...stagedFiles.value,
    ]);
    await repositoriesStore.fetchGitStatus();
  } catch (error) {
    console.error("Failed to unstage all:", error);
  }
};

const commit = async () => {
  if (!currentRepository.value || !commitMessage.value.trim()) return;

  try {
    // Combine summary and description with blank line separator
    const fullMessage = commitDescription.value.trim()
      ? `${commitMessage.value.trim()}\n\n${commitDescription.value.trim()}`
      : commitMessage.value.trim();

    await window.api.git.commit(currentRepository.value.path, fullMessage);
    commitMessage.value = "";
    commitDescription.value = "";
    await repositoriesStore.fetchGitStatus();
  } catch (error) {
    console.error("Failed to commit:", error);
  }
};
</script>
