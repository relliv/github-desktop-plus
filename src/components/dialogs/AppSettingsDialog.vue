<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="flex h-[80vh] max-w-4xl flex-col p-0">
      <DialogHeader class="shrink-0 border-b px-6 py-4">
        <DialogTitle>Settings</DialogTitle>
      </DialogHeader>

      <div class="flex flex-1 overflow-hidden">
        <!-- Settings Navigation -->
        <nav class="w-48 shrink-0 space-y-1 border-r p-3">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="activeCategory = category.id"
            :class="[
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
              activeCategory === category.id
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50',
            ]"
          >
            <component :is="category.icon" class="h-4 w-4" :stroke-width="1" />
            {{ category.label }}
          </button>
        </nav>

        <!-- Settings Panel -->
        <div class="flex-1 overflow-y-auto p-6" v-lenis>
          <!-- General Settings -->
          <div v-if="activeCategory === 'general'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">General Settings</CardTitle>
                <CardDescription> Configure general application preferences </CardDescription>
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
                    <p class="text-muted-foreground text-sm">
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
                <CardDescription> Configure Git user information and preferences </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label htmlFor="git-name">Name</Label>
                    <Input id="git-name" v-model="gitName" placeholder="Your Name" />
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
              <CardHeader class="pb-4">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div
                      class="bg-primary/10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    >
                      <FileText class="text-primary h-4 w-4" :stroke-width="1.5" />
                    </div>
                    <div>
                      <CardTitle class="text-base">Detected Editors</CardTitle>
                      <CardDescription class="mt-0.5">
                        Select which editors appear in context menus
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    class="shrink-0"
                    @click="detectEditors"
                    :disabled="editorLoading"
                  >
                    <Loader2
                      v-if="editorLoading"
                      class="mr-2 h-4 w-4 animate-spin"
                      :stroke-width="1"
                    />
                    <Search v-else class="mr-2 h-4 w-4" :stroke-width="1" />
                    Discover Editors
                  </Button>
                </div>
              </CardHeader>
              <CardContent class="pt-0">
                <!-- Loading state -->
                <div
                  v-if="editorLoading && availableEditors.length === 0"
                  class="text-muted-foreground flex flex-col items-center justify-center py-12"
                >
                  <Loader2 class="mb-3 h-6 w-6 animate-spin" :stroke-width="1" />
                  <span class="text-sm">Scanning for editors…</span>
                </div>

                <!-- Empty state -->
                <div
                  v-else-if="availableEditors.length === 0"
                  class="text-muted-foreground flex flex-col items-center justify-center py-12"
                >
                  <Search class="mb-3 h-8 w-8 opacity-40" :stroke-width="1" />
                  <span class="text-sm font-medium">No editors detected</span>
                  <span class="mt-1 text-xs">Click "Discover Editors" to scan your system</span>
                </div>

                <!-- Editor list -->
                <div v-else class="divide-y rounded-lg border">
                  <label
                    v-for="editor in availableEditors"
                    :key="editor.id"
                    class="hover:bg-accent/50 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    :class="{ 'bg-accent/30': settingsStore.isEditorSelected(editor.id) }"
                  >
                    <Checkbox
                      :model-value="settingsStore.isEditorSelected(editor.id)"
                      @update:model-value="settingsStore.toggleEditor(editor.id)"
                    />
                    <div
                      class="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    >
                      <img :src="getEditorIconUrl(editor)" :alt="editor.name" class="h-4 w-4" />
                    </div>
                    <div class="flex min-w-0 flex-col">
                      <span class="text-sm leading-tight font-medium">{{ editor.name }}</span>
                      <span class="text-muted-foreground truncate text-xs">{{
                        editor.executable
                      }}</span>
                    </div>
                    <Badge
                      v-if="defaultEditor?.id === editor.id"
                      variant="secondary"
                      class="ml-auto shrink-0"
                    >
                      Default
                    </Badge>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Terminal Settings -->
          <div v-if="activeCategory === 'terminal'" class="space-y-6">
            <Card>
              <CardHeader class="pb-4">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div
                      class="bg-primary/10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    >
                      <TerminalIcon class="text-primary h-4 w-4" :stroke-width="1.5" />
                    </div>
                    <div>
                      <CardTitle class="text-base">Detected Terminals</CardTitle>
                      <CardDescription class="mt-0.5">
                        Select which terminals appear in the "Open in Terminal" menu
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    class="shrink-0"
                    @click="detectTerminals"
                    :disabled="terminalLoading"
                  >
                    <Loader2
                      v-if="terminalLoading"
                      class="mr-2 h-4 w-4 animate-spin"
                      :stroke-width="1"
                    />
                    <Search v-else class="mr-2 h-4 w-4" :stroke-width="1" />
                    Discover Terminals
                  </Button>
                </div>
              </CardHeader>
              <CardContent class="pt-0">
                <div
                  v-if="terminalLoading && availableTerminals.length === 0"
                  class="text-muted-foreground flex flex-col items-center justify-center py-12"
                >
                  <Loader2 class="mb-3 h-6 w-6 animate-spin" :stroke-width="1" />
                  <span class="text-sm">Scanning for terminals…</span>
                </div>

                <div
                  v-else-if="availableTerminals.length === 0"
                  class="text-muted-foreground flex flex-col items-center justify-center py-12"
                >
                  <Search class="mb-3 h-8 w-8 opacity-40" :stroke-width="1" />
                  <span class="text-sm font-medium">No terminals detected</span>
                  <span class="mt-1 text-xs">Click "Discover Terminals" to scan your system</span>
                </div>

                <div v-else class="divide-y rounded-lg border">
                  <label
                    v-for="terminal in availableTerminals"
                    :key="terminal.id"
                    class="hover:bg-accent/50 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    :class="{ 'bg-accent/30': settingsStore.isTerminalSelected(terminal.id) }"
                  >
                    <Checkbox
                      :model-value="settingsStore.isTerminalSelected(terminal.id)"
                      @update:model-value="settingsStore.toggleTerminal(terminal.id)"
                    />
                    <div
                      class="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    >
                      <img
                        :src="getTerminalIconUrl(terminal)"
                        :alt="terminal.name"
                        class="h-4 w-4"
                      />
                    </div>
                    <div class="flex min-w-0 flex-1 flex-col">
                      <span class="text-sm leading-tight font-medium">{{ terminal.name }}</span>
                      <span class="text-muted-foreground truncate text-xs">{{
                        terminal.executable
                      }}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="shrink-0"
                      @click.prevent="testTerminal(terminal)"
                    >
                      Test
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Advanced Settings -->
          <div v-if="activeCategory === 'advanced'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">Advanced Settings</CardTitle>
                <CardDescription> Configure advanced Git and application settings </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Enable GPG signing</Label>
                    <p class="text-muted-foreground text-sm">Sign commits with GPG key</p>
                  </div>
                  <Switch v-model="gpgSign" />
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Verbose commit messages</Label>
                    <p class="text-muted-foreground text-sm">Show diff in commit message editor</p>
                  </div>
                  <Switch v-model="verboseCommit" />
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Auto-fetch</Label>
                    <p class="text-muted-foreground text-sm">Automatically fetch from remotes</p>
                  </div>
                  <Switch v-model="autoFetch" />
                </div>

                <div v-if="autoFetch" class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Check interval</Label>
                    <p class="text-muted-foreground text-sm">
                      How often to check for changes (in minutes)
                    </p>
                  </div>
                  <Input
                    v-model.number="autoFetchInterval"
                    type="number"
                    :min="1"
                    :max="60"
                    class="w-20 text-center"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- About -->
          <div v-if="activeCategory === 'about'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle class="text-base"> About GitHub Desktop Plus </CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center gap-4">
                  <GitBranch class="text-primary h-12 w-12" :stroke-width="1" />
                  <div>
                    <h2 class="text-lg font-semibold">GitHub Desktop Plus</h2>
                    <p class="text-muted-foreground text-sm">Version 1.0.0</p>
                  </div>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-sm">A powerful Git client built with Electron and Vue 3</p>
                  <p class="text-muted-foreground text-sm">
                    2025 GitHub Desktop Plus. All rights reserved.
                  </p>
                </div>

                <div class="flex gap-2">
                  <Button variant="outline" size="sm" @click="openGithub">
                    <Github class="mr-2 h-4 w-4" :stroke-width="1" />
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
import { ref, computed, watch } from 'vue'
import {
  SettingsIcon,
  GitBranch,
  FileText,
  Wrench,
  Info,
  Github,
  Loader2,
  Search,
  Terminal as TerminalIcon,
} from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Label from '@/components/ui/Label.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Switch from '@/components/ui/Switch.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Separator from '@/components/ui/Separator.vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useAppStore, type Theme } from '@/stores/app.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useEditor } from '@/composables/useEditor'
import { useTerminal } from '@/composables/useTerminal'

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const { defaultEditor, loading: editorLoading, detectEditors, getEditorIconUrl } = useEditor()
const availableEditors = computed(() => settingsStore.discoveredEditors)
const {
  loading: terminalLoading,
  detectTerminals,
  getTerminalIconUrl,
  openInTerminal,
} = useTerminal()
const availableTerminals = computed(() => settingsStore.discoveredTerminals)

