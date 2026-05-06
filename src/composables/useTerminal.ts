import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings.store'

export interface Terminal {
  id: string
  name: string
  executable: string
  available: boolean
}

export function useTerminal() {
  const settingsStore = useSettingsStore()
  const availableTerminals = ref<Terminal[]>(settingsStore.discoveredTerminals)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isDark = ref(document.documentElement.classList.contains('dark'))

  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  onUnmounted(() => observer.disconnect())

  const detectTerminals = async () => {
    loading.value = true
    error.value = null
    try {
      const terminals: Terminal[] = await window.api.terminal.detect()
      availableTerminals.value = terminals
      settingsStore.setDiscoveredTerminals(terminals)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to detect terminals'
      console.error('Failed to detect terminals:', err)
    } finally {
      loading.value = false
    }
  }

  const openInTerminal = async (cwd: string, terminal: Terminal) => {
    const plain = { ...terminal }
    const result = await window.api.terminal.open({ terminal: plain, cwd })
    if (!result.success) {
      throw new Error(result.error || 'Failed to open terminal')
    }
  }

  const getTerminalIconUrl = (terminal: Terminal): string => {
    const slugMap: Record<string, string> = {
      terminal: 'apple',
      iterm: 'iterm2',
      warp: 'warp',
      hyper: 'hyper',
      tabby: 'tabby',
      ghostty: 'ghostty',
      alacritty: 'alacritty',
      kitty: 'kitty',
      wezterm: 'wezterm',
      'windows-terminal': 'windowsterminal',
      powershell: 'powershell',
      pwsh: 'powershell',
      cmd: 'windows',
      'git-bash': 'gitforwindows',
      'gnome-terminal': 'gnometerminal',
      konsole: 'kde',
      'xfce4-terminal': 'xfce',
      tilix: 'tilix',
      terminator: 'gnometerminal',
      xterm: 'gnu',
    }
    const slug = slugMap[terminal.id] || 'gnubash'
    const color = isDark.value ? 'white' : 'black'
    return `https://cdn.simpleicons.org/${slug}/${color}`
  }

  onMounted(() => {
    detectTerminals()
  })

  return {
    availableTerminals,
    loading,
    error,
    detectTerminals,
    openInTerminal,
    getTerminalIconUrl,
  }
}
