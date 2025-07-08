import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Repository {
  id: number
  name: string
  path: string
  currentBranch: string | null
  isFavorite: boolean
  lastOpenedAt: Date
  createdAt: Date
  updatedAt: Date
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
      .sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())
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
  const loadRepositories = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await window.api.repository.list()
      if (result.success && result.data) {
        repositories.value = result.data.map(repo => ({
          ...repo,
          lastOpenedAt: new Date(repo.lastOpenedAt),
          createdAt: new Date(repo.createdAt),
          updatedAt: new Date(repo.updatedAt)
        }))
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load repositories'
      console.error('Failed to load repositories:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  const addRepository = async (path: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await window.api.repository.add(path)
      if (result.success && result.data) {
        const repo = {
          ...result.data,
          lastOpenedAt: new Date(result.data.lastOpenedAt),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt)
        }
        
        // Check if repo already exists in the list
        const existingIndex = repositories.value.findIndex(r => r.id === repo.id)
        if (existingIndex >= 0) {
          repositories.value[existingIndex] = repo
        } else {
          repositories.value.push(repo)
        }
        
        setCurrentRepository(repo)
        return repo
      } else {
        throw new Error(result.error || 'Failed to add repository')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add repository'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const openRepositoryDialog = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await window.api.repository.openDialog()
      if (result.success && result.data) {
        const repo = {
          ...result.data,
          lastOpenedAt: new Date(result.data.lastOpenedAt),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt)
        }
        
        // Check if repo already exists in the list
        const existingIndex = repositories.value.findIndex(r => r.id === repo.id)
        if (existingIndex >= 0) {
          repositories.value[existingIndex] = repo
        } else {
          repositories.value.push(repo)
        }
        
        setCurrentRepository(repo)
        return repo
      } else if (result.canceled) {
        return null
      } else {
        throw new Error(result.error || 'Failed to open repository')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to open repository'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const removeRepository = async (id: number) => {
    try {
      const result = await window.api.repository.delete(id)
      if (result.success) {
        const index = repositories.value.findIndex(repo => repo.id === id)
        if (index !== -1) {
          repositories.value.splice(index, 1)
          if (currentRepository.value?.id === id) {
            currentRepository.value = null
          }
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove repository'
      throw err
    }
  }
  
  const toggleFavorite = async (id: number) => {
    try {
      const result = await window.api.repository.toggleFavorite(id)
      if (result.success && result.data) {
        const index = repositories.value.findIndex(r => r.id === id)
        if (index !== -1) {
          repositories.value[index] = {
            ...result.data,
            lastOpenedAt: new Date(result.data.lastOpenedAt),
            createdAt: new Date(result.data.createdAt),
            updatedAt: new Date(result.data.updatedAt)
          }
        }
        
        if (currentRepository.value?.id === id) {
          currentRepository.value = repositories.value[index]
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to toggle favorite'
      throw err
    }
  }
  
  const setCurrentRepository = async (repo: Repository | null) => {
    currentRepository.value = repo
    if (repo) {
      // Update last opened timestamp
      await window.api.repository.update(repo.id, { lastOpenedAt: new Date() })
      await fetchGitStatus()
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
  
  const updateRepositoryBranch = async (id: number, branch: string) => {
    try {
      const result = await window.api.repository.updateBranch(id, branch)
      if (result.success && result.data) {
        const index = repositories.value.findIndex(r => r.id === id)
        if (index !== -1) {
          repositories.value[index] = {
            ...result.data,
            lastOpenedAt: new Date(result.data.lastOpenedAt),
            createdAt: new Date(result.data.createdAt),
            updatedAt: new Date(result.data.updatedAt)
          }
        }
        
        if (currentRepository.value?.id === id) {
          currentRepository.value = repositories.value[index]
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update branch'
      throw err
    }
  }
  
  // Initialize - load repositories from database
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
    loadRepositories,
    addRepository,
    openRepositoryDialog,
    removeRepository,
    toggleFavorite,
    setCurrentRepository,
    fetchGitStatus,
    updateRepositoryBranch
  }
})