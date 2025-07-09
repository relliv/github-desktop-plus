import { ipcMain, shell } from 'electron'
import { exec } from 'child_process'
import { platform } from 'os'

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

  // Open terminal at path
  ipcMain.handle('shell:open-terminal', async (_, path: string) => {
    try {
      const os = platform()
      
      if (os === 'darwin') {
        // macOS: Open Terminal.app
        exec(`open -a Terminal "${path}"`)
      } else if (os === 'win32') {
        // Windows: Open Command Prompt
        exec(`start cmd /K "cd /d ${path}"`)
      } else {
        // Linux: Try common terminal emulators
        const terminals = ['gnome-terminal', 'konsole', 'xterm', 'terminator']
        let opened = false
        
        for (const terminal of terminals) {
          try {
            exec(`${terminal} --working-directory="${path}"`)
            opened = true
            break
          } catch (e) {
            // Try next terminal
          }
        }
        
        if (!opened) {
          throw new Error('No supported terminal found')
        }
      }
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open terminal'
      }
    }
  })
}