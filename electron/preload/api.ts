import { ipcRenderer } from 'electron'
import type { CloneOptions, CreateRepositoryOptions } from '../../src/shared/types/git.types'

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
    stash: (path: string, message?: string) => ipcRenderer.invoke('git:stash', path, message),
    stashPop: (path: string) => ipcRenderer.invoke('git:stash-pop', path),
    getLog: (path: string, limit?: number) => ipcRenderer.invoke('git:get-log', path, limit),
    clone: (options: CloneOptions) => ipcRenderer.invoke('git:clone', options),
    validate: (path: string) => ipcRenderer.invoke('git:validate', path),
    create: (options: CreateRepositoryOptions) => ipcRenderer.invoke('git:create', options),
    getRemoteUrl: (path: string) => ipcRenderer.invoke('git:getRemoteUrl', path),
    onCloneProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('git:clone:progress', (_, progress) => callback(progress))
      return () => ipcRenderer.removeListener('git:clone:progress', callback)
    },
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
  },
  
  repository: {
    list: () => ipcRenderer.invoke('repository:list'),
    add: (path: string) => ipcRenderer.invoke('repository:add', path),
    openDialog: () => ipcRenderer.invoke('repository:open-dialog'),
    update: (id: number, updates: any) => ipcRenderer.invoke('repository:update', id, updates),
    toggleFavorite: (id: number) => ipcRenderer.invoke('repository:toggle-favorite', id),
    delete: (id: number) => ipcRenderer.invoke('repository:delete', id),
    updateBranch: (id: number, branch: string) => ipcRenderer.invoke('repository:update-branch', id, branch),
  },
  
  shell: {
    openPath: (path: string) => ipcRenderer.invoke('shell:open-path', path),
    openTerminal: (path: string) => ipcRenderer.invoke('shell:open-terminal', path),
  },
  
  editor: {
    detect: () => ipcRenderer.invoke('editor:detect'),
    getAvailable: () => ipcRenderer.invoke('editor:get-available'),
    getDefault: () => ipcRenderer.invoke('editor:get-default'),
    openFile: (params: { editor: any; filePath: string; lineNumber?: number }) => 
      ipcRenderer.invoke('editor:open-file', params),
    openFileDefault: (params: { filePath: string; lineNumber?: number }) => 
      ipcRenderer.invoke('editor:open-file-default', params),
  }
}