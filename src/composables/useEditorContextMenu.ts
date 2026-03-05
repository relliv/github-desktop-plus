import { computed } from 'vue'
import { useEditor } from './useEditor'
import { useSettingsStore } from '@/stores/settings.store'

export function useEditorContextMenu() {
  const settingsStore = useSettingsStore()
  const { openInEditor, getEditorIconUrl } = useEditor()

  // Get only the selected editors from the store
  const contextMenuEditors = computed(() => {
    return settingsStore.discoveredEditors.filter(editor =>
      settingsStore.isEditorSelected(editor.id)
    )
  })
  
  const hasSelectedEditors = computed(() => contextMenuEditors.value.length > 0)
  
  const openFileInEditor = async (filePath: string, editor: any, lineNumber?: number) => {
    await openInEditor(filePath, editor, lineNumber)
  }
  
  return {
    contextMenuEditors,
    hasSelectedEditors,
    openFileInEditor,
    getEditorIconUrl
  }
}