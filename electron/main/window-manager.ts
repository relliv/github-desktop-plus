import { BrowserWindow, shell, screen, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  settingsService,
  WindowBounds,
  WindowState,
} from '../../src/main/services/settings.service'
import { perf } from '@shared/perf'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RENDERER_DIST = path.join(__dirname, '../../dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

const CASCADE_OFFSET = 30
const SAVE_DEBOUNCE_MS = 500

export class WindowManager {
  private windows = new Set<BrowserWindow>()
  private windowRepoMap = new Map<BrowserWindow, number | null>()
  private cachedSidebarData: any = null
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private isRestoringSession = false

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

  setWindowRepository(win: BrowserWindow, repositoryId: number | null) {
    this.windowRepoMap.set(win, repositoryId)
    this.scheduleSaveStates()
  }

  registerIpcHandlers() {
    // Renderer reports which repository it has open
    ipcMain.on('window:set-repository', (event, repositoryId: number | null) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        this.windowRepoMap.set(win, repositoryId)
        this.scheduleSaveStates()
      }
    })
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

    if (x + base.width > screenWidth || y + base.height > screenHeight) {
      x = Math.round((screenWidth - base.width) / 2)
      y = Math.round((screenHeight - base.height) / 2)
    }

    return { x, y, width: base.width, height: base.height, isMaximized: false }
  }

  private collectWindowStates(): WindowState[] {
    const states: WindowState[] = []
    for (const win of this.windows) {
      if (win.isDestroyed()) continue
      const bounds = win.getBounds()
      states.push({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: win.isMaximized(),
        repositoryId: this.windowRepoMap.get(win) ?? null,
      })
    }
    return states
  }

  private scheduleSaveStates() {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      const states = this.collectWindowStates()
      settingsService.saveWindowStates(states).catch(console.error)
    }, SAVE_DEBOUNCE_MS)
  }

  async restoreSession(): Promise<boolean> {
    const savedStates = await settingsService.getWindowStates()
    if (savedStates.length === 0) return false

    this.isRestoringSession = true
    for (const state of savedStates) {
      await this.createWindow({
        repositoryId: state.repositoryId ?? undefined,
        bounds: state,
      })
    }
    this.isRestoringSession = false
    return true
  }

  async createWindow(options?: {
    repositoryId?: number
    bounds?: WindowBounds
  }): Promise<BrowserWindow> {
    const endCreateWindow = perf.start('main:create-window')

    let bounds: WindowBounds

    if (options?.bounds) {
      // Use explicit bounds (from session restore)
      bounds = options.bounds
    } else {
      const focusedWindow = BrowserWindow.getFocusedWindow()

      if (focusedWindow && this.windows.has(focusedWindow)) {
        const focusedBounds = focusedWindow.getBounds()
        bounds = this.getCascadedBounds({
          x: focusedBounds.x,
          y: focusedBounds.y,
          width: focusedBounds.width,
          height: focusedBounds.height,
        })
      } else if (this.windows.size === 0) {
        const savedBounds = await perf.measure('main:load-window-bounds', () =>
          settingsService.getWindowBounds(),
        )
        bounds = savedBounds ?? this.getDefaultBounds()
      } else {
        const lastWin = [...this.windows].pop()!
        const lastBounds = lastWin.getBounds()
        bounds = this.getCascadedBounds({
          x: lastBounds.x,
          y: lastBounds.y,
          width: lastBounds.width,
          height: lastBounds.height,
        })
      }
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

    if (bounds.isMaximized) {
      win.maximize()
    }

    this.windows.add(win)
    this.windowRepoMap.set(win, options?.repositoryId ?? null)
    endCreateWindow()

    win.once('ready-to-show', () => {
      perf.mark('main:window-ready-to-show')
      if (isMac) {
        win.setVibrancy('under-window')
      }
      win.show()
    })

    // Save states on move/resize
    const onBoundsChange = () => this.scheduleSaveStates()
    win.on('resize', onBoundsChange)
    win.on('move', onBoundsChange)

    // On close: save states immediately, then remove from tracking
    win.on('close', () => {
      const states = this.collectWindowStates()
      settingsService.saveWindowStates(states).catch(console.error)
    })

    win.on('closed', () => {
      this.windows.delete(win)
      this.windowRepoMap.delete(win)
      // Save updated states after removal (remaining windows)
      this.scheduleSaveStates()
    })

    // Per-window state events
    win.on('maximize', () => {
      win.webContents.send('window:maximized', true)
      this.scheduleSaveStates()
    })
    win.on('unmaximize', () => {
      win.webContents.send('window:maximized', false)
      this.scheduleSaveStates()
    })
    win.on('enter-full-screen', () => win.webContents.send('window:fullscreen', true))
    win.on('leave-full-screen', () => win.webContents.send('window:fullscreen', false))

    // Load the app
    if (VITE_DEV_SERVER_URL) {
      win.loadURL(VITE_DEV_SERVER_URL)
      if (isFirstWindow && !this.isRestoringSession) {
        win.webContents.openDevTools({ mode: 'undocked' })
      }
    } else {
      win.loadFile(indexHtml)
    }

    // Push data when content is ready
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

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })

    return win
  }
}

export const windowManager = new WindowManager()
