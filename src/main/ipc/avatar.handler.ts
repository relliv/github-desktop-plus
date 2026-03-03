import { ipcMain } from 'electron'
import { avatarService } from '../services/avatar.service'

export function registerAvatarHandlers() {
  ipcMain.handle('avatar:get', async (_, email: string) => {
    try {
      const avatarUrl = await avatarService.getAvatar(email)
      return { success: true, data: avatarUrl }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('avatar:get-batch', async (_, emails: string[]) => {
    try {
      const avatars = await avatarService.getAvatars(emails)
      return { success: true, data: avatars }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('avatar:get-owner', async (_, owner: string) => {
    try {
      const avatarUrl = await avatarService.getOwnerAvatar(owner)
      return { success: true, data: avatarUrl }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('avatar:get-owners', async (_, owners: string[]) => {
    try {
      const avatars = await avatarService.getOwnerAvatars(owners)
      return { success: true, data: avatars }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
