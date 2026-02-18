import { app, BrowserWindow, shell, ipcMain, screen } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { settingsService, WindowBounds } from '../../src/main/services/settings.service'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

function getDefaultWindowBounds(): WindowBounds {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  const width = Math.round(screenWidth / 2)
  const height = Math.round(screenHeight / 2)
  const x = Math.round((screenWidth - width) / 2)
  const y = Math.round((screenHeight - height) / 2)

  return { x, y, width, height, isMaximized: false }
}

function saveWindowBounds() {
  if (!win) return

  const isMaximized = win.isMaximized()
  const bounds = win.getBounds()

  settingsService.saveWindowBounds({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized,
  })
}

async function createWindow() {
  // Load saved bounds or use defaults
  const savedBounds = await settingsService.getWindowBounds()
  const bounds = savedBounds ?? getDefaultWindowBounds()

  win = new BrowserWindow({
    title: 'GitHub Desktop Plus',
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    show: false, // Don't show until ready
    titleBarOverlay: false,
    hasShadow: true,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  // Restore maximized state if it was maximized
  if (savedBounds?.isMaximized) {
    win.maximize()
  }

  // Show window when ready
  win.once('ready-to-show', () => {
    win?.show()
  })

  // Save bounds when window is moved, resized, or closed
  win.on('resize', saveWindowBounds)
  win.on('move', saveWindowBounds)
  win.on('close', saveWindowBounds)

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  
  // Register window handlers after window is created
  const { registerWindowHandlers } = await import('./ipc/window.handler')
  registerWindowHandlers(win)
  
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(async () => {
  createWindow()
  
  // Register repository handlers after app is ready
  const { registerRepositoryHandlers } = await import('../../src/main/ipc/repository.handler')
  registerRepositoryHandlers()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// Register IPC handlers
import { registerGitHandlers } from './ipc/git.handler'
import { registerShellHandlers } from './ipc/shell.handler'
import { registerEditorHandlers } from './ipc/editor.handler'

registerGitHandlers()
registerShellHandlers()
registerEditorHandlers()
