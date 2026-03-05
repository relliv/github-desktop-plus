import { watch, onUnmounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings.store'
import { useRepositoriesStore } from '@/shared/stores'

export function useAutoRefresh() {
  const settingsStore = useSettingsStore()
  const repositoriesStore = useRepositoriesStore()

  let intervalId: ReturnType<typeof setInterval> | null = null
  const isRunning = ref(false)

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
      isRunning.value = false
    }
  }

  function start() {
    stop()
    if (!settingsStore.autoFetch) return

    const ms = settingsStore.autoFetchInterval * 60 * 1000
    if (ms <= 0) return

    intervalId = setInterval(() => refresh(), ms)
    isRunning.value = true
  }

  async function refresh() {
    const repo = repositoriesStore.currentRepository
    if (!repo) return

    await Promise.all([
      repositoriesStore.fetchGitStatus(),
      repositoriesStore.fetchBranches(),
    ])
    window.api.commits.scan(repo.id, repo.path).catch(console.error)
  }

  // Restart interval when settings change
  watch(
    () => [settingsStore.autoFetch, settingsStore.autoFetchInterval],
    () => start(),
    { immediate: true },
  )

  // Restart interval when active repository changes
  watch(
    () => repositoriesStore.currentRepository,
    () => {
      if (repositoriesStore.currentRepository) {
        start()
      } else {
        stop()
      }
    },
  )

  onUnmounted(() => stop())

  return { isRunning, refresh }
}
