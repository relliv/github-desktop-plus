import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Editor } from '@/composables/useEditor'

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  discoveredEditors: Editor[] // Editors found on the system
  selectedEditors: string[] // Array of selected editor IDs
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
    discoveredEditors: [],
    selectedEditors: [],
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
  const discoveredEditors = computed(() => settings.value.discoveredEditors)
  const selectedEditors = computed(() => settings.value.selectedEditors)
  const defaultClonePath = computed(() => settings.value.defaultClonePath)
  const autoFetch = computed(() => settings.value.autoFetch)
  const autoFetchInterval = computed(() => settings.value.autoFetchInterval)

  // Actions
  function setTheme(theme: Settings['theme']) {
    settings.value.theme = theme
    applyTheme(theme)
    saveSettings()
  }

  function toggleEditor(editorId: string) {
    const current = settings.value.selectedEditors
    if (current.includes(editorId)) {
      settings.value.selectedEditors = current.filter(id => id !== editorId)
    } else {
      settings.value.selectedEditors = [...current, editorId]
    }
    saveSettings()
  }

  function setDiscoveredEditors(editors: Editor[]) {
    settings.value.discoveredEditors = editors
    saveSettings()
  }

  function setSelectedEditors(editorIds: string[]) {
    settings.value.selectedEditors = editorIds
    saveSettings()
  }

  function isEditorSelected(editorId: string) {
    return settings.value.selectedEditors.includes(editorId)
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
    discoveredEditors,
    selectedEditors,
    defaultClonePath,
    autoFetch,
    autoFetchInterval,
    // Actions
    setTheme,
    toggleEditor,
    setDiscoveredEditors,
    setSelectedEditors,
    isEditorSelected,
    setDefaultClonePath,
    setAutoFetch,
    setAutoFetchInterval,
    updateSettings,
    loadSettings
  }
})