<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Open Repository</DialogTitle>
        <DialogDescription>
          Select a local Git repository to add to GitHub Desktop Plus
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Repository Path -->
        <div class="space-y-2">
          <Label htmlFor="path">Repository Path</Label>
          <div class="flex gap-2">
            <Input
              id="path"
              v-model="repositoryPath"
              placeholder="/path/to/repository"
              :disabled="isValidating"
              class="flex-1"
              @keyup.enter="validateAndOpen"
            />
            <Button
              variant="outline"
              size="sm"
              @click="browseForRepository"
              :disabled="isValidating"
            >
              Browse
            </Button>
          </div>
          <p
            v-if="validationResult && !validationResult.isValid"
            class="text-sm text-destructive"
          >
            {{ validationResult.error }}
          </p>
          <p
            v-else-if="validationResult && validationResult.isValid"
            class="text-sm text-green-600 dark:text-green-400"
          >
            ✓ Valid Git repository
            <span
              v-if="validationResult.hasRemote"
              class="text-muted-foreground"
            >
              (has remote)
            </span>
          </p>
        </div>

        <!-- Repository Info (if valid) -->
        <div v-if="repositoryInfo" class="space-y-2 p-2 bg-muted rounded-lg">
          <div class="flex items-center gap-2">
            <GitBranch
              class="w-4 h-4 text-muted-foreground"
              :stroke-width="1"
            />
            <span class="text-sm font-medium">{{ repositoryInfo.name }}</span>
          </div>
          <div
            v-if="repositoryInfo.currentBranch"
            class="flex items-center gap-2"
          >
            <div class="w-4 h-4" />
            <!-- Spacer -->
            <span class="text-sm text-muted-foreground">
              Branch: {{ repositoryInfo.currentBranch }}
            </span>
          </div>
          <div v-if="repositoryInfo.remoteUrl" class="flex items-center gap-2">
            <div class="w-4 h-4" />
            <!-- Spacer -->
            <span class="text-sm text-muted-foreground truncate">
              Remote: {{ repositoryInfo.remoteUrl }}
            </span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close"> Cancel </Button>
        <Button @click="openRepository" :disabled="!canOpen || isValidating">
          {{ isValidating ? "Validating..." : "Open Repository" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import { GitBranch } from "lucide-vue-next";
import { useRepositoriesStore } from "@/shared/stores";
import type { RepositoryValidation } from "@/shared/types/git.types";

interface RepositoryInfo {
  name: string;
  currentBranch: string | null;
  remoteUrl?: string;
}

const emit = defineEmits<{
  "repository-opened": [path: string];
}>();

const repositoriesStore = useRepositoriesStore();

const isOpen = ref(false);
const isValidating = ref(false);
const repositoryPath = ref("");
const validationResult = ref<RepositoryValidation | null>(null);
const repositoryInfo = ref<RepositoryInfo | null>(null);

const canOpen = computed(() => {
  return repositoryPath.value && validationResult.value?.isValid;
});

// Validate repository when path changes
let validationTimeout: NodeJS.Timeout | null = null;
watch(repositoryPath, (newPath) => {
  // Clear previous validation
  validationResult.value = null;
  repositoryInfo.value = null;

  // Clear timeout if exists
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }

  // Don't validate empty paths
  if (!newPath) return;

  // Debounce validation
  validationTimeout = setTimeout(() => {
    validateRepository(newPath);
  }, 500);
});

const validateRepository = async (path: string) => {
  if (!path) return;

  isValidating.value = true;
  try {
    // Validate repository
    const validation = await window.api.git.validate(path);
    validationResult.value = validation;

    // If valid, get repository info
    if (validation.isValid) {
      const result = await window.api.git.openRepository(path);
      if (result.success) {
        repositoryInfo.value = {
          name: result.name,
          currentBranch: result.currentBranch,
          remoteUrl: result.remoteUrl,
        };
      }
    }
  } catch (error) {
    validationResult.value = {
      isValid: false,
      isGitRepository: false,
      hasRemote: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  } finally {
    isValidating.value = false;
  }
};

const browseForRepository = async () => {
  const result = await window.api.dialog.openDirectory();
  if (result) {
    repositoryPath.value = result;
  }
};

const validateAndOpen = () => {
  if (canOpen.value) {
    openRepository();
  }
};

const openRepository = async () => {
  if (!canOpen.value) return;

  try {
    await repositoriesStore.addRepository(repositoryPath.value);
    emit("repository-opened", repositoryPath.value);
    close();
  } catch (error) {
    // Show error in validation result
    validationResult.value = {
      isValid: false,
      isGitRepository: false,
      hasRemote: false,
      error:
        error instanceof Error ? error.message : "Failed to add repository",
    };
  }
};

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  // Reset state after dialog closes
  setTimeout(() => {
    repositoryPath.value = "";
    validationResult.value = null;
    repositoryInfo.value = null;
    isValidating.value = false;
  }, 300);
};

// Clean up on unmount
const cleanup = () => {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }
};

defineExpose({
  open,
  close,
});

// Lifecycle
import { onUnmounted } from "vue";
onUnmounted(cleanup);
</script>
