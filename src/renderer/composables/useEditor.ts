import { ref, onMounted } from 'vue'

export interface Editor {
  name: string
  id: string
  executable: string
  icon?: string
  available: boolean
}

export function useEditor() {
  const availableEditors = ref<Editor[]>([])
  const defaultEditor = ref<Editor | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const detectEditors = async () => {
    loading.value = true
    error.value = null
    
    try {
      const editors = await window.api.editor.detect()
      availableEditors.value = editors
      
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

  const getEditorIcon = (editor: Editor): string => {
    // Map editor IDs to icon names (you can use lucide-vue-next icons)
    const iconMap: Record<string, string> = {
      'vscode': 'FileCode2',
      'vscode-insiders': 'FileCode2',
      'vscodium': 'FileCode2',
      'cursor': 'MousePointer2',
      'sublime': 'FileText',
      'atom': 'Atom',
      'webstorm': 'Globe',
      'intellij': 'Lightbulb',
      'vim': 'Terminal',
      'nvim': 'Terminal',
      'emacs': 'FileText',
      'zed': 'Zap',
      'xcode': 'Hammer',
    }
    
    return iconMap[editor.id] || 'FileText'
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
    getEditorIcon
  }
}