<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Clone Repository</DialogTitle>
        <DialogDescription>
          Clone a repository from a URL to your local machine
        </DialogDescription>
      </DialogHeader>

      <div v-if="!isCloning" class="space-y-4">
        <!-- Repository URL -->
        <div class="space-y-2">
          <Label htmlFor="url">Repository URL</Label>
          <Input
            id="url"
            v-model="cloneOptions.url"
            placeholder="https://github.com/user/repository.git"
            :disabled="isCloning"
          />
          <p class="text-xs text-muted-foreground">
            HTTPS or SSH URL for the repository
          </p>
        </div>

        <!-- Clone Directory -->
        <div class="space-y-2">
          <Label htmlFor="directory">Local Path</Label>
          <div class="flex gap-2">
            <Input
              id="directory"
              v-model="cloneOptions.directory"
              placeholder="/path/to/local/directory"
              :disabled="isCloning"
              class="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              @click="browseDirectory"
              :disabled="isCloning"
            >
              Browse
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">
            Where to clone the repository
          </p>
        </div>

        <!-- Advanced Options -->
        <Collapsible v-model:open="showAdvanced">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" class="w-full justify-between">
              Advanced Options
              <ChevronDown 
                :class="['w-4 h-4 transition-transform', showAdvanced && 'rotate-180']" 
                :stroke-width="1" 
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent class="space-y-4 pt-4">
            <!-- Branch -->
            <div class="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                v-model="cloneOptions.branch"
                placeholder="main"
                :disabled="isCloning"
              />
              <p class="text-xs text-muted-foreground">
                Specific branch to clone (default: repository's default branch)
              </p>
            </div>

            <!-- Clone Depth -->
            <div class="space-y-2">
              <Label htmlFor="depth">Clone Depth</Label>
              <Input
                id="depth"
                v-model.number="cloneOptions.depth"
                type="number"
                min="1"
                placeholder="Full history"
                :disabled="isCloning"
              />
              <p class="text-xs text-muted-foreground">
                Number of commits to fetch (leave empty for full history)
              </p>
            </div>

            <!-- Authentication -->
            <div class="space-y-2">
              <Label>Authentication (if required)</Label>
              <Tabs v-model="authType" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                  <TabsTrigger value="none">None</TabsTrigger>
                  <TabsTrigger value="https">HTTPS</TabsTrigger>
                </TabsList>
                <TabsContent value="https" class="space-y-2">
                  <Input
                    v-model="cloneOptions.username"
                    placeholder="Username"
                    :disabled="isCloning"
                  />
                  <Input
                    v-model="cloneOptions.password"
                    type="password"
                    placeholder="Password or Personal Access Token"
                    :disabled="isCloning"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <!-- Progress Section -->
      <div v-else class="space-y-4">
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span>{{ progressStageText }}</span>
            <span>{{ cloneProgress.percent }}%</span>
          </div>
          <Progress :value="cloneProgress.percent" />
        </div>

        <div v-if="cloneProgress.message" class="text-sm text-muted-foreground">
          {{ cloneProgress.message }}
        </div>

        <div v-if="cloneProgress.transferred > 0" class="text-sm text-muted-foreground">
          {{ cloneProgress.transferred }} / {{ cloneProgress.total }} objects
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="cancel"
          :disabled="isCloning && cloneProgress.stage !== 'error'"
        >
          {{ isCloning ? 'Cancel' : 'Close' }}
        </Button>
        <Button
          @click="startClone"
          :disabled="!canClone || isCloning"
          v-if="!isCloning || cloneProgress.stage === 'error'"
        >
          {{ cloneProgress.stage === 'error' ? 'Retry' : 'Clone' }}
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
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ChevronDown } from 'lucide-vue-next'
import { useRepositoriesStore } from '@/shared/stores'
import type { CloneOptions, CloneProgress } from '@/shared/types/git.types'

const emit = defineEmits<{
  'clone-complete': [path: string]
}>()

const repositoriesStore = useRepositoriesStore()

const isOpen = ref(false)
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

const canClone = computed(() => {
  return cloneOptions.value.url && cloneOptions.value.directory
})

// Clean up auth fields when auth type changes
watch(authType, (newType) => {
  if (newType === 'none') {
    cloneOptions.value.username = undefined
    cloneOptions.value.password = undefined
  }
})

const browseDirectory = async () => {
  const result = await window.api.dialog.openDirectory()
  if (result) {
    cloneOptions.value.directory = result
  }
}

const startClone = async () => {
  if (!canClone.value) return

  isCloning.value = true
  cloneProgress.value = {
    stage: 'counting',
    percent: 0,
    total: 0,
    transferred: 0,
  }

  // Set up progress listener
  const unsubscribe = window.api.git.onCloneProgress((progress: CloneProgress) => {
    cloneProgress.value = progress
  })

  try {
    const result = await window.api.git.clone(cloneOptions.value)
    
    if (result.success && result.path) {
      // Add to repository list
      await repositoriesStore.addRepository(result.path)
      emit('clone-complete', result.path)
      
      // Close dialog after short delay
      setTimeout(() => {
        close()
      }, 1500)
    }
  } catch (error) {
    cloneProgress.value = {
      stage: 'error',
      percent: 0,
      total: 0,
      transferred: 0,
      message: error instanceof Error ? error.message : 'Clone failed'
    }
  } finally {
    unsubscribe()
    if (cloneProgress.value.stage !== 'error') {
      isCloning.value = false
    }
  }
}

const cancel = () => {
  if (!isCloning.value || cloneProgress.value.stage === 'error') {
    close()
  }
  // TODO: Implement clone cancellation
}

const open = () => {
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
  // Reset state
  setTimeout(() => {
    isCloning.value = false
    showAdvanced.value = false
    authType.value = 'none'
    cloneOptions.value = {
      url: '',
      directory: '',
      branch: undefined,
      depth: undefined,
      username: undefined,
      password: undefined,
    }
    cloneProgress.value = {
      stage: 'counting',
      percent: 0,
      total: 0,
      transferred: 0,
    }
  }, 300)
}

defineExpose({
  open,
  close
})
</script>