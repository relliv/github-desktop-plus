import { existsSync } from 'fs'
import { execSync, spawn } from 'child_process'

export interface Terminal {
  id: string
  name: string
  executable: string
  available: boolean
}

interface TerminalConfig {
  id: string
  name: string
  /** Absolute paths to check */
  paths: string[]
  /** Command name to look up via `which` / `where` as a fallback */
  command?: string
  /**
   * Builds the launch command. The renderer always supplies a working dir;
   * each terminal exposes that differently so we centralize it here.
   */
  launch: (executable: string, cwd: string) => { command: string; args: string[] }
}

// macOS: most native terminals are launched via `open -a "App" <cwd>`
const macAppLaunch =
  (appName: string) =>
  (_executable: string, cwd: string) => ({
    command: 'open',
    args: ['-a', appName, cwd],
  })

const macBinaryLaunch =
  (extraArgs: (cwd: string) => string[] = (cwd) => ['--working-directory', cwd]) =>
  (executable: string, cwd: string) => ({
    command: executable,
    args: extraArgs(cwd),
  })

const linuxBinaryLaunch =
  (argsBuilder: (cwd: string) => string[]) =>
  (executable: string, cwd: string) => ({
    command: executable,
    args: argsBuilder(cwd),
  })

const TERMINAL_CONFIGS: Record<NodeJS.Platform | string, TerminalConfig[]> = {
  darwin: [
    {
      id: 'terminal',
      name: 'Terminal',
      paths: ['/System/Applications/Utilities/Terminal.app', '/Applications/Utilities/Terminal.app'],
      launch: macAppLaunch('Terminal'),
    },
    {
      id: 'iterm',
      name: 'iTerm2',
      paths: ['/Applications/iTerm.app'],
      launch: macAppLaunch('iTerm'),
    },
    {
      id: 'warp',
      name: 'Warp',
      paths: ['/Applications/Warp.app'],
      launch: macAppLaunch('Warp'),
    },
    {
      id: 'hyper',
      name: 'Hyper',
      paths: ['/Applications/Hyper.app'],
      launch: macAppLaunch('Hyper'),
    },
    {
      id: 'tabby',
      name: 'Tabby',
      paths: ['/Applications/Tabby.app'],
      launch: macAppLaunch('Tabby'),
    },
    {
      id: 'ghostty',
      name: 'Ghostty',
      paths: ['/Applications/Ghostty.app'],
      launch: macAppLaunch('Ghostty'),
    },
    {
      id: 'alacritty',
      name: 'Alacritty',
      paths: ['/Applications/Alacritty.app'],
      command: 'alacritty',
      launch: (executable, cwd) => ({
        command: executable.endsWith('.app')
          ? 'open'
          : executable,
        args: executable.endsWith('.app')
          ? ['-a', 'Alacritty', '--args', '--working-directory', cwd]
          : ['--working-directory', cwd],
      }),
    },
    {
      id: 'kitty',
      name: 'Kitty',
      paths: ['/Applications/kitty.app'],
      command: 'kitty',
      launch: (executable, cwd) => ({
        command: executable.endsWith('.app') ? 'open' : executable,
        args: executable.endsWith('.app')
          ? ['-a', 'kitty', '--args', '--directory', cwd]
          : ['--directory', cwd],
      }),
    },
    {
      id: 'wezterm',
      name: 'WezTerm',
      paths: ['/Applications/WezTerm.app'],
      command: 'wezterm',
      launch: (executable, cwd) => ({
        command: executable.endsWith('.app') ? 'open' : executable,
        args: executable.endsWith('.app')
          ? ['-a', 'WezTerm', '--args', 'start', '--cwd', cwd]
          : ['start', '--cwd', cwd],
      }),
    },
  ],
  win32: [
    {
      id: 'windows-terminal',
      name: 'Windows Terminal',
      paths: [],
      command: 'wt',
      launch: (executable, cwd) => ({
        command: executable,
        args: ['-d', cwd],
      }),
    },
    {
      id: 'powershell',
      name: 'PowerShell',
      paths: [],
      command: 'powershell',
      launch: (executable, cwd) => ({
        command: executable,
        args: ['-NoExit', '-Command', `Set-Location -LiteralPath '${cwd.replace(/'/g, "''")}'`],
      }),
    },
    {
      id: 'pwsh',
      name: 'PowerShell 7+',
      paths: [],
      command: 'pwsh',
      launch: (executable, cwd) => ({
        command: executable,
        args: ['-NoExit', '-Command', `Set-Location -LiteralPath '${cwd.replace(/'/g, "''")}'`],
      }),
    },
    {
      id: 'cmd',
      name: 'Command Prompt',
      paths: [],
      command: 'cmd',
      launch: (executable, cwd) => ({
        command: executable,
        args: ['/K', `cd /d "${cwd}"`],
      }),
    },
    {
      id: 'git-bash',
      name: 'Git Bash',
      paths: ['%PROGRAMFILES%\\Git\\git-bash.exe', '%PROGRAMFILES(X86)%\\Git\\git-bash.exe'],
      command: 'git-bash',
      launch: (executable, cwd) => ({
        command: executable,
        args: ['--cd', cwd],
      }),
    },
    {
      id: 'hyper',
      name: 'Hyper',
      paths: ['%LOCALAPPDATA%\\hyper\\Hyper.exe'],
      command: 'hyper',
      launch: (executable, cwd) => ({
        command: executable,
        args: [cwd],
      }),
    },
    {
      id: 'tabby',
      name: 'Tabby',
      paths: ['%LOCALAPPDATA%\\Programs\\Tabby\\Tabby.exe'],
      command: 'tabby',
      launch: (executable, cwd) => ({
        command: executable,
        args: ['open', cwd],
      }),
    },
    {
      id: 'alacritty',
      name: 'Alacritty',
      paths: ['%PROGRAMFILES%\\Alacritty\\alacritty.exe'],
      command: 'alacritty',
      launch: (executable, cwd) => ({
        command: executable,
        args: ['--working-directory', cwd],
      }),
    },
    {
      id: 'wezterm',
      name: 'WezTerm',
      paths: ['%PROGRAMFILES%\\WezTerm\\wezterm-gui.exe'],
      command: 'wezterm-gui',
      launch: (executable, cwd) => ({
        command: executable,
        args: ['start', '--cwd', cwd],
      }),
    },
  ],
  linux: [
    {
      id: 'gnome-terminal',
      name: 'GNOME Terminal',
      paths: [],
      command: 'gnome-terminal',
      launch: linuxBinaryLaunch((cwd) => [`--working-directory=${cwd}`]),
    },
    {
      id: 'konsole',
      name: 'Konsole',
      paths: [],
      command: 'konsole',
      launch: linuxBinaryLaunch((cwd) => ['--workdir', cwd]),
    },
    {
      id: 'xfce4-terminal',
      name: 'Xfce Terminal',
      paths: [],
      command: 'xfce4-terminal',
      launch: linuxBinaryLaunch((cwd) => [`--working-directory=${cwd}`]),
    },
    {
      id: 'tilix',
      name: 'Tilix',
      paths: [],
      command: 'tilix',
      launch: linuxBinaryLaunch((cwd) => ['--working-directory', cwd]),
    },
    {
      id: 'terminator',
      name: 'Terminator',
      paths: [],
      command: 'terminator',
      launch: linuxBinaryLaunch((cwd) => ['--working-directory', cwd]),
    },
    {
      id: 'alacritty',
      name: 'Alacritty',
      paths: [],
      command: 'alacritty',
      launch: linuxBinaryLaunch((cwd) => ['--working-directory', cwd]),
    },
    {
      id: 'kitty',
      name: 'Kitty',
      paths: [],
      command: 'kitty',
      launch: linuxBinaryLaunch((cwd) => ['--directory', cwd]),
    },
    {
      id: 'wezterm',
      name: 'WezTerm',
      paths: [],
      command: 'wezterm',
      launch: linuxBinaryLaunch((cwd) => ['start', '--cwd', cwd]),
    },
    {
      id: 'xterm',
      name: 'xterm',
      paths: [],
      command: 'xterm',
      launch: (executable, cwd) => ({
        command: executable,
        args: ['-e', `cd "${cwd}" && ${process.env.SHELL || 'sh'}`],
      }),
    },
  ],
}

