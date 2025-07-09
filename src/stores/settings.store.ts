import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  externalEditor?: string
  defaultClonePath?: string
  autoFetch: boolean
  autoFetchInterval: number // minutes
  showLineNumbers: boolean
  syntaxHighlighting: boolean
  fontSize: number
  fontFamily: string
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<Settings>({
    theme: 'system',
    externalEditor: undefined,
    defaultClonePath: undefined,
    autoFetch: true,
    autoFetchInterval: 10,
    showLineNumbers: true,
    syntaxHighlighting: true,
    fontSize: 14,
    fontFamily: 'monospace'
  })

  // Getters
  const theme = computed(() => settings.value.theme)
  const externalEditor = computed(() => settings.value.externalEditor)
  const defaultClonePath = computed(() => settings.value.defaultClonePath)
  const autoFetch = computed(() => settings.value.autoFetch)
  const autoFetchInterval = computed(() => settings.value.autoFetchInterval)

  // Actions
  function setTheme(theme: Settings['theme']) {
    settings.value.theme = theme
    applyTheme(theme)
    saveSettings()
  }

  function setExternalEditor(editorId: string | undefined) {
    settings.value.externalEditor = editorId
    saveSettings()
  }

  function setDefaultClonePath(path: string | undefined) {
    settings.value.defaultClonePath = path
    saveSettings()
  }

  function setAutoFetch(enabled: boolean) {
    settings.value.autoFetch = enabled
    saveSettings()
  }

  function setAutoFetchInterval(minutes: number) {
    settings.value.autoFetchInterval = minutes
    saveSettings()
  }

  function updateSettings(updates: Partial<Settings>) {
    settings.value = { ...settings.value, ...updates }
    saveSettings()
  }

  // Persistence
  function saveSettings() {
    localStorage.setItem('github-desktop-plus-settings', JSON.stringify(settings.value))
  }

  function loadSettings() {
    const saved = localStorage.getItem('github-desktop-plus-settings')
    if (saved) {
      try {
        settings.value = { ...settings.value, ...JSON.parse(saved) }
        applyTheme(settings.value.theme)
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }

  function applyTheme(theme: Settings['theme']) {
    const root = document.documentElement
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }

  // Initialize
  loadSettings()

  // Watch for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (settings.value.theme === 'system') {
      applyTheme('system')
    }
  })

  return {
    // State
    settings,
    // Getters
    theme,
    externalEditor,
    defaultClonePath,
    autoFetch,
    autoFetchInterval,
    // Actions
    setTheme,
    setExternalEditor,
    setDefaultClonePath,
    setAutoFetch,
    setAutoFetchInterval,
    updateSettings,
    loadSettings
  }
})