import { BrowserWindow, shell, screen } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  settingsService,
  WindowBounds,
} from '../../src/main/services/settings.service'
import { perf } from '@shared/perf'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RENDERER_DIST = path.join(__dirname, '../../dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

const CASCADE_OFFSET = 30

export class WindowManager {
  private windows = new Set<BrowserWindow>()
  private cachedSidebarData: any = null

  setCachedSidebarData(data: any) {
    this.cachedSidebarData = data
  }

  pushSidebarDataToAll(data: any) {
    this.cachedSidebarData = data
    for (const win of this.windows) {
      win.webContents.send('preloaded-sidebar-data', data)
    }
  }

  getAll(): BrowserWindow[] {
    return [...this.windows]
  }

  getCount(): number {
    return this.windows.size
  }

  private getDefaultBounds(): WindowBounds {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

    const width = Math.round(screenWidth / 2)
    const height = Math.round(screenHeight / 2)
    const x = Math.round((screenWidth - width) / 2)
    const y = Math.round((screenHeight - height) / 2)

    return { x, y, width, height, isMaximized: false }
  }

  private getCascadedBounds(base: WindowBounds): WindowBounds {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

    let x = base.x + CASCADE_OFFSET
    let y = base.y + CASCADE_OFFSET

    // Wrap around if cascaded position goes off screen
    if (x + base.width > screenWidth || y + base.height > screenHeight) {
      x = Math.round((screenWidth - base.width) / 2)
      y = Math.round((screenHeight - base.height) / 2)
    }

    return { x, y, width: base.width, height: base.height, isMaximized: false }
  }

  async createWindow(options?: { repositoryId?: number }): Promise<BrowserWindow> {
    const endCreateWindow = perf.start('main:create-window')

    // Determine bounds
    let bounds: WindowBounds
    const focusedWindow = BrowserWindow.getFocusedWindow()

    if (focusedWindow && this.windows.has(focusedWindow)) {
      // Cascade from focused window
      const focusedBounds = focusedWindow.getBounds()
      bounds = this.getCascadedBounds({
        x: focusedBounds.x,
        y: focusedBounds.y,
        width: focusedBounds.width,
        height: focusedBounds.height,
      })
    } else if (this.windows.size === 0) {
      // First window: use saved bounds or defaults
      const savedBounds = await perf.measure('main:load-window-bounds', () =>
        settingsService.getWindowBounds(),
      )
      bounds = savedBounds ?? this.getDefaultBounds()
    } else {
      // No focused window but others exist — cascade from last created
      const lastWin = [...this.windows].pop()!
      const lastBounds = lastWin.getBounds()
      bounds = this.getCascadedBounds({
        x: lastBounds.x,
        y: lastBounds.y,
        width: lastBounds.width,
        height: lastBounds.height,
      })
    }

    const isMac = process.platform === 'darwin'
    const isFirstWindow = this.windows.size === 0

    const win = new BrowserWindow({
      title: 'GitHub Desktop Plus',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      minWidth: 900,
      minHeight: 600,
      frame: false,
      icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
      show: false,
      titleBarOverlay: false,
      transparent: true,
      hasShadow: true,
      ...(isMac && {
        vibrancy: 'under-window' as const,
        visualEffectState: 'active' as const,
      }),
      webPreferences: {
        preload,
      },
    })

    // Restore maximized state for first window
    if (isFirstWindow && bounds.isMaximized) {
      win.maximize()
    }

    this.windows.add(win)
    endCreateWindow()

    // Show window when ready
    win.once('ready-to-show', () => {
      perf.mark('main:window-ready-to-show')
      if (isMac) {
        win.setVibrancy('under-window')
      }
      win.show()
    })

    // Save bounds on move/resize/close
    const saveBounds = () => {
      settingsService.saveWindowBounds({
        x: win.getBounds().x,
        y: win.getBounds().y,
        width: win.getBounds().width,
        height: win.getBounds().height,
        isMaximized: win.isMaximized(),
      })
    }
    win.on('resize', saveBounds)
    win.on('move', saveBounds)
    win.on('close', saveBounds)

    // Remove from tracking when closed
    win.on('closed', () => {
      this.windows.delete(win)
    })

    // Per-window state events → that window's renderer
    win.on('maximize', () => win.webContents.send('window:maximized', true))
    win.on('unmaximize', () => win.webContents.send('window:maximized', false))
    win.on('enter-full-screen', () => win.webContents.send('window:fullscreen', true))
    win.on('leave-full-screen', () => win.webContents.send('window:fullscreen', false))

    // Load the app
    if (VITE_DEV_SERVER_URL) {
      win.loadURL(VITE_DEV_SERVER_URL)
      // Only open DevTools for first window to avoid noise
      if (isFirstWindow) {
        win.webContents.openDevTools({ mode: 'undocked' })
      }
    } else {
      win.loadFile(indexHtml)
    }

    // Push preloaded sidebar data when content is ready
    win.webContents.on('did-finish-load', () => {
      perf.mark('main:renderer-did-finish-load')
      win.webContents.send('main-process-message', new Date().toLocaleString())
      if (this.cachedSidebarData) {
        win.webContents.send('preloaded-sidebar-data', this.cachedSidebarData)
      }
      if (options?.repositoryId) {
        win.webContents.send('open-repository', options.repositoryId)
      }
    })

    // Open external links in browser
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })

    return win
  }
}

export const windowManager = new WindowManager()
