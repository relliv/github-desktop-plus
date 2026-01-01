<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Repository Settings</DialogTitle>
        <DialogDescription v-if="repository">
          Settings for {{ repository.name }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="repository" class="space-y-6">
        <!-- Repository Info -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Repository Information</h3>
          
          <div class="space-y-2">
            <Label>Name</Label>
            <div class="text-sm text-muted-foreground">{{ repository.name }}</div>
          </div>
          
          <div class="space-y-2">
            <Label>Path</Label>
            <div class="flex items-center gap-2">
              <div class="text-sm text-muted-foreground flex-1 truncate">{{ repository.path }}</div>
              <Button
                variant="ghost"
                size="sm"
                @click="openInExplorer"
                title="Open in file explorer"
              >
                <FolderOpen class="w-4 h-4" :stroke-width="1" />
              </Button>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>Current Branch</Label>
            <div class="text-sm text-muted-foreground">{{ repository.currentBranch || 'None' }}</div>
          </div>
          
          <div v-if="remoteUrl" class="space-y-2">
            <Label>Remote URL</Label>
            <div class="flex items-center gap-2">
              <div class="text-sm text-muted-foreground flex-1 truncate">{{ remoteUrl }}</div>
              <Button
                variant="ghost"
                size="sm"
                @click="copyRemoteUrl"
                title="Copy remote URL"
              >
                <Copy class="w-4 h-4" :stroke-width="1" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Git Configuration -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Git Configuration</h3>
          
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
          
          <Button
            variant="outline"
            size="sm"
            @click="updateGitConfig"
            :disabled="!gitConfigChanged"
          >
            Update Git Config
          </Button>
        </div>

        <Separator />

        <!-- Repository Actions -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Actions</h3>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <Label>Favorite</Label>
                <p class="text-sm text-muted-foreground">
                  Mark this repository as a favorite
                </p>
              </div>
              <Switch
                v-model="isFavorite"
                @update:model-value="toggleFavorite"
              />
            </div>
            
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <Label>Terminal</Label>
                <p class="text-sm text-muted-foreground">
                  Open terminal in repository directory
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="openInTerminal"
              >
                <Terminal class="w-4 h-4" :stroke-width="1" />
              </Button>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <Label>Editor</Label>
                <p class="text-sm text-muted-foreground">
                  Open in external editor
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="openInEditor"
              >
                <FileCode class="w-4 h-4" :stroke-width="1" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Danger Zone -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-destructive">Danger Zone</h3>
          
          <Card class="border-destructive">
            <CardContent class="pt-6">
              <div class="space-y-4">
                <div>
                  <h4 class="font-medium">Remove Repository</h4>
                  <p class="text-sm text-muted-foreground mt-1">
                    Remove this repository from GitHub Desktop Plus. This will not delete the repository from your disk.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  @click="confirmRemove"
                >
                  Remove Repository
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Confirmation Dialog -->
  <AlertDialog v-model:open="showRemoveConfirm">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Remove Repository?</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to remove "{{ repository?.name }}" from GitHub Desktop Plus?
          This action will not delete the repository from your disk.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction @click="removeRepository" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Remove
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Switch from '@/components/ui/Switch.vue'
import Separator from '@/components/ui/Separator.vue'
import { FolderOpen, Copy, Terminal, FileCode } from 'lucide-vue-next'
import { useRepositoriesStore } from '@/shared/stores'
import type { RepositoryInfo } from '@/shared/types/git.types'

const emit = defineEmits<{
  'repository-removed': []
}>()

const repositoriesStore = useRepositoriesStore()

const isOpen = ref(false)
const repository = ref<RepositoryInfo | null>(null)
const remoteUrl = ref<string>('')
const isFavorite = ref(false)
const showRemoveConfirm = ref(false)

const gitConfig = ref({
  name: '',
  email: ''
})

const originalGitConfig = ref({
  name: '',
  email: ''
})

const gitConfigChanged = computed(() => {
  return gitConfig.value.name !== originalGitConfig.value.name ||
         gitConfig.value.email !== originalGitConfig.value.email
})

// Load git config when repository changes
watch(repository, async (newRepo) => {
  if (newRepo) {
    isFavorite.value = newRepo.isFavorite
    
    // Get remote URL
    try {
      remoteUrl.value = await window.api.git.getRemoteUrl?.(newRepo.path) || ''
    } catch {
      remoteUrl.value = ''
    }
    
    // TODO: Get git config for this repository
    // For now, use global git config
    gitConfig.value = { name: '', email: '' }
    originalGitConfig.value = { ...gitConfig.value }
  }
})

const openInExplorer = async () => {
  if (repository.value) {
    await window.api.shell?.openPath(repository.value.path)
  }
}

const copyRemoteUrl = async () => {
  if (remoteUrl.value) {
    await navigator.clipboard.writeText(remoteUrl.value)
  }
}

const updateGitConfig = async () => {
  if (repository.value) {
    // TODO: Update git config for this repository
    console.log('Update git config:', gitConfig.value)
    originalGitConfig.value = { ...gitConfig.value }
  }
}

const toggleFavorite = async (value: boolean) => {
  if (repository.value) {
    await repositoriesStore.toggleFavorite(repository.value.id)
  }
}

const openInTerminal = async () => {
  if (repository.value) {
    // TODO: Open terminal in repository directory
    console.log('Open terminal in:', repository.value.path)
  }
}

const openInEditor = async () => {
  if (repository.value) {
    // TODO: Open in external editor
    console.log('Open in editor:', repository.value.path)
  }
}

const confirmRemove = () => {
  showRemoveConfirm.value = true
}

const removeRepository = async () => {
  if (repository.value) {
    await repositoriesStore.removeRepository(repository.value.id)
    emit('repository-removed')
    close()
  }
}

const open = (repo: RepositoryInfo) => {
  repository.value = repo
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
  showRemoveConfirm.value = false
  // Reset state after dialog closes
  setTimeout(() => {
    repository.value = null
    remoteUrl.value = ''
    gitConfig.value = { name: '', email: '' }
    originalGitConfig.value = { name: '', email: '' }
  }, 300)
}

defineExpose({
  open,
  close
})
</script>