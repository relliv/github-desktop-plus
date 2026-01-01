import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RepositoryInfo } from '../types/git.types'

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

export interface BranchInfo {
  current: string
  local: string[]
  remote: string[]
}

export const useRepositoriesStore = defineStore('repositories', () => {
  // State
  const repositories = ref<RepositoryInfo[]>([])
  const currentRepository = ref<RepositoryInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const gitStatus = ref<GitStatus | null>(null)
  const branches = ref<BranchInfo | null>(null)

  // Getters
  const favoriteRepositories = computed(() =>
    repositories.value.filter((repo) => repo.isFavorite)
  )

  const recentRepositories = computed(() =>
    [...repositories.value]
      .sort(
        (a, b) =>
          new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
      )
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

  const repositoryById = computed(() => {
    return (id: number) => repositories.value.find((repo) => repo.id === id)
  })

  // Private helper to convert API response dates
  const parseRepositoryDates = (repo: RepositoryInfo): RepositoryInfo => ({
    ...repo,
    lastOpenedAt: new Date(repo.lastOpenedAt),
    createdAt: new Date(repo.createdAt),
    updatedAt: new Date(repo.updatedAt),
  })

  // Actions
  const loadRepositories = async () => {
    isLoading.value = true
    error.value = null

    try {
      const result = await window.api.repository.list()
      if (result.success && result.data) {
        repositories.value = result.data.map(parseRepositoryDates)
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load repositories'
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
        const repo = parseRepositoryDates(result.data)

        const existingIndex = repositories.value.findIndex(
          (r) => r.id === repo.id
        )
        if (existingIndex >= 0) {
          repositories.value[existingIndex] = repo
        } else {
          repositories.value.push(repo)
        }

        await setCurrentRepository(repo)
        return repo
      } else {
        throw new Error(result.error || 'Failed to add repository')
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to add repository'
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
        const repo = parseRepositoryDates(result.data)

        const existingIndex = repositories.value.findIndex(
          (r) => r.id === repo.id
        )
        if (existingIndex >= 0) {
          repositories.value[existingIndex] = repo
        } else {
          repositories.value.push(repo)
        }

        await setCurrentRepository(repo)
        return repo
      } else if (result.canceled) {
        return null
      } else {
        throw new Error(result.error || 'Failed to open repository')
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to open repository'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const removeRepository = async (id: number) => {
    try {
      const result = await window.api.repository.delete(id)
      if (result.success) {
        const index = repositories.value.findIndex((repo) => repo.id === id)
        if (index !== -1) {
          repositories.value.splice(index, 1)
          if (currentRepository.value?.id === id) {
            currentRepository.value = null
            gitStatus.value = null
          }
        }
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to remove repository'
      throw err
    }
  }

  const toggleFavorite = async (id: number) => {
    try {
      const result = await window.api.repository.toggleFavorite(id)
      if (result.success && result.data) {
        const index = repositories.value.findIndex((r) => r.id === id)
        if (index !== -1) {
          repositories.value[index] = parseRepositoryDates(result.data)
        }

        if (currentRepository.value?.id === id) {
          currentRepository.value = repositories.value[index]
        }
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to toggle favorite'
      throw err
    }
  }

  const setCurrentRepository = async (repo: RepositoryInfo | null) => {
    currentRepository.value = repo
    if (repo) {
      await window.api.repository.update(repo.id, { lastOpenedAt: new Date() })
      await Promise.all([fetchGitStatus(), fetchBranches()])
    } else {
      gitStatus.value = null
      branches.value = null
    }
  }

  const fetchGitStatus = async () => {
    if (!currentRepository.value) return

    try {
      gitStatus.value = await window.api.git.getStatus(
        currentRepository.value.path
      )
    } catch (err) {
      console.error('Failed to fetch git status:', err)
      gitStatus.value = null
    }
  }

  const fetchBranches = async () => {
    if (!currentRepository.value) return

    try {
      const result = await window.api.git.getBranches(
        currentRepository.value.path
      )
      branches.value = {
        current: result.current,
        local: result.local,
        remote: result.remote || [],
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err)
      branches.value = null
    }
  }

  const updateRepositoryBranch = async (id: number, branch: string) => {
    try {
      const result = await window.api.repository.updateBranch(id, branch)
      if (result.success && result.data) {
        const index = repositories.value.findIndex((r) => r.id === id)
        if (index !== -1) {
          repositories.value[index] = parseRepositoryDates(result.data)
        }

        if (currentRepository.value?.id === id) {
          currentRepository.value = repositories.value[index]
        }
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update branch'
      throw err
    }
  }

  const clearError = () => {
    error.value = null
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
    branches,

    // Getters
    favoriteRepositories,
    recentRepositories,
    hasChanges,
    repositoryById,

    // Actions
    loadRepositories,
    addRepository,
    openRepositoryDialog,
    removeRepository,
    toggleFavorite,
    setCurrentRepository,
    fetchGitStatus,
    fetchBranches,
    updateRepositoryBranch,
    clearError,
  }
})
