<template>
  <div class="flex flex-1 flex-col">
    <!-- Header -->
    <div class="flex h-[50px] items-center border-b px-6">
      <h1 class="text-lg font-semibold">Settings</h1>
    </div>

    <!-- Settings Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Settings Navigation -->
      <nav class="w-64 space-y-1 border-r p-4">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="activeCategory = category.id"
          :class="[
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
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
      <div class="flex-1 overflow-y-auto" v-lenis>
        <div class="mx-auto p-6">
          <!-- General Settings -->
          <div v-if="activeCategory === 'general'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure general application preferences</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="space-y-2">
                  <Label>Application Theme</Label>
                  <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                      <button
                        type="button"
                        @click="theme = 'light'"
                        :class="[
                          'flex h-4 w-4 items-center justify-center rounded-full border-2',
                          theme === 'light' ? 'border-primary' : 'border-muted-foreground',
                        ]"
                      >
                        <div v-if="theme === 'light'" class="bg-primary h-2 w-2 rounded-full" />
                      </button>
                      <Label @click="theme = 'light'" class="cursor-pointer">Light</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                      <button
                        type="button"
                        @click="theme = 'dark'"
                        :class="[
                          'flex h-4 w-4 items-center justify-center rounded-full border-2',
                          theme === 'dark' ? 'border-primary' : 'border-muted-foreground',
                        ]"
                      >
                        <div v-if="theme === 'dark'" class="bg-primary h-2 w-2 rounded-full" />
                      </button>
                      <Label @click="theme = 'dark'" class="cursor-pointer">Dark</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                      <button
                        type="button"
                        @click="theme = 'system'"
                        :class="[
                          'flex h-4 w-4 items-center justify-center rounded-full border-2',
                          theme === 'system' ? 'border-primary' : 'border-muted-foreground',
                        ]"
                      >
                        <div v-if="theme === 'system'" class="bg-primary h-2 w-2 rounded-full" />
                      </button>
                      <Label @click="theme = 'system'" class="cursor-pointer">System</Label>
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select v-model="language">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-1">
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
                <CardTitle>Git Configuration</CardTitle>
                <CardDescription>Configure Git user information and preferences</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
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

                <div class="space-y-2">
                  <Label htmlFor="default-branch">Default Branch Name</Label>
                  <Input id="default-branch" v-model="defaultBranch" placeholder="main" />
                </div>

                <Separator />

                <div class="space-y-2">
                  <Label>Merge Strategy</Label>
                  <Select v-model="mergeStrategy">
                    <SelectTrigger>
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
                <CardTitle>External Editor</CardTitle>
                <CardDescription>Configure your preferred external editor</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="bg-muted rounded-lg p-4">
                  <p class="mb-3 text-sm">
                    Manage your external editor preferences and view all detected editors on your
                    system.
                  </p>
                  <Button @click="$router.push('/external-editor')" variant="default">
                    <FileText class="mr-2 h-4 w-4" />
                    Manage External Editors
                  </Button>
                </div>

                <Separator />

                <div class="space-y-2">
                  <h3 class="text-sm font-medium">Quick Settings</h3>
                  <div class="flex items-center justify-between">
                    <div class="space-y-1">
                      <Label>Open files in editor tabs</Label>
                      <p class="text-muted-foreground text-sm">
                        Open multiple files in tabs instead of new windows
                      </p>
                    </div>
                    <Switch v-model="openInTabs" />
                  </div>

                  <div class="flex items-center justify-between">
                    <div class="space-y-1">
                      <Label>Wait for editor to close</Label>
                      <p class="text-muted-foreground text-sm">
                        Wait for file to be closed before continuing
                      </p>
                    </div>
                    <Switch v-model="waitForClose" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Advanced Settings -->
          <div v-if="activeCategory === 'advanced'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Configure advanced Git and application settings</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <Label>Enable GPG signing</Label>
                    <p class="text-muted-foreground text-sm">Sign commits with GPG key</p>
                  </div>
                  <Switch v-model="gpgSign" />
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <Label>Verbose commit messages</Label>
                    <p class="text-muted-foreground text-sm">Show diff in commit message editor</p>
                  </div>
                  <Switch v-model="verboseCommit" />
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <Label>Auto-fetch</Label>
                    <p class="text-muted-foreground text-sm">Automatically fetch from remotes</p>
                  </div>
                  <Switch v-model="autoFetch" />
                </div>

                <Separator />

                <div class="space-y-2">
                  <Label>Repository scan depth</Label>
                  <div class="flex items-center gap-4">
                    <Slider v-model="scanDepth" :min="1" :max="10" :step="1" class="flex-1" />
                    <span class="text-muted-foreground w-12 text-sm">{{ scanDepth[0] }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proxy Settings</CardTitle>
                <CardDescription>Configure HTTP/HTTPS proxy for Git operations</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <Label>Use proxy</Label>
                  <Switch v-model="useProxy" />
                </div>

                <div v-if="useProxy" class="space-y-4">
                  <div class="space-y-2">
                    <Label htmlFor="proxy-url">Proxy URL</Label>
                    <Input
                      id="proxy-url"
                      v-model="proxyUrl"
                      placeholder="http://proxy.example.com:8080"
                    />
                  </div>

                  <div class="space-y-2">
                    <Label htmlFor="proxy-bypass">Bypass proxy for</Label>
                    <Textarea
                      id="proxy-bypass"
                      v-model="proxyBypass"
                      placeholder="localhost, 127.0.0.1, .local"
                      rows="3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- About -->
          <div v-if="activeCategory === 'about'" class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About GitHub Desktop Plus</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center gap-4">
                  <GitBranch class="text-primary h-16 w-16" :stroke-width="1" />
                  <div>
                    <h2 class="text-xl font-semibold">GitHub Desktop Plus</h2>
                    <p class="text-muted-foreground text-sm">Version 1.0.0</p>
                  </div>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-sm">A powerful Git client built with Electron and Vue 3</p>
                  <p class="text-muted-foreground text-sm">
                    © 2025 GitHub Desktop Plus. All rights reserved.
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Settings, GitBranch, FileText, Wrench, Info, Github } from 'lucide-vue-next'
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
import Slider from '@/components/ui/Slider.vue'
import Textarea from '@/components/ui/Textarea.vue'
import { useAppStore, type Theme } from '@/stores/app.store'

const appStore = useAppStore()

const categories = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'git', label: 'Git', icon: GitBranch },
  { id: 'editor', label: 'Editor', icon: FileText },
  { id: 'advanced', label: 'Advanced', icon: Wrench },
  { id: 'about', label: 'About', icon: Info },
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
const openInTabs = ref(true)
const waitForClose = ref(false)

// Advanced settings
const gpgSign = ref(false)
const verboseCommit = ref(false)
const autoFetch = ref(true)
const scanDepth = ref([3])
const useProxy = ref(false)
const proxyUrl = ref('')
const proxyBypass = ref('')

// Theme is now handled via computed property with v-model

const browseForEditor = async () => {
  // TODO: Implement file browser for selecting editor
  console.log('Browse for editor')
}

const openGithub = () => {
  window.open('https://github.com/yourusername/github-desktop-plus', '_blank')
}

const checkUpdates = () => {
  // TODO: Implement update check
  console.log('Checking for updates...')
}
</script>
