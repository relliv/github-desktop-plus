/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
  api: {
    git: any
    window: any
    dialog: any
    repository: any
    shell: any
    editor: {
      detect: () => Promise<any[]>
      getAvailable: () => Promise<any[]>
      getDefault: () => Promise<any | null>
      openFile: (params: { editor: any; filePath: string; lineNumber?: number }) => Promise<{ success: boolean; error?: string }>
      openFileDefault: (params: { filePath: string; lineNumber?: number }) => Promise<{ success: boolean; error?: string }>
    }
  }
}
