import { ipcMain, shell } from 'electron'

export function registerShellHandlers() {
  // Open path in system file manager
  ipcMain.handle('shell:open-path', async (_, path: string) => {
    try {
      await shell.openPath(path)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open path'
      }
    }
  })
}