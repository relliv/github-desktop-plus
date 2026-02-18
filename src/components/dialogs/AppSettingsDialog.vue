<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl h-[80vh] p-0 flex flex-col">
      <DialogHeader class="px-6 py-4 border-b shrink-0">
        <DialogTitle>Settings</DialogTitle>
      </DialogHeader>

      <div class="flex-1 flex overflow-hidden">
        <!-- Settings Navigation -->
        <nav class="w-48 border-r p-3 space-y-1 shrink-0">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="activeCategory = category.id"
            :class="[
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              activeCategory === category.id
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50',
            ]"
          >
            <component :is="category.icon" class="w-4 h-4" :stroke-width="1" />
            {{ category.label }}
          </button>
        </nav>

        <!-- Settings Panel -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- General Settings -->
          <div v-if="activeCategory === 'general'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">General Settings</CardTitle>
                <CardDescription>
                  Configure general application preferences
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="space-y-2">
                  <Label>Application Theme</Label>
                  <div class="flex gap-2">
                    <Button
                      v-for="t in themes"
                      :key="t.value"
                      :variant="theme === t.value ? 'default' : 'outline'"
                      size="sm"
                      @click="theme = t.value"
                    >
                      {{ t.label }}
                    </Button>
                  </div>
                </div>

                <div class="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select v-model="language">
                    <SelectTrigger id="language" class="w-[200px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Espanol</SelectItem>
                      <SelectItem value="fr">Francais</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Auto-launch at startup</Label>
                    <p class="text-sm text-muted-foreground">
                      Start GitHub Desktop Plus when system starts
                    </p>
                  </div>
                  <Switch v-model="autoLaunch" />
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Git Settings -->
          <div v-if="activeCategory === 'git'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">Git Configuration</CardTitle>
                <CardDescription>
                  Configure Git user information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label htmlFor="git-name">Name</Label>
                    <Input
                      id="git-name"
                      v-model="gitName"
                      placeholder="Your Name"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label htmlFor="git-email">Email</Label>
                    <Input
                      id="git-email"
                      v-model="gitEmail"
                      type="email"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label htmlFor="default-branch">Default Branch Name</Label>
                  <Input
                    id="default-branch"
                    v-model="defaultBranch"
                    placeholder="main"
                    class="w-[200px]"
                  />
                </div>

                <Separator />

                <div class="space-y-2">
                  <Label>Merge Strategy</Label>
                  <Select v-model="mergeStrategy">
                    <SelectTrigger class="w-[250px]">
                      <SelectValue placeholder="Select merge strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merge">Create merge commit</SelectItem>
                      <SelectItem value="squash">Squash and merge</SelectItem>
                      <SelectItem value="rebase">Rebase and merge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Editor Settings -->
          <div v-if="activeCategory === 'editor'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">External Editor</CardTitle>
                <CardDescription>
                  Configure your preferred external editor
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Open files in editor tabs</Label>
                    <p class="text-sm text-muted-foreground">
                      Open multiple files in tabs instead of new windows
                    </p>
                  </div>
                  <Switch v-model="openInTabs" />
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Wait for editor to close</Label>
                    <p class="text-sm text-muted-foreground">
                      Wait for file to be closed before continuing
                    </p>
                  </div>
                  <Switch v-model="waitForClose" />
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Advanced Settings -->
          <div v-if="activeCategory === 'advanced'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">Advanced Settings</CardTitle>
                <CardDescription>
                  Configure advanced Git and application settings
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Enable GPG signing</Label>
                    <p class="text-sm text-muted-foreground">
                      Sign commits with GPG key
                    </p>
                  </div>
                  <Switch v-model="gpgSign" />
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Verbose commit messages</Label>
                    <p class="text-sm text-muted-foreground">
                      Show diff in commit message editor
                    </p>
                  </div>
                  <Switch v-model="verboseCommit" />
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Auto-fetch</Label>
                    <p class="text-sm text-muted-foreground">
                      Automatically fetch from remotes
                    </p>
                  </div>
                  <Switch v-model="autoFetch" />
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- About -->
          <div v-if="activeCategory === 'about'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">
                  About GitHub Desktop Plus
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center gap-4">
                  <GitBranch class="w-12 h-12 text-primary" :stroke-width="1" />
                  <div>
                    <h2 class="text-lg font-semibold">GitHub Desktop Plus</h2>
                    <p class="text-sm text-muted-foreground">Version 1.0.0</p>
                  </div>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-sm">
                    A powerful Git client built with Electron and Vue 3
                  </p>
                  <p class="text-sm text-muted-foreground">
                    2025 GitHub Desktop Plus. All rights reserved.
                  </p>
                </div>

                <div class="flex gap-2">
                  <Button variant="outline" size="sm" @click="openGithub">
                    <Github class="w-4 h-4 mr-2" :stroke-width="1" />
                    GitHub
                  </Button>
                  <Button variant="outline" size="sm" @click="checkUpdates">
                    Check for Updates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  SettingsIcon,
  GitBranch,
  FileText,
  Wrench,
  Info,
  Github,
} from "lucide-vue-next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Label from "@/components/ui/Label.vue";
import Input from "@/components/ui/Input.vue";
import Button from "@/components/ui/Button.vue";
import Switch from "@/components/ui/Switch.vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Separator from "@/components/ui/Separator.vue";
import { useAppStore, type Theme } from "@/stores/app.store";

const appStore = useAppStore();

const isOpen = ref(false);

const categories = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "git", label: "Git", icon: GitBranch },
  { id: "editor", label: "Editor", icon: FileText },
  { id: "advanced", label: "Advanced", icon: Wrench },
  { id: "about", label: "About", icon: Info },
];

const themes = [
  { value: "light" as Theme, label: "Light" },
  { value: "dark" as Theme, label: "Dark" },
  { value: "system" as Theme, label: "System" },
];

const activeCategory = ref("general");

// General settings
const theme = computed<Theme>({
  get: () => appStore.theme,
  set: (value: Theme) => appStore.setTheme(value),
});
const language = ref("en");
const autoLaunch = ref(false);

// Git settings
const gitName = ref("");
const gitEmail = ref("");
const defaultBranch = ref("main");
const mergeStrategy = ref("merge");

// Editor settings
const openInTabs = ref(true);
const waitForClose = ref(false);

// Advanced settings
const gpgSign = ref(false);
const verboseCommit = ref(false);
const autoFetch = ref(true);

const open = () => {
  isOpen.value = true;
  activeCategory.value = "general";
};

const close = () => {
  isOpen.value = false;
};

const openGithub = () => {
  window.open("https://github.com/yourusername/github-desktop-plus", "_blank");
};

const checkUpdates = () => {
  console.log("Checking for updates...");
};

defineExpose({
  open,
  close,
});
</script>
