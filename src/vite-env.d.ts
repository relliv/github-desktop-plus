/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue-virtual-scroller' {
  import type { DefineComponent } from 'vue'
  export const RecycleScroller: DefineComponent<{
    items: any[]
    itemSize?: number | null
    keyField?: string
    direction?: 'vertical' | 'horizontal'
    buffer?: number
    pageMode?: boolean
    prerender?: number
    emitUpdate?: boolean
  }>
  export const DynamicScroller: DefineComponent<any>
  export const DynamicScrollerItem: DefineComponent<any>
}

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
  api: {
    git: any
    window: any
    dialog: any
    repository: any
    commits: {
      scan: (repositoryId: number, repoPath: string) => Promise<any>
      fullScan: (repositoryId: number, repoPath: string) => Promise<any>
      list: (repositoryId: number, offset?: number, limit?: number) => Promise<any>
      count: (repositoryId: number) => Promise<any>
      files: (repoPath: string, commitHash: string) => Promise<any>
      fileDiff: (repoPath: string, commitHash: string, filePath: string) => Promise<any>
      onScanProgress: (callback: (data: { repositoryId: number; scanned: number; total: number }) => void) => () => void
      onScanComplete: (callback: (data: { repositoryId: number; added: number }) => void) => () => void
    }
    shell: {
      openPath: (path: string) => Promise<{ success: boolean; error?: string }>
      openTerminal: (path: string) => Promise<{ success: boolean; error?: string }>
    }
    editor: {
      detect: () => Promise<any[]>
      getAvailable: () => Promise<any[]>
      getDefault: () => Promise<any | null>
      openFile: (params: { editor: any; filePath: string; lineNumber?: number }) => Promise<{ success: boolean; error?: string }>
      openFileDefault: (params: { filePath: string; lineNumber?: number }) => Promise<{ success: boolean; error?: string }>
    }
  }
}
