import { computed } from 'vue'
import { useTerminal } from './useTerminal'
import { useSettingsStore } from '@/stores/settings.store'

export function useTerminalContextMenu() {
  const settingsStore = useSettingsStore()
  const { openInTerminal, getTerminalIconUrl } = useTerminal()

  const contextMenuTerminals = computed(() => {
    return settingsStore.discoveredTerminals.filter((terminal) =>
      settingsStore.isTerminalSelected(terminal.id),
    )
  })

  const hasSelectedTerminals = computed(() => contextMenuTerminals.value.length > 0)

  return {
    contextMenuTerminals,
    hasSelectedTerminals,
    openInTerminal,
    getTerminalIconUrl,
  }
}
