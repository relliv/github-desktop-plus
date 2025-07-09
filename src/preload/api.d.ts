import type { Editor } from '../main/services/editor-detector.service'

export interface EditorAPI {
  detect: () => Promise<Editor[]>
  getAvailable: () => Promise<Editor[]>
  getDefault: () => Promise<Editor | null>
  openFile: (params: { 
    editor: Editor
    filePath: string
    lineNumber?: number 
  }) => Promise<{ success: boolean; error?: string }>
  openFileDefault: (params: { 
    filePath: string
    lineNumber?: number 
  }) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    api: {
      editor: EditorAPI
      // Add other API namespaces here
    }
  }
}