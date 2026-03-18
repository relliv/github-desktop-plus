<template>
  <div class="flex-1 min-h-0 overflow-hidden">
    <div v-if="isLoading" class="flex items-center justify-center h-full">
      <span class="text-xs text-muted-foreground">Loading diff...</span>
    </div>

    <div v-else-if="diff" class="h-full overflow-auto" v-lenis>
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

    <div v-else class="flex items-center justify-center h-full">
      <div class="text-center">
        <FileDiff
          class="w-8 h-8 mx-auto mb-3 text-muted-foreground"
          :stroke-width="1"
        />
        <p class="text-sm text-muted-foreground">
          Select a file to view changes
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { FileDiff } from "lucide-vue-next";
import { DiffViewer as NxDiffViewer } from "@ngeenx/nx-vue-code-viewer";
import { useCodeViewerTheme } from "@/composables/useCodeViewerTheme";
import { useRepositoriesStore } from "@/shared/stores";

const props = defineProps<{
  selectedFile?: string | null;
  isStaged?: boolean;
}>();

const { codeViewerTheme } = useCodeViewerTheme();
const repositoriesStore = useRepositoriesStore();

const diff = ref<string>("");
const isLoading = ref(false);

const fileExtension = computed(() => {
  if (!props.selectedFile) return undefined;
  const parts = props.selectedFile.split(".");
  return parts.length > 1 ? parts.pop() : undefined;
});

const fileLanguage = computed(() => {
  const ext = fileExtension.value;
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

const currentRepository = computed(() => repositoriesStore.currentRepository);

watch(
  () => props.selectedFile,
  async (file) => {
    diff.value = "";
    if (!file || !currentRepository.value) return;

    isLoading.value = true;
    try {
      const result = props.isStaged
        ? await window.api.git.diffStaged(currentRepository.value.path, file)
        : await window.api.git.diffFile(currentRepository.value.path, file);

      if (result.success && result.data) {
        diff.value = result.data;
      }
    } catch (error) {
      console.error("Failed to load diff:", error);
    } finally {
      isLoading.value = false;
    }
  },
);
</script>
