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

export interface CommitsAPI {
  scan: (repositoryId: number, repoPath: string) => Promise<any>
  fullScan: (repositoryId: number, repoPath: string) => Promise<any>
  list: (repositoryId: number, offset?: number, limit?: number) => Promise<any>
  count: (repositoryId: number) => Promise<any>
  files: (repoPath: string, commitHash: string) => Promise<any>
  fileDiff: (repoPath: string, commitHash: string, filePath: string) => Promise<any>
  onScanProgress: (callback: (data: { repositoryId: number; scanned: number; total: number }) => void) => () => void
  onScanComplete: (callback: (data: { repositoryId: number; added: number }) => void) => () => void
}