function expandPath(input: string): string {
  if (process.platform !== 'win32') return input
  return input.replace(/%([^%]+)%/g, (_, name: string) => process.env[name] || '')
}

function findExecutable(config: TerminalConfig): string | null {
  for (const candidate of config.paths) {
    const expanded = expandPath(candidate)
    if (expanded && existsSync(expanded)) return expanded
  }
  if (!config.command) return null
  try {
    const which = process.platform === 'win32' ? 'where' : 'which'
    const result = execSync(`${which} ${config.command}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim()
      .split(/\r?\n/)[0]
    return result || null
  } catch {
    return null
  }
}

export class TerminalDetectorService {
  private terminals: Terminal[] = []
  private configsById = new Map<string, TerminalConfig>()

  constructor() {
    const list = TERMINAL_CONFIGS[process.platform] ?? []
    for (const cfg of list) this.configsById.set(cfg.id, cfg)
  }

  detectTerminals(): Terminal[] {
    const list = TERMINAL_CONFIGS[process.platform] ?? []
    const detected: Terminal[] = []
    for (const cfg of list) {
      const executable = findExecutable(cfg)
      if (executable) {
        detected.push({ id: cfg.id, name: cfg.name, executable, available: true })
      }
    }
    this.terminals = detected
    return detected
  }

  getAvailableTerminals(): Terminal[] {
    return this.terminals
  }

  async openInTerminal(terminal: Terminal, cwd: string): Promise<void> {
    const cfg = this.configsById.get(terminal.id)
    if (!cfg) throw new Error(`Unknown terminal: ${terminal.id}`)
    const { command, args } = cfg.launch(terminal.executable, cwd)
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      })
      child.once('error', reject)
      child.once('spawn', () => {
        child.unref()
        resolve()
      })
    })
  }
}

export const terminalDetector = new TerminalDetectorService()
