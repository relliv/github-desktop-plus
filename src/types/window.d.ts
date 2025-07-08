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
        getLog: (path: string, limit?: number) => Promise<any>
        clone: (url: string, path: string) => Promise<any>
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
    }
  }
}

export {}