<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Create New Repository</DialogTitle>
        <DialogDescription>
          Create a new Git repository on your local machine
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Repository Name -->
        <div class="space-y-2">
          <Label htmlFor="name">Repository Name</Label>
          <Input
            id="name"
            v-model="createOptions.name"
            placeholder="my-awesome-project"
            :disabled="isCreating"
            @input="updatePath"
          />
          <p class="text-xs text-muted-foreground">
            The name of your new repository
          </p>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            v-model="createOptions.description"
            placeholder="A brief description of your repository"
            :disabled="isCreating"
            rows="3"
          />
        </div>

        <!-- Local Path -->
        <div class="space-y-2">
          <Label htmlFor="path">Local Path</Label>
          <div class="flex gap-2">
            <Input
              id="path"
              v-model="createOptions.path"
              placeholder="/path/to/repository"
              :disabled="isCreating"
              class="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              @click="browseDirectory"
              :disabled="isCreating"
            >
              Browse
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">
            Where to create the repository
          </p>
        </div>

        <!-- Initialize Options -->
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <Checkbox
              id="readme"
              v-model:checked="createOptions.initializeWithReadme"
              :disabled="isCreating"
            />
            <Label htmlFor="readme" class="cursor-pointer">
              Initialize with a README
            </Label>
          </div>

          <!-- Git Ignore -->
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <Checkbox
                id="gitignore"
                v-model:checked="useGitignore"
                :disabled="isCreating"
              />
              <Label htmlFor="gitignore" class="cursor-pointer">
                Add .gitignore
              </Label>
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
                rows="5"
              />
            </div>
          </div>

          <!-- License -->
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <Checkbox
                id="license"
                v-model:checked="useLicense"
                :disabled="isCreating"
              />
              <Label htmlFor="license" class="cursor-pointer">
                Add a license
              </Label>
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
                rows="5"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close" :disabled="isCreating">
          Cancel
        </Button>
        <Button
          @click="createRepository"
          :disabled="!canCreate || isCreating"
        >
          {{ isCreating ? 'Creating...' : 'Create Repository' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
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
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Textarea from '@/components/ui/Textarea.vue'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRepositoryStore } from '@/stores/repository.store'
import type { CreateRepositoryOptions } from '@/shared/types/git.types'
import { gitignoreTemplates, licenseTemplates } from '@/utils/templates'

const emit = defineEmits<{
  'repository-created': [path: string]
}>()

const repositoryStore = useRepositoryStore()

const isOpen = ref(false)
const isCreating = ref(false)
const defaultPath = ref('')

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

const canCreate = computed(() => {
  return createOptions.value.name && createOptions.value.path
})

// Update gitignore template in options
watch([useGitignore, gitignoreTemplate, customGitignore], () => {
  if (!useGitignore.value) {
    createOptions.value.gitignoreTemplate = undefined
  } else if (gitignoreTemplate.value === 'custom') {
    createOptions.value.gitignoreTemplate = customGitignore.value
  } else {
    createOptions.value.gitignoreTemplate = gitignoreTemplates[gitignoreTemplate.value]
  }
})

// Update license in options
watch([useLicense, licenseType, customLicense], () => {
  if (!useLicense.value) {
    createOptions.value.license = undefined
  } else if (licenseType.value === 'custom') {
    createOptions.value.license = customLicense.value
  } else {
    createOptions.value.license = licenseTemplates[licenseType.value]
  }
})

const updatePath = () => {
  if (createOptions.value.name && defaultPath.value) {
    createOptions.value.path = `${defaultPath.value}/${createOptions.value.name}`
  }
}

const browseDirectory = async () => {
  const result = await window.api.dialog.openDirectory()
  if (result) {
    defaultPath.value = result
    updatePath()
  }
}

const createRepository = async () => {
  if (!canCreate.value) return
  
  isCreating.value = true
  
  try {
    const result = await window.api.git.create(createOptions.value)
    
    if (result.success && result.path) {
      // Add to repository list
      await repositoryStore.addRepository(result.path)
      emit('repository-created', result.path)
      close()
    } else {
      // Show error
      console.error('Failed to create repository:', result.error)
    }
  } catch (error) {
    console.error('Failed to create repository:', error)
  } finally {
    isCreating.value = false
  }
}

const open = async () => {
  isOpen.value = true
  // Set default path to user's home directory
  // In a real app, we'd get this from the main process
  try {
    const result = await window.api.dialog.openDirectory()
    if (result) {
      defaultPath.value = result
    }
  } catch {
    // Use a sensible default
    defaultPath.value = ''
  }
}

const close = () => {
  isOpen.value = false
  // Reset state after dialog closes
  setTimeout(() => {
    createOptions.value = {
      name: '',
      description: '',
      path: '',
      initializeWithReadme: true,
      gitignoreTemplate: undefined,
      license: undefined,
    }
    useGitignore.value = false
    gitignoreTemplate.value = 'node'
    customGitignore.value = ''
    useLicense.value = false
    licenseType.value = 'mit'
    customLicense.value = ''
    isCreating.value = false
  }, 300)
}

defineExpose({
  open,
  close
})
</script>