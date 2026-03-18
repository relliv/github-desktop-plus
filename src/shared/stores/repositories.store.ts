import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RepositoryInfo } from '../types/git.types'
import { perf } from '../perf'

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
    const endLoad = perf.start('store:load-repositories')
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
      endLoad()
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

  // Guards to prevent duplicate concurrent operations
  let _statusInFlight: string | null = null
  let _branchesInFlight: string | null = null
  let _scanInFlight: number | null = null

  const setCurrentRepository = (repo: RepositoryInfo | null) => {
    // Skip if already set to the same repo
    if (repo?.id === currentRepository.value?.id && repo !== null) return

    currentRepository.value = repo
    if (repo) {
      perf.mark(`store:set-current-repo(${repo.name})`)

      // Fire all background operations in parallel — don't block UI, don't chain
      window.api.repository.update(repo.id, { lastOpenedAt: new Date() }).catch(console.error)
      fetchGitStatus().catch(console.error)
      fetchBranches().catch(console.error)

      // Deduplicate commit scan
      if (_scanInFlight !== repo.id) {
        _scanInFlight = repo.id
        window.api.commits.scan(repo.id, repo.path)
          .catch(console.error)
          .finally(() => { _scanInFlight = null })
      }
    } else {
      gitStatus.value = null
      branches.value = null
    }
  }

  const fetchGitStatus = async () => {
    if (!currentRepository.value) return
    const repoPath = currentRepository.value.path

    // Skip if already fetching status for this repo
    if (_statusInFlight === repoPath) return
    _statusInFlight = repoPath

    return perf.measure('store:fetch-git-status', async () => {
      try {
        const result = await window.api.git.getStatus(repoPath)
        // Only apply if still the current repo (user may have switched)
        if (currentRepository.value?.path === repoPath) {
          gitStatus.value = result
        }
      } catch (err) {
        console.error('Failed to fetch git status:', err)
        if (currentRepository.value?.path === repoPath) {
          gitStatus.value = null
        }
      } finally {
        if (_statusInFlight === repoPath) _statusInFlight = null
      }
    })
  }

  const fetchBranches = async () => {
    if (!currentRepository.value) return
    const repoPath = currentRepository.value.path

    // Skip if already fetching branches for this repo
    if (_branchesInFlight === repoPath) return
    _branchesInFlight = repoPath

    return perf.measure('store:fetch-branches', async () => {
      try {
        const result = await window.api.git.getBranches(repoPath)
        // Only apply if still the current repo
        if (currentRepository.value?.path !== repoPath) return

        branches.value = {
          current: result.current,
          local: result.local,
          remote: result.remote || [],
        }

        // Update current branch in repository if it changed and persist to DB
        if (currentRepository.value.currentBranch !== result.current) {
          const repoId = currentRepository.value.id
          const index = repositories.value.findIndex((r) => r.id === repoId)
          if (index !== -1) {
            await window.api.repository.updateBranch(repoId, result.current)
            repositories.value[index] = {
              ...repositories.value[index],
              currentBranch: result.current,
            }
            // Update in place — don't reassign currentRepository to avoid re-triggering watchers
            currentRepository.value.currentBranch = result.current
          }
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err)
        if (currentRepository.value?.path === repoPath) {
          branches.value = null
        }
      } finally {
        if (_branchesInFlight === repoPath) _branchesInFlight = null
      }
    })
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

  // Repositories are loaded on-demand by components calling loadRepositories()

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
