import { ref, onMounted } from 'vue'
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
        result = await window.api.editor.openFile({ editor, filePath, lineNumber })
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
      'vscode': 'visualstudiocode',
      'vscode-insiders': 'visualstudiocode',
      'vscodium': 'vscodium',
      'cursor': 'cursor',
      'windsurf': 'windsurf',
      'sublime': 'sublimetext',
      'atom': 'atom',
      'webstorm': 'webstorm',
      'intellij': 'intellijidea',
      'vim': 'vim',
      'nvim': 'neovim',
      'emacs': 'gnuemacs',
      'zed': 'zedindustries',
      'xcode': 'xcode',
      'fleet': 'jetbrains',
      'android-studio': 'androidstudio',
      'nova': 'nova',
    }
    const slug = slugMap[editor.id] || editor.id
    return `https://cdn.simpleicons.org/${slug}/black/white`
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