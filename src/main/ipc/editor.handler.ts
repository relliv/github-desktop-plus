import { ipcMain } from 'electron'
import { editorDetector, type Editor } from '../services/editor-detector.service'

export function registerEditorHandlers() {
  // Detect all available editors
  ipcMain.handle('editor:detect', async (): Promise<Editor[]> => {
    try {
      return await editorDetector.detectEditors()
    } catch (error) {
      console.error('Failed to detect editors:', error)
      return []
    }
  })

  // Get available editors (cached)
  ipcMain.handle('editor:get-available', (): Editor[] => {
    return editorDetector.getAvailableEditors()
  })

  // Get default editor
  ipcMain.handle('editor:get-default', async (): Promise<Editor | null> => {
    try {
      return await editorDetector.getDefaultEditor()
    } catch (error) {
      console.error('Failed to get default editor:', error)
      return null
    }
  })

  // Open file in specific editor
  ipcMain.handle('editor:open-file', async (_, { editor, filePath, lineNumber }: { 
    editor: Editor, 
    filePath: string, 
    lineNumber?: number 
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      await editorDetector.openInEditor(editor, filePath, lineNumber)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Open file in default editor
  ipcMain.handle('editor:open-file-default', async (_, { filePath, lineNumber }: { 
    filePath: string, 
    lineNumber?: number 
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const defaultEditor = await editorDetector.getDefaultEditor()
      if (!defaultEditor) {
        return { 
          success: false, 
          error: 'No default editor found' 
        }
      }
      
      await editorDetector.openInEditor(defaultEditor, filePath, lineNumber)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })
}