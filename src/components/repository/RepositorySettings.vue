<template>
  <div v-if="currentRepository" class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <!-- Repository Info -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Repository Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-[100px_1fr] items-center gap-2">
            <Label class="text-muted-foreground">Name</Label>
            <div class="text-sm">{{ currentRepository.name }}</div>
          </div>

          <div class="grid grid-cols-[100px_1fr] items-center gap-2">
            <Label class="text-muted-foreground">Path</Label>
            <div class="flex items-center gap-2">
              <div class="text-sm truncate">{{ currentRepository.path }}</div>
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6 shrink-0"
                @click="openInExplorer"
                title="Open in file explorer"
              >
                <FolderOpen class="w-3.5 h-3.5" :stroke-width="1" />
              </Button>
            </div>
          </div>

          <div class="grid grid-cols-[100px_1fr] items-center gap-2">
            <Label class="text-muted-foreground">Branch</Label>
            <div class="text-sm">{{ currentRepository.currentBranch || "None" }}</div>
          </div>

          <div v-if="remoteUrl" class="grid grid-cols-[100px_1fr] items-center gap-2">
            <Label class="text-muted-foreground">Remote</Label>
            <div class="flex items-center gap-2">
              <div class="text-sm truncate">{{ remoteUrl }}</div>
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6 shrink-0"
                @click="copyRemoteUrl"
                title="Copy remote URL"
              >
                <Copy class="w-3.5 h-3.5" :stroke-width="1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Branch Settings -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Branch Settings</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <Label>Default Branch</Label>
              <p class="text-sm text-muted-foreground">
                The branch used for pull requests and comparisons
              </p>
            </div>
            <Select v-model="defaultBranch">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="branch in branches"
                  :key="branch"
                  :value="branch"
                >
                  {{ branch }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <!-- Git Configuration -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Git Configuration</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label htmlFor="git-name">User Name</Label>
              <Input
                id="git-name"
                v-model="gitConfig.name"
                placeholder="Your Name"
              />
            </div>
            <div class="space-y-2">
              <Label htmlFor="git-email">User Email</Label>
              <Input
                id="git-email"
                v-model="gitConfig.email"
                type="email"
                placeholder="your.email@example.com"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            @click="updateGitConfig"
            :disabled="!gitConfigChanged"
          >
            Update Git Config
          </Button>
        </CardContent>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Favorite</Label>
              <p class="text-sm text-muted-foreground">
                Mark this repository as a favorite
              </p>
            </div>
            <Switch v-model="isFavorite" @update:model-value="toggleFavorite" />
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Open in Terminal</Label>
              <p class="text-sm text-muted-foreground">
                Open terminal in repository directory
              </p>
            </div>
            <Button variant="outline" size="sm" @click="openInTerminal">
              <Terminal class="w-4 h-4 mr-2" :stroke-width="1" />
              Open
            </Button>
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Open in Editor</Label>
              <p class="text-sm text-muted-foreground">
                Open in external code editor
              </p>
            </div>
            <Button variant="outline" size="sm" @click="openInEditor">
              <FileCode class="w-4 h-4 mr-2" :stroke-width="1" />
              Open
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Danger Zone -->
      <Card class="border-destructive/50">
        <CardHeader>
          <CardTitle class="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Remove Repository</Label>
              <p class="text-sm text-muted-foreground">
                Remove from app (files remain on disk)
              </p>
            </div>
            <Button variant="destructive" size="sm" @click="confirmRemove">
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Confirmation Dialog -->
    <AlertDialog v-model:open="showRemoveConfirm">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Repository?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove "{{ currentRepository?.name }}" from
            GitHub Desktop Plus? This action will not delete the repository from
            your disk.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="removeRepository"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import Switch from "@/components/ui/Switch.vue";
import Separator from "@/components/ui/Separator.vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Copy, Terminal, FileCode } from "lucide-vue-next";
import { useRepositoriesStore } from "@/shared/stores";

const repositoriesStore = useRepositoriesStore();

const currentRepository = computed(() => repositoriesStore.currentRepository);
const branches = computed(() => repositoriesStore.branches?.local || []);
const remoteUrl = ref<string>("");
const isFavorite = ref(false);
const showRemoveConfirm = ref(false);
const defaultBranch = ref<string>("");

const gitConfig = ref({
  name: "",
  email: "",
});

const originalGitConfig = ref({
  name: "",
  email: "",
});

const gitConfigChanged = computed(() => {
  return (
    gitConfig.value.name !== originalGitConfig.value.name ||
    gitConfig.value.email !== originalGitConfig.value.email
  );
});

// Load git config when repository changes
watch(
  currentRepository,
  async (newRepo) => {
    if (newRepo) {
      isFavorite.value = newRepo.isFavorite;

      // Get remote URL
      try {
        remoteUrl.value =
          (await window.api.git.getRemoteUrl?.(newRepo.path)) || "";
      } catch {
        remoteUrl.value = "";
      }

      // TODO: Get git config for this repository
      // For now, use global git config
      gitConfig.value = { name: "", email: "" };
      originalGitConfig.value = { ...gitConfig.value };
    }
  },
  { immediate: true },
);

const openInExplorer = async () => {
  if (currentRepository.value) {
    await window.api.shell?.openPath(currentRepository.value.path);
  }
};

const copyRemoteUrl = async () => {
  if (remoteUrl.value) {
    await navigator.clipboard.writeText(remoteUrl.value);
  }
};

const updateGitConfig = async () => {
  if (currentRepository.value) {
    // TODO: Update git config for this repository
    console.log("Update git config:", gitConfig.value);
    originalGitConfig.value = { ...gitConfig.value };
  }
};

const toggleFavorite = async () => {
  if (currentRepository.value) {
    await repositoriesStore.toggleFavorite(currentRepository.value.id);
  }
};

const openInTerminal = async () => {
  if (currentRepository.value) {
    // TODO: Open terminal in repository directory
    console.log("Open terminal in:", currentRepository.value.path);
  }
};

const openInEditor = async () => {
  if (currentRepository.value) {
    // TODO: Open in external editor
    console.log("Open in editor:", currentRepository.value.path);
  }
};

const confirmRemove = () => {
  showRemoveConfirm.value = true;
};

const removeRepository = async () => {
  if (currentRepository.value) {
    await repositoriesStore.removeRepository(currentRepository.value.id);
    showRemoveConfirm.value = false;
  }
};
</script>
