import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings.store'

export interface Editor {
  name: string
  id: string
  executable: string
  icon?: string
  available: boolean
}

export function useEditor() {
  const settingsStore = useSettingsStore()
  const availableEditors = ref<Editor[]>(settingsStore.discoveredEditors)
  const defaultEditor = ref<Editor | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isDark = ref(document.documentElement.classList.contains('dark'))

  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  onUnmounted(() => {
    observer.disconnect()
  })

  const detectEditors = async () => {
    loading.value = true
    error.value = null

    try {
      const editors = await window.api.editor.detect()
      availableEditors.value = editors
      settingsStore.setDiscoveredEditors(editors)

      // Also get the default editor
      const defaultEd = await window.api.editor.getDefault()
      defaultEditor.value = defaultEd
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to detect editors'
      console.error('Failed to detect editors:', err)
    } finally {
      loading.value = false
    }
  }

  const openInEditor = async (filePath: string, editor?: Editor, lineNumber?: number) => {
    try {
      let result
      if (editor) {
        const plainEditor = { ...editor }
        result = await window.api.editor.openFile({ editor: plainEditor, filePath, lineNumber })
      } else {
        result = await window.api.editor.openFileDefault({ filePath, lineNumber })
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to open file')
      }
    } catch (err) {
      console.error('Failed to open file in editor:', err)
      throw err
    }
  }

  const getEditorIconUrl = (editor: Editor): string => {
    const slugMap: Record<string, string> = {
      'vscode': 'vscodium',
      'vscode-insiders': 'vscodium',
      'vscodium': 'vscodium',
      'cursor': 'cursor',
      'windsurf': 'windsurf',
      'sublime': 'sublimetext',
      'webstorm': 'webstorm',
      'intellij': 'intellijidea',
      'vim': 'vim',
      'nvim': 'neovim',
      'emacs': 'gnuemacs',
      'zed': 'zedindustries',
      'xcode': 'xcode',
      'fleet': 'intellijidea',
      'android-studio': 'androidstudio',
    }
    const slug = slugMap[editor.id] || editor.id
    const color = isDark.value ? 'white' : 'black'
    return `https://cdn.simpleicons.org/${slug}/${color}`
  }

  onMounted(() => {
    detectEditors()
  })

  return {
    availableEditors,
    defaultEditor,
    loading,
    error,
    detectEditors,
    openInEditor,
    getEditorIconUrl
  }
}