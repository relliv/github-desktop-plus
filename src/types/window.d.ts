import type { CommitsAPI } from '../preload/api.d'

declare global {
  interface Window {
    api: {
      git: {
        openRepository: (path: string) => Promise<any>
        getStatus: (path: string) => Promise<any>
        getBranches: (path: string) => Promise<any>
        checkout: (path: string, branch: string) => Promise<any>
        createBranch: (path: string, name: string) => Promise<any>
        stage: (path: string, files: string[]) => Promise<any>
        unstage: (path: string, files: string[]) => Promise<any>
        commit: (path: string, message: string) => Promise<any>
        push: (path: string) => Promise<any>
        pull: (path: string) => Promise<any>
        fetch: (path: string) => Promise<any>
        stash: (path: string, message?: string) => Promise<any>
        stashPop: (path: string) => Promise<any>
        getLog: (path: string, limit?: number) => Promise<any>
        clone: (options: any) => Promise<any>
        validate: (path: string) => Promise<any>
        create: (options: any) => Promise<any>
        getRemoteUrl: (path: string) => Promise<any>
        onCloneProgress: (callback: (progress: any) => void) => () => void
      }
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
        onMaximized: (callback: (maximized: boolean) => void) => void
        onFullScreen: (callback: (fullscreen: boolean) => void) => void
      }
      dialog: {
        openDirectory: () => Promise<string | null>
        showMessage: (options: any) => Promise<any>
      }
      repository: {
        list: () => Promise<any>
        add: (path: string) => Promise<any>
        openDialog: () => Promise<any>
        update: (id: number, updates: any) => Promise<any>
        toggleFavorite: (id: number) => Promise<any>
        delete: (id: number) => Promise<any>
        updateBranch: (id: number, branch: string) => Promise<any>
      }
      commits: CommitsAPI
      shell: {
        openPath: (path: string) => Promise<any>
        openTerminal: (path: string) => Promise<any>
      }
      editor: {
        detect: () => Promise<any>
        getAvailable: () => Promise<any>
        getDefault: () => Promise<any>
        openFile: (params: { editor: any; filePath: string; lineNumber?: number }) => Promise<any>
        openFileDefault: (params: { filePath: string; lineNumber?: number }) => Promise<any>
      }
    }
  }
}

export {}
