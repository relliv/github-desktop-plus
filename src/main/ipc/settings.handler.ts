import { ipcMain } from 'electron'
import { settingsService } from '../services/settings.service'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async (_, key: string) => {
    try {
      const value = await settingsService.getSetting(key)
      return { success: true, data: value }
    } catch (error) {
      console.error('Error in settings:get:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('settings:set', async (_, key: string, value: string) => {
    try {
      await settingsService.setSetting(key, value)
      return { success: true }
    } catch (error) {
      console.error('Error in settings:set:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
