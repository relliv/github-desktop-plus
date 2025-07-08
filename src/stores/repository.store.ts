import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Repository {
  id: string
  name: string
  path: string
  isPrivate: boolean
  isFavorite: boolean
  lastOpened: Date
  currentBranch?: string
  remoteUrl?: string
  description?: string
}

export interface GitStatus {
  modified: string[]
  added: string[]
  deleted: string[]
  renamed: Array<{ from: string; to: string }>
  conflicted: string[]
  staged: string[]
  ahead: number
  behind: number
}

export const useRepositoryStore = defineStore('repository', () => {
  // State
  const repositories = ref<Repository[]>([])
  const currentRepository = ref<Repository | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const gitStatus = ref<GitStatus | null>(null)
  
  // Getters
  const favoriteRepositories = computed(() => 
    repositories.value.filter(repo => repo.isFavorite)
  )
  
  const recentRepositories = computed(() => 
    [...repositories.value]
      .sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime())
      .slice(0, 5)
  )
  
  const hasChanges = computed(() => {
    if (!gitStatus.value) return false
    return (
      gitStatus.value.modified.length > 0 ||
      gitStatus.value.added.length > 0 ||
      gitStatus.value.deleted.length > 0 ||
      gitStatus.value.renamed.length > 0
    )
  })
  
  // Actions
  const addRepository = async (path: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await window.api.git.openRepository(path)
      const repo: Repository = {
        id: Date.now().toString(),
        name: result.name,
        path: result.path,
        isPrivate: false,
        isFavorite: false,
        lastOpened: new Date(),
        currentBranch: result.currentBranch,
        remoteUrl: result.remoteUrl
      }
      
      repositories.value.push(repo)
      setCurrentRepository(repo)
      
      // Save to local storage
      saveRepositories()
      
      return repo
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add repository'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const removeRepository = (id: string) => {
    const index = repositories.value.findIndex(repo => repo.id === id)
    if (index !== -1) {
      repositories.value.splice(index, 1)
      if (currentRepository.value?.id === id) {
        currentRepository.value = null
      }
      saveRepositories()
    }
  }
  
  const toggleFavorite = (id: string) => {
    const repo = repositories.value.find(r => r.id === id)
    if (repo) {
      repo.isFavorite = !repo.isFavorite
      saveRepositories()
    }
  }
  
  const setCurrentRepository = async (repo: Repository | null) => {
    currentRepository.value = repo
    if (repo) {
      repo.lastOpened = new Date()
      await fetchGitStatus()
      saveRepositories()
    } else {
      gitStatus.value = null
    }
  }
  
  const fetchGitStatus = async () => {
    if (!currentRepository.value) return
    
    try {
      gitStatus.value = await window.api.git.getStatus(currentRepository.value.path)
    } catch (err) {
      console.error('Failed to fetch git status:', err)
      gitStatus.value = null
    }
  }
  
  const loadRepositories = () => {
    const saved = localStorage.getItem('repositories')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        repositories.value = parsed.map((repo: any) => ({
          ...repo,
          lastOpened: new Date(repo.lastOpened)
        }))
      } catch (err) {
        console.error('Failed to load repositories:', err)
      }
    }
  }
  
  const saveRepositories = () => {
    localStorage.setItem('repositories', JSON.stringify(repositories.value))
  }
  
  // Initialize
  loadRepositories()
  
  return {
    // State
    repositories,
    currentRepository,
    isLoading,
    error,
    gitStatus,
    
    // Getters
    favoriteRepositories,
    recentRepositories,
    hasChanges,
    
    // Actions
    addRepository,
    removeRepository,
    toggleFavorite,
    setCurrentRepository,
    fetchGitStatus
  }
})