import { computed } from 'vue'
import { useEditor } from './useEditor'
import { useSettingsStore } from '@/stores/settings.store'

export function useEditorContextMenu() {
  const settingsStore = useSettingsStore()
  const { availableEditors, openInEditor, getEditorIcon } = useEditor()
  
  // Get only the selected editors that are available
  const contextMenuEditors = computed(() => {
    return availableEditors.value.filter(editor => 
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
    getEditorIcon
  }
}