import { app } from 'electron'
import { existsSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'

export interface Editor {
  name: string
  id: string
  executable: string
  icon?: string
  available: boolean
}

export class EditorDetectorService {
  private editors: Editor[] = []

  // Common editor configurations
  private readonly editorConfigs = {
    darwin: [
      // Visual Studio Code variants
      { name: 'Visual Studio Code', id: 'vscode', paths: ['/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'], command: 'code' },
      { name: 'Visual Studio Code - Insiders', id: 'vscode-insiders', paths: ['/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code-insiders'], command: 'code-insiders' },
      { name: 'VSCodium', id: 'vscodium', paths: ['/Applications/VSCodium.app/Contents/Resources/app/bin/codium'], command: 'codium' },
      { name: 'Cursor', id: 'cursor', paths: ['/Applications/Cursor.app/Contents/Resources/app/bin/cursor'], command: 'cursor' },
      
      // JetBrains IDEs
      { name: 'WebStorm', id: 'webstorm', paths: ['/Applications/WebStorm.app/Contents/MacOS/webstorm'], command: 'webstorm' },
      { name: 'IntelliJ IDEA', id: 'intellij', paths: ['/Applications/IntelliJ IDEA.app/Contents/MacOS/idea'], command: 'idea' },
      { name: 'PyCharm', id: 'pycharm', paths: ['/Applications/PyCharm.app/Contents/MacOS/pycharm'], command: 'pycharm' },
      { name: 'GoLand', id: 'goland', paths: ['/Applications/GoLand.app/Contents/MacOS/goland'], command: 'goland' },
      { name: 'Fleet', id: 'fleet', paths: ['/Applications/Fleet.app/Contents/MacOS/Fleet'], command: 'fleet' },
      
      // Other popular editors
      { name: 'Sublime Text', id: 'sublime', paths: ['/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl'], command: 'subl' },
      { name: 'Atom', id: 'atom', paths: ['/Applications/Atom.app/Contents/Resources/app/atom.sh'], command: 'atom' },
      { name: 'Zed', id: 'zed', paths: ['/Applications/Zed.app/Contents/MacOS/zed'], command: 'zed' },
      { name: 'Nova', id: 'nova', paths: ['/Applications/Nova.app/Contents/MacOS/Nova'], command: 'nova' },
      { name: 'TextMate', id: 'textmate', paths: ['/Applications/TextMate.app/Contents/MacOS/TextMate'], command: 'mate' },
      { name: 'BBEdit', id: 'bbedit', paths: ['/Applications/BBEdit.app/Contents/MacOS/BBEdit'], command: 'bbedit' },
      { name: 'Xcode', id: 'xcode', paths: ['/Applications/Xcode.app/Contents/MacOS/Xcode'], command: 'xcode' },
      
      // Terminal editors
      { name: 'Vim', id: 'vim', paths: [], command: 'vim' },
      { name: 'NeoVim', id: 'nvim', paths: [], command: 'nvim' },
      { name: 'Emacs', id: 'emacs', paths: [], command: 'emacs' },
    ],
    win32: [
      // Visual Studio Code variants
      { name: 'Visual Studio Code', id: 'vscode', paths: ['%LOCALAPPDATA%\\Programs\\Microsoft VS Code\\Code.exe', '%PROGRAMFILES%\\Microsoft VS Code\\Code.exe'], command: 'code' },
      { name: 'Visual Studio Code - Insiders', id: 'vscode-insiders', paths: ['%LOCALAPPDATA%\\Programs\\Microsoft VS Code Insiders\\Code - Insiders.exe'], command: 'code-insiders' },
      { name: 'VSCodium', id: 'vscodium', paths: ['%LOCALAPPDATA%\\Programs\\VSCodium\\VSCodium.exe'], command: 'codium' },
      { name: 'Cursor', id: 'cursor', paths: ['%LOCALAPPDATA%\\Programs\\Cursor\\Cursor.exe'], command: 'cursor' },
      
      // JetBrains IDEs
      { name: 'WebStorm', id: 'webstorm', paths: ['%PROGRAMFILES%\\JetBrains\\WebStorm*\\bin\\webstorm64.exe'], command: 'webstorm' },
      { name: 'IntelliJ IDEA', id: 'intellij', paths: ['%PROGRAMFILES%\\JetBrains\\IntelliJ IDEA*\\bin\\idea64.exe'], command: 'idea' },
      { name: 'PyCharm', id: 'pycharm', paths: ['%PROGRAMFILES%\\JetBrains\\PyCharm*\\bin\\pycharm64.exe'], command: 'pycharm' },
      
      // Other editors
      { name: 'Sublime Text', id: 'sublime', paths: ['%PROGRAMFILES%\\Sublime Text\\sublime_text.exe'], command: 'subl' },
      { name: 'Atom', id: 'atom', paths: ['%LOCALAPPDATA%\\atom\\atom.exe'], command: 'atom' },
      { name: 'Notepad++', id: 'notepadpp', paths: ['%PROGRAMFILES%\\Notepad++\\notepad++.exe'], command: 'notepad++' },
      { name: 'Visual Studio', id: 'visualstudio', paths: ['%PROGRAMFILES%\\Microsoft Visual Studio\\*\\*\\Common7\\IDE\\devenv.exe'], command: 'devenv' },
    ],
    linux: [
      // Visual Studio Code variants
      { name: 'Visual Studio Code', id: 'vscode', paths: ['/usr/share/code/code', '/snap/bin/code'], command: 'code' },
      { name: 'Visual Studio Code - Insiders', id: 'vscode-insiders', paths: ['/usr/share/code-insiders/code-insiders'], command: 'code-insiders' },
      { name: 'VSCodium', id: 'vscodium', paths: ['/usr/share/codium/codium', '/snap/bin/codium'], command: 'codium' },
      
      // JetBrains IDEs
      { name: 'WebStorm', id: 'webstorm', paths: ['/opt/webstorm/bin/webstorm.sh'], command: 'webstorm' },
      { name: 'IntelliJ IDEA', id: 'intellij', paths: ['/opt/idea/bin/idea.sh'], command: 'idea' },
      
      // Other editors
      { name: 'Sublime Text', id: 'sublime', paths: ['/opt/sublime_text/sublime_text'], command: 'subl' },
      { name: 'Atom', id: 'atom', paths: ['/usr/share/atom/atom'], command: 'atom' },
      
      // Terminal editors
      { name: 'Vim', id: 'vim', paths: [], command: 'vim' },
      { name: 'NeoVim', id: 'nvim', paths: [], command: 'nvim' },
      { name: 'Emacs', id: 'emacs', paths: [], command: 'emacs' },
    ]
  }

  async detectEditors(): Promise<Editor[]> {
    const platform = process.platform as keyof typeof this.editorConfigs
    const configs = this.editorConfigs[platform] || []
    
    this.editors = []

    for (const config of configs) {
      const editor: Editor = {
        name: config.name,
        id: config.id,
        executable: '',
        available: false
      }

      // Check specific paths
      for (const editorPath of config.paths) {
        const expandedPath = this.expandPath(editorPath)
        if (existsSync(expandedPath)) {
          editor.executable = expandedPath
          editor.available = true
          break
        }
      }

      // If not found in specific paths, check if command is available in PATH
      if (!editor.available && config.command) {
        try {
          const which = process.platform === 'win32' ? 'where' : 'which'
          const result = execSync(`${which} ${config.command}`, { encoding: 'utf8' }).trim()
          if (result) {
            editor.executable = result.split('\n')[0] // Take first result if multiple
            editor.available = true
          }
        } catch (error) {
          // Command not found in PATH
        }
      }

      if (editor.available) {
        this.editors.push(editor)
      }
    }

    return this.editors
  }

  private expandPath(inputPath: string): string {
    // Expand environment variables
    let expandedPath = inputPath
    if (process.platform === 'win32') {
      expandedPath = inputPath.replace(/%([^%]+)%/g, (_, envVar) => {
        return process.env[envVar] || ''
      })
    }
    
    // Handle wildcards (basic glob pattern)
    if (expandedPath.includes('*')) {
      try {
        const dir = path.dirname(expandedPath)
        const pattern = path.basename(expandedPath)
        // This is a simplified version - in production, use a proper glob library
        // For now, just return the path without wildcards
        expandedPath = expandedPath.replace(/\*/g, '')
      } catch (error) {
        // Ignore glob errors
      }
    }

    return expandedPath
  }

  getAvailableEditors(): Editor[] {
    return this.editors.filter(e => e.available)
  }

  async openInEditor(editor: Editor, filePath: string, lineNumber?: number): Promise<void> {
    let command = `"${editor.executable}" "${filePath}"`
    
    // Add line number support for various editors
    if (lineNumber) {
      switch (editor.id) {
        case 'vscode':
        case 'vscode-insiders':
        case 'vscodium':
        case 'cursor':
          command = `"${editor.executable}" --goto "${filePath}:${lineNumber}"`
          break
        case 'sublime':
          command = `"${editor.executable}" "${filePath}:${lineNumber}"`
          break
        case 'atom':
          command = `"${editor.executable}" "${filePath}:${lineNumber}"`
          break
        case 'vim':
        case 'nvim':
          command = `"${editor.executable}" "+${lineNumber}" "${filePath}"`
          break
        case 'emacs':
          command = `"${editor.executable}" "+${lineNumber}" "${filePath}"`
          break
        // JetBrains IDEs
        case 'webstorm':
        case 'intellij':
        case 'pycharm':
        case 'goland':
          command = `"${editor.executable}" --line ${lineNumber} "${filePath}"`
          break
      }
    }

    const { exec } = require('child_process')
    return new Promise((resolve, reject) => {
      exec(command, (error: Error | null) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  async getDefaultEditor(): Promise<Editor | null> {
    // Try to detect default editor from environment variables
    const defaultEditorEnv = process.env.EDITOR || process.env.VISUAL
    
    if (defaultEditorEnv) {
      const editors = await this.detectEditors()
      return editors.find(e => e.command === defaultEditorEnv || e.executable.includes(defaultEditorEnv)) || null
    }

    // Otherwise, prioritize common editors
    const priorityOrder = ['vscode', 'cursor', 'sublime', 'atom', 'webstorm', 'vim']
    const editors = await this.detectEditors()
    
    for (const editorId of priorityOrder) {
      const editor = editors.find(e => e.id === editorId)
      if (editor) {
        return editor
      }
    }

    return editors[0] || null
  }
}

export const editorDetector = new EditorDetectorService()