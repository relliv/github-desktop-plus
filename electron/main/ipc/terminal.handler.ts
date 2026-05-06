import { ipcMain } from 'electron'
import { terminalDetector, Terminal } from '../services/terminal-detector'

export function registerTerminalHandlers() {
  ipcMain.handle('terminal:detect', () => {
    try {
      return terminalDetector.detectTerminals()
    } catch (error) {
      console.error('Failed to detect terminals:', error)
      return []
    }
  })

  ipcMain.handle('terminal:get-available', () => {
    return terminalDetector.getAvailableTerminals()
  })

  ipcMain.handle(
    'terminal:open',
    async (_, { terminal, cwd }: { terminal: Terminal; cwd: string }) => {
      try {
        await terminalDetector.openInTerminal(terminal, cwd)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to open terminal',
        }
      }
    },
  )
}
