<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="w-[200px] justify-between">
        <span class="truncate">{{ currentBranch || "No branch" }}</span>
        <ChevronDown
          class="ml-2 h-4 w-4 shrink-0 opacity-50"
          :stroke-width="1"
        />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <div
        class="max-h-[300px] overflow-y-auto bg-white dark:bg-card mt-1 rounded-md shadow-md dark:shadow-lg border border-border"
      >
        <div class="p-2">
          <input
            v-model="searchQuery"
            placeholder="Find a branch..."
            class="w-full px-2 py-1 text-sm border rounded bg-background text-foreground border-border placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div class="border-t border-border">
          <button
            v-for="branch in filteredBranches"
            :key="branch"
            @click="switchBranch(branch)"
            :class="[
              'w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center justify-between',
              branch === currentBranch ? 'bg-accent' : '',
            ]"
          >
            <span class="truncate">{{ branch }}</span>
            <Check
              v-if="branch === currentBranch"
              class="w-4 h-4 shrink-0"
              :stroke-width="1"
            />
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>

  <!-- Uncommitted Changes Dialog -->
  <AlertDialog v-model:open="showErrorDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-yellow-500" />
          Uncommitted Changes
        </AlertDialogTitle>
        <AlertDialogDescription class="text-left space-y-3">
          <p>You have uncommitted changes that would be overwritten by switching branches.</p>
          <p class="text-sm text-muted-foreground">
            Would you like to stash your changes and switch to <strong>{{ pendingBranch }}</strong>?
          </p>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction @click="stashAndSwitch">
          Stash & Switch
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ChevronDown, Check, AlertTriangle } from "lucide-vue-next";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import Button from "../ui/Button.vue";
import { useRepositoryStore } from "../../stores/repository.store";

const repositoryStore = useRepositoryStore();
const searchQuery = ref("");
const branches = ref<string[]>([]);
const currentBranch = ref<string>("");
const showErrorDialog = ref(false);
const pendingBranch = ref<string>("");

const currentRepository = computed(() => repositoryStore.currentRepository);

const filteredBranches = computed(() => {
  if (!searchQuery.value) return branches.value;
  return branches.value.filter((branch) =>
    branch.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const loadBranches = async () => {
  if (!currentRepository.value) return;

  try {
    const result = await window.api.git.getBranches(
      currentRepository.value.path
    );
    branches.value = result.local;
    currentBranch.value = result.current;
  } catch (error) {
    console.error("Failed to load branches:", error);
  }
};

const switchBranch = async (branch: string) => {
  if (!currentRepository.value || branch === currentBranch.value) return;

  try {
    await window.api.git.checkout(currentRepository.value.path, branch);
    currentBranch.value = branch;
    await repositoryStore.fetchGitStatus();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if error is due to uncommitted changes
    if (errorMessage.includes("overwritten by checkout") ||
        errorMessage.includes("commit your changes") ||
        errorMessage.includes("stash them")) {
      pendingBranch.value = branch;
      showErrorDialog.value = true;
    } else {
      console.error("Failed to switch branch:", error);
    }
  }
};

const stashAndSwitch = async () => {
  if (!currentRepository.value || !pendingBranch.value) return;

  try {
    // Stash current changes
    await window.api.git.stash(currentRepository.value.path, `Auto-stash before switching to ${pendingBranch.value}`);

    // Switch to the target branch
    await window.api.git.checkout(currentRepository.value.path, pendingBranch.value);
    currentBranch.value = pendingBranch.value;

    // Clear pending branch and refresh status
    pendingBranch.value = "";
    await repositoryStore.fetchGitStatus();
  } catch (error) {
    console.error("Failed to stash and switch:", error);
  }
};

onMounted(() => {
  loadBranches();
});
</script>
