import { ipcRenderer } from 'electron'

export const api = {
  git: {
    openRepository: (path: string) => ipcRenderer.invoke('git:open-repository', path),
    getStatus: (path: string) => ipcRenderer.invoke('git:get-status', path),
    getBranches: (path: string) => ipcRenderer.invoke('git:get-branches', path),
    checkout: (path: string, branch: string) => ipcRenderer.invoke('git:checkout', path, branch),
    createBranch: (path: string, name: string) => ipcRenderer.invoke('git:create-branch', path, name),
    stage: (path: string, files: string[]) => ipcRenderer.invoke('git:stage', path, files),
    unstage: (path: string, files: string[]) => ipcRenderer.invoke('git:unstage', path, files),
    commit: (path: string, message: string) => ipcRenderer.invoke('git:commit', path, message),
    push: (path: string) => ipcRenderer.invoke('git:push', path),
    pull: (path: string) => ipcRenderer.invoke('git:pull', path),
    fetch: (path: string) => ipcRenderer.invoke('git:fetch', path),
    getLog: (path: string, limit?: number) => ipcRenderer.invoke('git:get-log', path, limit),
    clone: (url: string, path: string) => ipcRenderer.invoke('git:clone', url, path),
  },
  
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onMaximized: (callback: (maximized: boolean) => void) => {
      ipcRenderer.on('window:maximized', (_, maximized) => callback(maximized))
    },
    onFullScreen: (callback: (fullscreen: boolean) => void) => {
      ipcRenderer.on('window:fullscreen', (_, fullscreen) => callback(fullscreen))
    }
  },
  
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
    showMessage: (options: any) => ipcRenderer.invoke('dialog:show-message', options),
  }
}