const isOpen = ref(false)

const categories = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'git', label: 'Git', icon: GitBranch },
  { id: 'editor', label: 'Editor', icon: FileText },
  { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
  { id: 'advanced', label: 'Advanced', icon: Wrench },
  { id: 'about', label: 'About', icon: Info },
]

const themes = [
  { value: 'light' as Theme, label: 'Light' },
  { value: 'dark' as Theme, label: 'Dark' },
  { value: 'system' as Theme, label: 'System' },
]

const activeCategory = ref('general')

// General settings
const theme = computed<Theme>({
  get: () => appStore.theme,
  set: (value: Theme) => appStore.setTheme(value),
})
const language = ref('en')
const autoLaunch = ref(false)

// Git settings
const gitName = ref('')
const gitEmail = ref('')
const defaultBranch = ref('main')
const mergeStrategy = ref('merge')

// Editor settings
const editorsScanned = ref(false)
const terminalsScanned = ref(false)

// Auto-scan editors / terminals the first time their tab is shown
watch(activeCategory, (val) => {
  if (val === 'editor' && !editorsScanned.value) {
    editorsScanned.value = true
    if (availableEditors.value.length === 0) {
      detectEditors()
    }
  }
  if (val === 'terminal' && !terminalsScanned.value) {
    terminalsScanned.value = true
    if (availableTerminals.value.length === 0) {
      detectTerminals()
    }
  }
})

const testTerminal = async (terminal: any) => {
  try {
    const home = await window.api.shell.getHomePath()
    await openInTerminal(home, terminal)
  } catch (err) {
    console.error('Failed to open terminal:', err)
  }
}

// Advanced settings
const gpgSign = ref(false)
const verboseCommit = ref(false)
const autoFetch = computed({
  get: () => settingsStore.autoFetch,
  set: (val: boolean) => settingsStore.setAutoFetch(val),
})
const autoFetchInterval = computed({
  get: () => settingsStore.autoFetchInterval,
  set: (val: number) => {
    const clamped = Math.max(1, Math.min(60, val || 5))
    settingsStore.setAutoFetchInterval(clamped)
  },
})

const open = () => {
  isOpen.value = true
  activeCategory.value = 'general'
}

const close = () => {
  isOpen.value = false
}

const openGithub = () => {
  window.open('https://github.com/yourusername/github-desktop-plus', '_blank')
}

const checkUpdates = () => {
  console.log('Checking for updates...')
}

defineExpose({
  open,
  close,
})
</script>
