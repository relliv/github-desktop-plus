<template>
  <aside 
    :class="[
      'relative bg-card border-r flex flex-col transition-all duration-300',
      isSidebarCollapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- Toggle button -->
    <button
      @click="toggleSidebar"
      class="absolute -right-3 w-6 h-6 bg-background border rounded-full flex items-center justify-center hover:bg-accent transition-colors z-10 shadow-sm"
      :style="{ top: 'calc(50px - 12px)' }"
    >
      <ChevronLeft 
        :class="[
          'w-3 h-3 transition-transform',
          isSidebarCollapsed ? 'rotate-180' : ''
        ]"
        :stroke-width="1"
      />
    </button>
    
    <!-- User section -->
    <div class="h-[50px] px-4 border-b flex items-center">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <User class="w-4 h-4 text-primary-foreground" :stroke-width="1" />
        </div>
        <div v-if="!isSidebarCollapsed" class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">User</div>
          <div class="text-xs text-muted-foreground truncate">Not signed in</div>
        </div>
      </div>
    </div>
    
    <!-- Repository section -->
    <div class="flex-1 overflow-y-auto">
      <div class="px-2 py-4">
        <div class="flex items-center justify-between px-2 mb-2">
          <h3 
            :class="[
              'font-medium transition-all',
              isSidebarCollapsed ? 'text-xs' : 'text-sm'
            ]"
          >
            {{ isSidebarCollapsed ? 'Repos' : 'Repositories' }}
          </h3>
          <div v-if="!isSidebarCollapsed" class="flex gap-1">
            <button
              @click="cloneRepository"
              class="p-1 hover:bg-accent rounded transition-colors"
              title="Clone repository"
            >
              <GitBranch class="w-4 h-4" :stroke-width="1" />
            </button>
            <button
              @click="openRepository"
              class="p-1 hover:bg-accent rounded transition-colors"
              title="Add repository"
            >
              <Plus class="w-4 h-4" :stroke-width="1" />
            </button>
          </div>
        </div>
        
        <!-- Repository list -->
        <div class="space-y-1">
          <button
            v-for="repo in repositories"
            :key="repo.id"
            @click="selectRepository(repo)"
            :class="[
              'w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors text-left',
              currentRepository?.id === repo.id 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-accent/50'
            ]"
            :title="repo.name"
          >
            <GitBranch class="w-4 h-4 flex-shrink-0" :stroke-width="1" />
            <div v-if="!isSidebarCollapsed" class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">{{ repo.name }}</div>
              <div class="text-xs text-muted-foreground truncate">
                {{ repo.currentBranch || 'No branch' }}
              </div>
            </div>
            <Star 
              v-if="!isSidebarCollapsed && repo.isFavorite"
              class="w-3 h-3 text-yellow-500 flex-shrink-0"
              :stroke-width="1"
            />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Bottom actions -->
    <div class="border-t p-2 space-y-1">
      <SidebarButton
        :icon="Settings"
        label="Settings"
        :collapsed="isSidebarCollapsed"
        @click="navigateToSettings"
      />
    </div>
    
    <!-- Clone Dialog -->
    <CloneDialog ref="cloneDialog" @clone-complete="handleCloneComplete" />
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ChevronLeft, 
  User, 
  Plus, 
  GitBranch, 
  Star,
  Settings
} from 'lucide-vue-next'
import { useAppStore } from '../../stores/app.store'
import { useRepositoryStore } from '../../stores/repository.store'
import SidebarButton from '../ui/SidebarButton.vue'
import CloneDialog from '../dialogs/CloneDialog.vue'

const router = useRouter()
const appStore = useAppStore()
const repositoryStore = useRepositoryStore()

const cloneDialog = ref<InstanceType<typeof CloneDialog>>()

const isSidebarCollapsed = computed(() => appStore.isSidebarCollapsed)
const repositories = computed(() => repositoryStore.repositories)
const currentRepository = computed(() => repositoryStore.currentRepository)

const toggleSidebar = () => appStore.toggleSidebar()

const openRepository = async () => {
  try {
    const repo = await repositoryStore.openRepositoryDialog()
    if (repo) {
      router.push('/repository')
    }
  } catch (error) {
    console.error('Failed to open repository:', error)
  }
}

const cloneRepository = () => {
  cloneDialog.value?.open()
}

const selectRepository = (repo: any) => {
  repositoryStore.setCurrentRepository(repo)
  router.push('/repository')
}

const navigateToSettings = () => {
  router.push('/settings')
}

const handleCloneComplete = (path: string) => {
  // Repository is already added by the dialog
  // Just navigate to repository view
  router.push('/repository')
}
</script>