<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Add Repository</DialogTitle>
        <DialogDescription>
          Add an existing repository, create a new one, or clone from a URL
        </DialogDescription>
      </DialogHeader>

      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="add" class="flex items-center gap-1.5">
            <FolderOpen class="w-3.5 h-3.5" :stroke-width="1.5" />
            Add Existing
          </TabsTrigger>
          <TabsTrigger value="create" class="flex items-center gap-1.5">
            <FilePlus class="w-3.5 h-3.5" :stroke-width="1.5" />
            Create New
          </TabsTrigger>
          <TabsTrigger value="clone" class="flex items-center gap-1.5">
            <GitBranch class="w-3.5 h-3.5" :stroke-width="1.5" />
            Clone
          </TabsTrigger>
        </TabsList>

        <!-- Add Existing Tab -->
        <TabsContent value="add" class="space-y-4 mt-4">
          <div class="space-y-2">
            <Label htmlFor="add-path">Repository Path</Label>
            <div class="flex gap-2">
              <Input
                id="add-path"
                v-model="repositoryPath"
                placeholder="/path/to/repository"
                :disabled="isValidating"
                class="flex-1"
                @keyup.enter="openRepository"
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
            <p v-if="validationResult && !validationResult.isValid" class="text-sm text-destructive">
              {{ validationResult.error }}
            </p>
            <p v-else-if="validationResult && validationResult.isValid" class="text-sm text-green-600 dark:text-green-400">
              ✓ Valid Git repository
              <span v-if="validationResult.hasRemote" class="text-muted-foreground">(has remote)</span>
            </p>
          </div>

          <div v-if="repositoryInfo" class="space-y-2 p-2 bg-muted rounded-lg">
            <div class="flex items-center gap-2">
              <GitBranch class="w-4 h-4 text-muted-foreground" :stroke-width="1" />
              <span class="text-sm font-medium">{{ repositoryInfo.name }}</span>
            </div>
            <div v-if="repositoryInfo.currentBranch" class="flex items-center gap-2">
              <div class="w-4 h-4" />
              <span class="text-sm text-muted-foreground">Branch: {{ repositoryInfo.currentBranch }}</span>
            </div>
            <div v-if="repositoryInfo.remoteUrl" class="flex items-center gap-2">
              <div class="w-4 h-4" />
              <span class="text-sm text-muted-foreground truncate">Remote: {{ repositoryInfo.remoteUrl }}</span>
            </div>
          </div>
        </TabsContent>

        <!-- Create New Tab -->
        <TabsContent value="create" class="space-y-4 mt-4">
          <div class="space-y-2">
            <Label htmlFor="create-name">Repository Name</Label>
            <Input
              id="create-name"
              v-model="createOptions.name"
              placeholder="my-awesome-project"
              :disabled="isCreating"
              @input="updateCreatePath"
            />
            <p class="text-xs text-muted-foreground">The name of your new repository</p>
          </div>

          <div class="space-y-2">
            <Label htmlFor="create-description">Description (optional)</Label>
            <Textarea
              id="create-description"
              v-model="createOptions.description"
              placeholder="A brief description of your repository"
              :disabled="isCreating"
              :rows="2"
            />
          </div>

          <div class="space-y-2">
            <Label htmlFor="create-path">Local Path</Label>
            <div class="flex gap-2">
              <Input
                id="create-path"
                v-model="createOptions.path"
                placeholder="/path/to/repository"
                :disabled="isCreating"
                class="flex-1"
              />
              <Button variant="outline" size="sm" @click="browseCreateDirectory" :disabled="isCreating">
                Browse
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">Where to create the repository</p>
          </div>

          <div class="space-y-3">
            <div class="flex items-center space-x-2">
              <Checkbox id="readme" v-model:checked="createOptions.initializeWithReadme" :disabled="isCreating" />
              <Label htmlFor="readme" class="cursor-pointer">Initialize with a README</Label>
            </div>

            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Checkbox id="gitignore" v-model:checked="useGitignore" :disabled="isCreating" />
                <Label htmlFor="gitignore" class="cursor-pointer">Add .gitignore</Label>
              </div>
              <div v-if="useGitignore" class="ml-6">
                <Select v-model="gitignoreTemplate">
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a .gitignore template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="node">Node</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                    <SelectItem value="swift">Swift</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  v-if="gitignoreTemplate === 'custom'"
                  v-model="customGitignore"
                  placeholder="Enter your .gitignore content"
                  class="mt-2"
                  :rows="4"
                />
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Checkbox id="license" v-model:checked="useLicense" :disabled="isCreating" />
                <Label htmlFor="license" class="cursor-pointer">Add a license</Label>
              </div>
              <div v-if="useLicense" class="ml-6">
                <Select v-model="licenseType">
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a license" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mit">MIT License</SelectItem>
                    <SelectItem value="apache">Apache License 2.0</SelectItem>
                    <SelectItem value="gpl3">GNU GPLv3</SelectItem>
                    <SelectItem value="bsd">BSD 3-Clause</SelectItem>
                    <SelectItem value="unlicense">The Unlicense</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  v-if="licenseType === 'custom'"
                  v-model="customLicense"
                  placeholder="Enter your license text"
                  class="mt-2"
                  :rows="4"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- Clone Tab -->
        <TabsContent value="clone" class="mt-4">
          <div v-if="!isCloning" class="space-y-4">
            <div class="space-y-2">
              <Label htmlFor="clone-url">Repository URL</Label>
              <Input
                id="clone-url"
                v-model="cloneOptions.url"
                placeholder="https://github.com/user/repository.git"
                :class="cloneUrlError ? 'border-destructive' : ''"
              />
              <p v-if="cloneUrlError" class="text-xs text-destructive">{{ cloneUrlError }}</p>
              <p v-else-if="cloneRepoName" class="text-xs text-muted-foreground">Will clone <span class="font-medium text-foreground">{{ cloneRepoName }}</span></p>
              <p v-else class="text-xs text-muted-foreground">HTTPS or SSH URL for the repository</p>
            </div>

            <div class="space-y-2">
              <Label htmlFor="clone-directory">Local Path</Label>
              <div class="flex gap-2">
                <Input
                  id="clone-directory"
                  v-model="cloneOptions.directory"
                  placeholder="/path/to/local/directory"
                  class="flex-1"
                />
                <Button variant="outline" size="sm" @click="browseCloneDirectory">Browse</Button>
              </div>
              <p class="text-xs text-muted-foreground">Where to clone the repository</p>
            </div>

            <Collapsible v-model:open="showAdvanced">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" class="w-full justify-between">
                  Advanced Options
                  <ChevronDown :class="['w-4 h-4 transition-transform', showAdvanced && 'rotate-180']" :stroke-width="1" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent class="space-y-4 pt-4">
                <div class="space-y-2">
                  <Label htmlFor="clone-branch">Branch</Label>
                  <Input id="clone-branch" v-model="cloneOptions.branch" placeholder="main" />
                  <p class="text-xs text-muted-foreground">Specific branch to clone (default: repository's default branch)</p>
                </div>

                <div class="space-y-2">
                  <Label htmlFor="clone-depth">Clone Depth</Label>
                  <Input id="clone-depth" v-model.number="cloneOptions.depth" type="number" min="1" placeholder="Full history" />
                  <p class="text-xs text-muted-foreground">Number of commits to fetch (leave empty for full history)</p>
                </div>

                <div class="space-y-2">
                  <Label>Authentication (if required)</Label>
                  <Tabs v-model="authType" class="w-full">
                    <TabsList class="grid w-full grid-cols-2">
                      <TabsTrigger value="none">None</TabsTrigger>
                      <TabsTrigger value="https">HTTPS</TabsTrigger>
                    </TabsList>
                    <TabsContent value="https" class="space-y-2">
                      <Input v-model="cloneOptions.username" placeholder="Username" />
                      <Input v-model="cloneOptions.password" type="password" placeholder="Password or Personal Access Token" />
                    </TabsContent>
                  </Tabs>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <!-- Clone Progress -->
          <div v-else class="space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span>{{ progressStageText }}</span>
                <span>{{ cloneProgress.percent }}%</span>
              </div>
              <Progress :value="cloneProgress.percent" />
            </div>
            <div v-if="cloneProgress.message" class="text-sm text-muted-foreground">{{ cloneProgress.message }}</div>
            <div v-if="cloneProgress.transferred > 0" class="text-sm text-muted-foreground">
              {{ cloneProgress.transferred }} / {{ cloneProgress.total }} objects
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button
          variant="outline"
          @click="handleCancel"
          :disabled="activeTab === 'clone' && isCloning && cloneProgress.stage !== 'error'"
        >
          {{ activeTab === 'clone' && isCloning ? 'Cancel' : 'Close' }}
        </Button>

        <Button
          v-if="activeTab === 'add'"
          @click="openRepository"
          :disabled="!canOpen || isValidating"
        >
          {{ isValidating ? 'Validating...' : 'Open Repository' }}
        </Button>

        <Button
          v-else-if="activeTab === 'create'"
          @click="createRepository"
          :disabled="!canCreate || isCreating"
        >
          {{ isCreating ? 'Creating...' : 'Create Repository' }}
        </Button>

        <Button
          v-else-if="activeTab === 'clone' && (!isCloning || cloneProgress.stage === 'error')"
          @click="startClone"
          :disabled="!canClone"
        >
          {{ cloneProgress.stage === 'error' ? 'Retry' : 'Clone' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Textarea from '@/components/ui/Textarea.vue'
import { ChevronDown, GitBranch, FolderOpen, FilePlus } from 'lucide-vue-next'
import { useRepositoriesStore } from '@/shared/stores'
import type { CloneOptions, CloneProgress, CreateRepositoryOptions, RepositoryValidation } from '@/shared/types/git.types'
import { gitignoreTemplates, licenseTemplates } from '@/utils/templates'

const emit = defineEmits<{
  'clone-complete': [path: string]
  'repository-opened': [path: string]
  'repository-created': [path: string]
}>()

const repositoriesStore = useRepositoriesStore()

const isOpen = ref(false)
const activeTab = ref<'add' | 'create' | 'clone'>('add')

// ── Add Existing ────────────────────────────────────────────────────────────
const isValidating = ref(false)
const repositoryPath = ref('')
const validationResult = ref<RepositoryValidation | null>(null)
const repositoryInfo = ref<{ name: string; currentBranch: string | null; remoteUrl?: string } | null>(null)

const canOpen = computed(() => repositoryPath.value && validationResult.value?.isValid)

let validationTimeout: ReturnType<typeof setTimeout> | null = null
watch(repositoryPath, (newPath) => {
  validationResult.value = null
  repositoryInfo.value = null
  if (validationTimeout) clearTimeout(validationTimeout)
  if (!newPath) return
  validationTimeout = setTimeout(() => validateRepository(newPath), 500)
})

const validateRepository = async (path: string) => {
  isValidating.value = true
  try {
    const validation = await window.api.git.validate(path)
    validationResult.value = validation
    if (validation.isValid) {
      const result = await window.api.git.openRepository(path)
      if (result.success) {
        repositoryInfo.value = { name: result.name, currentBranch: result.currentBranch, remoteUrl: result.remoteUrl }
      }
    }
  } catch (error) {
    validationResult.value = {
      isValid: false,
      isGitRepository: false,
      hasRemote: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  } finally {
    isValidating.value = false
  }
}

const browseForRepository = async () => {
  const result = await window.api.dialog.openDirectory()
  if (result) repositoryPath.value = result
}

const openRepository = async () => {
  if (!canOpen.value) return
  try {
    await repositoriesStore.addRepository(repositoryPath.value)
    emit('repository-opened', repositoryPath.value)
    close()
  } catch (error) {
    validationResult.value = {
      isValid: false,
      isGitRepository: false,
      hasRemote: false,
      error: error instanceof Error ? error.message : 'Failed to add repository',
    }
  }
}

// ── Create New ──────────────────────────────────────────────────────────────
const isCreating = ref(false)
const defaultCreatePath = ref('')

const createOptions = ref<CreateRepositoryOptions>({
  name: '',
  description: '',
  path: '',
  initializeWithReadme: true,
  gitignoreTemplate: undefined,
  license: undefined,
})

const useGitignore = ref(false)
const gitignoreTemplate = ref('node')
const customGitignore = ref('')
const useLicense = ref(false)
const licenseType = ref('mit')
const customLicense = ref('')

const canCreate = computed(() => createOptions.value.name && createOptions.value.path)

watch([useGitignore, gitignoreTemplate, customGitignore], () => {
  if (!useGitignore.value) {
    createOptions.value.gitignoreTemplate = undefined
  } else if (gitignoreTemplate.value === 'custom') {
    createOptions.value.gitignoreTemplate = customGitignore.value
  } else {
    createOptions.value.gitignoreTemplate = gitignoreTemplates[gitignoreTemplate.value]
  }
})

watch([useLicense, licenseType, customLicense], () => {
  if (!useLicense.value) {
    createOptions.value.license = undefined
  } else if (licenseType.value === 'custom') {
    createOptions.value.license = customLicense.value
  } else {
    createOptions.value.license = licenseTemplates[licenseType.value]
  }
})

const updateCreatePath = () => {
  if (createOptions.value.name && defaultCreatePath.value) {
    createOptions.value.path = `${defaultCreatePath.value}/${createOptions.value.name}`
  }
}

const browseCreateDirectory = async () => {
  const result = await window.api.dialog.openDirectory()
  if (result) {
    defaultCreatePath.value = result
    updateCreatePath()
  }
}

const createRepository = async () => {
  if (!canCreate.value) return
  isCreating.value = true
  try {
    const result = await window.api.git.create(createOptions.value)
    if (result.success && result.path) {
      await repositoriesStore.addRepository(result.path)
      emit('repository-created', result.path)
      close()
    }
  } catch (error) {
    console.error('Failed to create repository:', error)
  } finally {
    isCreating.value = false
  }
}

// ── Clone ───────────────────────────────────────────────────────────────────
const isCloning = ref(false)
const showAdvanced = ref(false)
const authType = ref<'none' | 'https'>('none')

const cloneOptions = ref<CloneOptions>({
  url: '',
  directory: '',
  branch: undefined,
  depth: undefined,
  username: undefined,
  password: undefined,
})

const cloneProgress = ref<CloneProgress>({
  stage: 'counting',
  percent: 0,
  total: 0,
  transferred: 0,
})

const cloneUrlError = ref('')
const cloneRepoName = ref('')

const parseRepoNameFromUrl = (url: string): string => {
  const cleaned = url.trim().replace(/\.git$/, '')
  // SSH: git@github.com:owner/repo
  const sshMatch = cleaned.match(/git@[^:]+:(?:[^/]+\/)?(.+)$/)
  if (sshMatch) return sshMatch[1]
  // HTTPS: https://github.com/owner/repo
  try {
    const u = new URL(cleaned)
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length >= 2) return parts[parts.length - 1]
  } catch {}
  return ''
}

const isValidRepoUrl = (url: string): boolean => {
  const t = url.trim()
  if (!t) return false
  if (/^git@[^:]+:.+\/.+/.test(t)) return true
  try {
    const u = new URL(t)
    return (u.protocol === 'https:' || u.protocol === 'http:') &&
      u.pathname.split('/').filter(Boolean).length >= 2
  } catch {
    return false
  }
}

let cloneUrlDebounce: ReturnType<typeof setTimeout> | null = null
watch(() => cloneOptions.value.url, (url) => {
  cloneRepoName.value = ''
  cloneUrlError.value = ''
  if (cloneUrlDebounce) clearTimeout(cloneUrlDebounce)
  if (!url.trim()) return
  cloneUrlDebounce = setTimeout(() => {
    if (!isValidRepoUrl(url)) {
      cloneUrlError.value = 'Invalid repository URL'
      return
    }
    const name = parseRepoNameFromUrl(url)
    cloneRepoName.value = name
  }, 400)
})

const progressStageText = computed(() => {
  switch (cloneProgress.value.stage) {
    case 'counting': return 'Counting objects...'
    case 'compressing': return 'Compressing objects...'
    case 'receiving': return 'Receiving objects...'
    case 'resolving': return 'Resolving deltas...'
    case 'complete': return 'Clone completed!'
    case 'error': return 'Clone failed'
    default: return 'Cloning...'
  }
})

const canClone = computed(() => cloneOptions.value.url && cloneOptions.value.directory)

watch(authType, (newType) => {
  if (newType === 'none') {
    cloneOptions.value.username = undefined
    cloneOptions.value.password = undefined
  }
})

const browseCloneDirectory = async () => {
  const result = await window.api.dialog.openDirectory()
  if (result) cloneOptions.value.directory = result
}

const startClone = async () => {
  if (!canClone.value) return
  isCloning.value = true
  cloneProgress.value = { stage: 'counting', percent: 0, total: 0, transferred: 0 }

  const unsubscribe = window.api.git.onCloneProgress((progress: CloneProgress) => {
    cloneProgress.value = progress
  })

  try {
    const result = await window.api.git.clone(cloneOptions.value)
    if (result.success && result.path) {
      await repositoriesStore.addRepository(result.path)
      emit('clone-complete', result.path)
      setTimeout(() => close(), 1500)
    }
  } catch (error) {
    cloneProgress.value = {
      stage: 'error',
      percent: 0,
      total: 0,
      transferred: 0,
      message: error instanceof Error ? error.message : 'Clone failed',
    }
  } finally {
    unsubscribe()
    if (cloneProgress.value.stage !== 'error') isCloning.value = false
  }
}

// ── Dialog lifecycle ────────────────────────────────────────────────────────
const handleCancel = () => {
  if (activeTab.value !== 'clone' || !isCloning.value || cloneProgress.value.stage === 'error') {
    close()
  }
}

const open = (tab: 'add' | 'create' | 'clone' = 'add') => {
  activeTab.value = tab
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
  setTimeout(() => {
    // Reset add
    repositoryPath.value = ''
    validationResult.value = null
    repositoryInfo.value = null
    isValidating.value = false

    // Reset create
    createOptions.value = { name: '', description: '', path: '', initializeWithReadme: true, gitignoreTemplate: undefined, license: undefined }
    defaultCreatePath.value = ''
    useGitignore.value = false
    gitignoreTemplate.value = 'node'
    customGitignore.value = ''
    useLicense.value = false
    licenseType.value = 'mit'
    customLicense.value = ''
    isCreating.value = false

    // Reset clone
    isCloning.value = false
    showAdvanced.value = false
    authType.value = 'none'
    cloneOptions.value = { url: '', directory: '', branch: undefined, depth: undefined, username: undefined, password: undefined }
    cloneProgress.value = { stage: 'counting', percent: 0, total: 0, transferred: 0 }
    cloneRepoName.value = ''
    cloneUrlError.value = ''
  }, 300)
}

onUnmounted(() => {
  if (validationTimeout) clearTimeout(validationTimeout)
  if (cloneUrlDebounce) clearTimeout(cloneUrlDebounce)
})

defineExpose({ open, close })
</script>
