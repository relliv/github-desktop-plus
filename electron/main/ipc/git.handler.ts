import { ipcMain, IpcMainInvokeEvent } from 'electron'
import simpleGit, { SimpleGit, SimpleGitProgressEvent } from 'simple-git'
import path from 'path'
import fs from 'fs/promises'
import { 
  CloneOptions, 
  CloneProgress,
  CreateRepositoryOptions,
  RepositoryValidation
} from '../../src/shared/types/git.types'

const git: SimpleGit = simpleGit()

export function registerGitHandlers() {
  // Open repository
  ipcMain.handle('git:open-repository', async (_, repoPath: string) => {
    try {
      // Check if path exists
      await fs.access(repoPath)
      
      // Check if it's a git repository
      const gitDir = path.join(repoPath, '.git')
      await fs.access(gitDir)
      
      // Get repository info
      const repoGit = simpleGit(repoPath)
      const status = await repoGit.status()
      const remotes = await repoGit.getRemotes(true)
      const branches = await repoGit.branchLocal()

      // Serialize to plain objects to avoid IPC cloning issues
      const result = {
        success: true,
        name: path.basename(repoPath),
        path: repoPath,
        currentBranch: String(branches.current || ''),
        remoteUrl: remotes[0]?.refs?.fetch ? String(remotes[0].refs.fetch) : null,
        status: {
          modified: [...status.modified],
          created: [...status.created],
          deleted: [...status.deleted],
          renamed: status.renamed.map(r => ({ from: String(r.from), to: String(r.to) })),
          conflicted: [...status.conflicted],
          staged: [...status.staged],
          ahead: Number(status.ahead) || 0,
          behind: Number(status.behind) || 0,
          current: status.current ? String(status.current) : null,
          tracking: status.tracking ? String(status.tracking) : null,
          isClean: Boolean(status.isClean())
        }
      }

      return JSON.parse(JSON.stringify(result))
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open repository'
      }
    }
  })
  
  // Get repository status
  ipcMain.handle('git:get-status', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      const status = await repoGit.status()
      
      return {
        modified: status.modified,
        added: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        conflicted: status.conflicted,
        staged: status.staged,
        ahead: status.ahead,
        behind: status.behind
      }
    } catch (error) {
      throw new Error(`Failed to get status: ${error}`)
    }
  })
  
  // Get branches
  ipcMain.handle('git:get-branches', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      const localBranches = await repoGit.branchLocal()
      const remoteBranches = await repoGit.branch(['-r'])
      
      return {
        current: localBranches.current,
        local: localBranches.all,
        remote: remoteBranches.all.filter(b => !b.includes('HEAD'))
      }
    } catch (error) {
      throw new Error(`Failed to get branches: ${error}`)
    }
  })
  
  // Checkout branch
  ipcMain.handle('git:checkout', async (_, repoPath: string, branch: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.checkout(branch)
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to checkout: ${error}`)
    }
  })
  
  // Create branch
  ipcMain.handle('git:create-branch', async (_, repoPath: string, branchName: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.checkoutLocalBranch(branchName)
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to create branch: ${error}`)
    }
  })
  
  // Stage files
  ipcMain.handle('git:stage', async (_, repoPath: string, files: string[]) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.add(files)
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to stage files: ${error}`)
    }
  })
  
  // Unstage files
  ipcMain.handle('git:unstage', async (_, repoPath: string, files: string[]) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.reset(['HEAD', ...files])
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to unstage files: ${error}`)
    }
  })
  
  // Commit
  ipcMain.handle('git:commit', async (_, repoPath: string, message: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      const result = await repoGit.commit(message)
      return { 
        success: true,
        commit: result.commit,
        summary: result.summary
      }
    } catch (error) {
      throw new Error(`Failed to commit: ${error}`)
    }
  })
  
  // Push
  ipcMain.handle('git:push', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.push()
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to push: ${error}`)
    }
  })
  
  // Pull
  ipcMain.handle('git:pull', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      const result = await repoGit.pull()
      return { 
        success: true,
        summary: result.summary
      }
    } catch (error) {
      throw new Error(`Failed to pull: ${error}`)
    }
  })
  
  // Fetch
  ipcMain.handle('git:fetch', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.fetch()
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to fetch: ${error}`)
    }
  })

  // Stash
  ipcMain.handle('git:stash', async (_, repoPath: string, message?: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      if (message) {
        await repoGit.stash(['push', '-m', message])
      } else {
        await repoGit.stash(['push'])
      }
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to stash: ${error}`)
    }
  })

  // Stash pop
  ipcMain.handle('git:stash-pop', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.stash(['pop'])
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to pop stash: ${error}`)
    }
  })
  
  // Get commit history
  ipcMain.handle('git:get-log', async (_, repoPath: string, limit: number = 50) => {
    try {
      const repoGit = simpleGit(repoPath)
      const log = await repoGit.log(['-n', limit.toString()])
      return log.all
    } catch (error) {
      throw new Error(`Failed to get log: ${error}`)
    }
  })
  
  // Clone repository with progress
  ipcMain.handle('git:clone', async (event: IpcMainInvokeEvent, options: CloneOptions) => {
    try {
      // Validate directory doesn't exist or is empty
      try {
        const files = await fs.readdir(options.directory)
        if (files.length > 0) {
          return {
            success: false,
            error: 'Directory is not empty'
          }
        }
      } catch {
        // Directory doesn't exist, which is fine
      }

      // Create directory if it doesn't exist
      await fs.mkdir(options.directory, { recursive: true })

      // Parse progress from git output
      const parseProgress = (data: SimpleGitProgressEvent): CloneProgress => {
        let stage: CloneProgress['stage'] = 'receiving'
        
        if (data.stage.includes('Counting objects')) {
          stage = 'counting'
        } else if (data.stage.includes('Compressing objects')) {
          stage = 'compressing'
        } else if (data.stage.includes('Receiving objects')) {
          stage = 'receiving'
        } else if (data.stage.includes('Resolving deltas')) {
          stage = 'resolving'
        }

        return {
          stage,
          percent: data.progress,
          total: data.total || 0,
          transferred: data.processed || 0,
          message: data.stage
        }
      }

      // Configure git with progress handler
      const progressGit = simpleGit({
        progress: (data: SimpleGitProgressEvent) => {
          const progress = parseProgress(data)
          event.sender.send('git:clone:progress', progress)
        }
      })

      // Build clone options
      const cloneOptions: string[] = []
      if (options.branch) {
        cloneOptions.push('--branch', options.branch)
      }
      if (options.depth) {
        cloneOptions.push('--depth', options.depth.toString())
      }

      // Handle authentication
      let cloneUrl = options.url
      if (options.username && options.password) {
        // For HTTPS authentication
        cloneUrl = options.url.replace(
          /^https:\/\//,
          `https://${encodeURIComponent(options.username)}:${encodeURIComponent(options.password)}@`
        )
      }

      // Clone the repository
      await progressGit.clone(cloneUrl, options.directory, cloneOptions)

      // Send completion progress
      event.sender.send('git:clone:progress', {
        stage: 'complete',
        percent: 100,
        total: 100,
        transferred: 100,
        message: 'Clone completed successfully'
      })

      return {
        success: true,
        path: options.directory
      }
    } catch (error) {
      // Send error progress
      event.sender.send('git:clone:progress', {
        stage: 'error',
        percent: 0,
        total: 0,
        transferred: 0,
        message: error instanceof Error ? error.message : 'Clone failed'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clone failed'
      }
    }
  })
  
  // Validate repository
  ipcMain.handle('git:validate', async (_: IpcMainInvokeEvent, repoPath: string): Promise<RepositoryValidation> => {
    try {
      const repoGit = simpleGit(repoPath)
      
      // Check if it's a git repository
      const isRepo = await repoGit.checkIsRepo()
      if (!isRepo) {
        return {
          isValid: false,
          isGitRepository: false,
          hasRemote: false,
          error: 'Not a git repository'
        }
      }

      // Check for remotes
      const remotes = await repoGit.getRemotes(true)
      const hasRemote = remotes.length > 0

      return {
        isValid: true,
        isGitRepository: true,
        hasRemote
      }
    } catch (error) {
      return {
        isValid: false,
        isGitRepository: false,
        hasRemote: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }
    }
  })
  
  // Create new repository
  ipcMain.handle('git:create', async (_: IpcMainInvokeEvent, options: CreateRepositoryOptions) => {
    try {
      // Create directory
      await fs.mkdir(options.path, { recursive: true })

      // Initialize git repository
      const repoGit = simpleGit(options.path)
      await repoGit.init()

      // Create initial files
      if (options.initializeWithReadme) {
        const readmePath = path.join(options.path, 'README.md')
        const readmeContent = `# ${options.name}\n\n${options.description || 'A new repository'}\n`
        await fs.writeFile(readmePath, readmeContent)
        await repoGit.add('README.md')
      }

      if (options.gitignoreTemplate) {
        const gitignorePath = path.join(options.path, '.gitignore')
        await fs.writeFile(gitignorePath, options.gitignoreTemplate)
        await repoGit.add('.gitignore')
      }

      if (options.license) {
        const licensePath = path.join(options.path, 'LICENSE')
        await fs.writeFile(licensePath, options.license)
        await repoGit.add('LICENSE')
      }

      // Create initial commit if files were added
      const status = await repoGit.status()
      if (status.files.length > 0) {
        await repoGit.commit('Initial commit')
      }

      return {
        success: true,
        path: options.path
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create repository'
      }
    }
  })
}