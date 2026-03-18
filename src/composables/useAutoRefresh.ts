import { watch, onUnmounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings.store'
import { useRepositoriesStore } from '@/shared/stores'
import { perf } from '@/shared/perf'

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

    return perf.measure('auto-refresh:cycle', async () => {
      await Promise.all([
        repositoriesStore.fetchGitStatus(),
        repositoriesStore.fetchBranches(),
      ])
      window.api.commits.scan(repo.id, repo.path).catch(console.error)
    })
  }

  // Defer auto-refresh start to avoid competing with initial load
  const deferTimer = setTimeout(() => {
    start()

    // Restart interval when settings change
    watch(
      () => [settingsStore.autoFetch, settingsStore.autoFetchInterval],
      () => start(),
    )
  }, 5_000)

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

  onUnmounted(() => {
    clearTimeout(deferTimer)
    stop()
  })

  return { isRunning, refresh }
}
