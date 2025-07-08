import { ipcMain, BrowserWindow, dialog } from 'electron'

export function registerWindowHandlers(win: BrowserWindow) {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    win.minimize()
  })
  
  ipcMain.handle('window:maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })
  
  ipcMain.handle('window:close', () => {
    win.close()
  })
  
  ipcMain.handle('window:is-maximized', () => {
    return win.isMaximized()
  })
  
  // Dialog handlers
  ipcMain.handle('dialog:open-directory', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })
  
  ipcMain.handle('dialog:show-message', async (_, options: Electron.MessageBoxOptions) => {
    return dialog.showMessageBox(win, options)
  })
  
  // Window state listeners
  win.on('maximize', () => {
    win.webContents.send('window:maximized', true)
  })
  
  win.on('unmaximize', () => {
    win.webContents.send('window:maximized', false)
  })
  
  win.on('enter-full-screen', () => {
    win.webContents.send('window:fullscreen', true)
  })
  
  win.on('leave-full-screen', () => {
    win.webContents.send('window:fullscreen', false)
  })
}