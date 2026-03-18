import { ipcMain, dialog } from 'electron'
import { repositoryService } from '../services/repository.service'
import { perf } from '@shared/perf'

export function registerRepositoryHandlers() {
  // Manual refresh remote URLs — triggered by user via context menu
  perf.handle(ipcMain, 'repository:refresh-remotes', async () => {
    try {
      await repositoryService.refreshRemoteUrls()
      return { success: true }
    } catch (error) {
      console.error('Error in repository:refresh-remotes:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'repository:list', async () => {
    try {
      const repositories = await repositoryService.getAllRepositories()
      return { success: true, data: repositories }
    } catch (error) {
      console.error('Error in repository:list:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'repository:add', async (_, repoPath: string) => {
    try {
      const repository = await repositoryService.addRepository(repoPath)
      return { success: true, data: repository }
    } catch (error) {
      console.error('Error in repository:add:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'repository:open-dialog', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Git Repository'
      })

      if (result.canceled || !result.filePaths[0]) {
        return { success: false, canceled: true }
      }

      const repository = await repositoryService.addRepository(result.filePaths[0])
      return { success: true, data: repository }
    } catch (error) {
      console.error('Error in repository:open-dialog:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'repository:update', async (_, id: number, updates: any) => {
    try {
      const repository = await repositoryService.updateRepository(id, updates)
      return { success: true, data: repository }
    } catch (error) {
      console.error('Error in repository:update:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'repository:toggle-favorite', async (_, id: number) => {
    try {
      const repository = await repositoryService.toggleFavorite(id)
      return { success: true, data: repository }
    } catch (error) {
      console.error('Error in repository:toggle-favorite:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'repository:delete', async (_, id: number) => {
    try {
      await repositoryService.deleteRepository(id)
      return { success: true }
    } catch (error) {
      console.error('Error in repository:delete:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'repository:update-branch', async (_, id: number, branch: string) => {
    try {
      const repository = await repositoryService.updateRepositoryBranch(id, branch)
      return { success: true, data: repository }
    } catch (error) {
      console.error('Error in repository:update-branch:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
