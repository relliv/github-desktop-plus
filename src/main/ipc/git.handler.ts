import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { GitService } from '../services/git.service'
import { 
  CloneOptions, 
  CloneProgress,
  CreateRepositoryOptions,
  RepositoryValidation
} from '../../shared/types/git.types'

export function registerGitHandlers() {
  const gitService = new GitService()

  // Clone repository
  ipcMain.handle('git:clone', async (
    event: IpcMainInvokeEvent, 
    options: CloneOptions
  ) => {
    // Send progress updates to renderer
    const onProgress = (progress: CloneProgress) => {
      event.sender.send('git:clone:progress', progress)
    }

    return await gitService.cloneRepository(options, onProgress)
  })

  // Validate repository
  ipcMain.handle('git:validate', async (
    _event: IpcMainInvokeEvent,
    path: string
  ): Promise<RepositoryValidation> => {
    return await gitService.validateRepository(path)
  })

  // Create new repository
  ipcMain.handle('git:create', async (
    _event: IpcMainInvokeEvent,
    options: CreateRepositoryOptions
  ) => {
    return await gitService.createRepository(options)
  })

  // Get current branch
  ipcMain.handle('git:getCurrentBranch', async (
    _event: IpcMainInvokeEvent,
    repoPath: string
  ): Promise<string | null> => {
    return await gitService.getCurrentBranch(repoPath)
  })

  // Get remote URL
  ipcMain.handle('git:getRemoteUrl', async (
    _event: IpcMainInvokeEvent,
    repoPath: string
  ): Promise<string | undefined> => {
    return await gitService.getRemoteUrl(repoPath)
  })
}