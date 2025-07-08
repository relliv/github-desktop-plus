import { ipcMain, dialog } from 'electron'
import { repositoryService } from '../services/repository.service'

export function registerRepositoryHandlers() {
  // Get all repositories
  ipcMain.handle('repository:list', async () => {
    try {
      const repositories = await repositoryService.getAllRepositories()
      return { success: true, data: repositories }
    } catch (error) {
      console.error('Error in repository:list:', error)
      return { success: false, error: error.message }
    }
  })

  // Add repository
  ipcMain.handle('repository:add', async (_, repoPath: string) => {
    try {
      const repository = await repositoryService.addRepository(repoPath)
      return { success: true, data: repository }
    } catch (error) {
      console.error('Error in repository:add:', error)
      return { success: false, error: error.message }
    }
  })

  // Open repository dialog
  ipcMain.handle('repository:open-dialog', async () => {
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
      return { success: false, error: error.message }
    }
  })

  // Update repository
  ipcMain.handle('repository:update', async (_, id: number, updates: any) => {
    try {
      const repository = await repositoryService.updateRepository(id, updates)
      return { success: true, data: repository }
    } catch (error) {
      console.error('Error in repository:update:', error)
      return { success: false, error: error.message }
    }
  })

  // Toggle favorite
  ipcMain.handle('repository:toggle-favorite', async (_, id: number) => {
    try {
      const repository = await repositoryService.toggleFavorite(id)
      return { success: true, data: repository }
    } catch (error) {
      console.error('Error in repository:toggle-favorite:', error)
      return { success: false, error: error.message }
    }
  })

  // Delete repository
  ipcMain.handle('repository:delete', async (_, id: number) => {
    try {
      await repositoryService.deleteRepository(id)
      return { success: true }
    } catch (error) {
      console.error('Error in repository:delete:', error)
      return { success: false, error: error.message }
    }
  })

  // Update branch
  ipcMain.handle('repository:update-branch', async (_, id: number, branch: string) => {
    try {
      const repository = await repositoryService.updateRepositoryBranch(id, branch)
      return { success: true, data: repository }
    } catch (error) {
      console.error('Error in repository:update-branch:', error)
      return { success: false, error: error.message }
    }
  })
}