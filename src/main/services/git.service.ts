import { simpleGit, SimpleGit, CloneOptions as SimpleGitCloneOptions } from 'simple-git'
import * as path from 'path'
import * as fs from 'fs/promises'
import { 
  CloneOptions, 
  CloneResult, 
  CloneProgress,
  RepositoryValidation,
  CreateRepositoryOptions
} from '../../shared/types/git.types'

export class GitService {
  private git: SimpleGit

  constructor() {
    this.git = simpleGit()
  }

  async cloneRepository(
    options: CloneOptions,
    onProgress?: (progress: CloneProgress) => void
  ): Promise<CloneResult> {
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

      // Configure git options
      const gitOptions: Partial<SimpleGitCloneOptions> = {
        '--progress': null,
        '--branch': options.branch || undefined,
        '--depth': options.depth || undefined,
      }

      // Set up progress handler
      const progressHandler = {
        progress: (data: string) => {
          const progress = this.parseProgress(data)
          if (progress && onProgress) {
            onProgress(progress)
          }
        }
      }

      // Configure authentication if provided
      if (options.username && options.password) {
        // For HTTPS authentication
        const authUrl = options.url.replace(
          /^https:\/\//,
          `https://${encodeURIComponent(options.username)}:${encodeURIComponent(options.password)}@`
        )
        await this.git.clone(authUrl, options.directory, gitOptions, progressHandler)
      } else if (options.sshKey) {
        // For SSH authentication - this would need additional setup
        // For now, we'll use the system's SSH configuration
        await this.git.clone(options.url, options.directory, gitOptions, progressHandler)
      } else {
        // No authentication
        await this.git.clone(options.url, options.directory, gitOptions, progressHandler)
      }

      // Send completion progress
      if (onProgress) {
        onProgress({
          stage: 'complete',
          percent: 100,
          total: 100,
          transferred: 100,
          message: 'Clone completed successfully'
        })
      }

      return {
        success: true,
        path: options.directory
      }
    } catch (error) {
      if (onProgress) {
        onProgress({
          stage: 'error',
          percent: 0,
          total: 0,
          transferred: 0,
          message: error instanceof Error ? error.message : 'Clone failed'
        })
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clone failed'
      }
    }
  }

  async validateRepository(repoPath: string): Promise<RepositoryValidation> {
    try {
      const git = simpleGit(repoPath)
      
      // Check if it's a git repository
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        return {
          isValid: false,
          isGitRepository: false,
          hasRemote: false,
          error: 'Not a git repository'
        }
      }

      // Check for remotes
      const remotes = await git.getRemotes(true)
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
  }

  async createRepository(options: CreateRepositoryOptions): Promise<CloneResult> {
    try {
      // Create directory
      await fs.mkdir(options.path, { recursive: true })

      // Initialize git repository
      const git = simpleGit(options.path)
      await git.init()

      // Create initial files
      if (options.initializeWithReadme) {
        const readmePath = path.join(options.path, 'README.md')
        const readmeContent = `# ${options.name}\n\n${options.description || 'A new repository'}\n`
        await fs.writeFile(readmePath, readmeContent)
        await git.add('README.md')
      }

      if (options.gitignoreTemplate) {
        const gitignorePath = path.join(options.path, '.gitignore')
        await fs.writeFile(gitignorePath, options.gitignoreTemplate)
        await git.add('.gitignore')
      }

      if (options.license) {
        const licensePath = path.join(options.path, 'LICENSE')
        await fs.writeFile(licensePath, options.license)
        await git.add('LICENSE')
      }

      // Create initial commit if files were added
      const status = await git.status()
      if (status.files.length > 0) {
        await git.commit('Initial commit')
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
  }

  async getCurrentBranch(repoPath: string): Promise<string | null> {
    try {
      const git = simpleGit(repoPath)
      const branch = await git.revparse(['--abbrev-ref', 'HEAD'])
      return branch.trim()
    } catch {
      return null
    }
  }

  async getRemoteUrl(repoPath: string): Promise<string | undefined> {
    try {
      const git = simpleGit(repoPath)
      const remotes = await git.getRemotes(true)
      return remotes.find(r => r.name === 'origin')?.refs.fetch
    } catch {
      return undefined
    }
  }

  private parseProgress(data: string): CloneProgress | null {
    // Parse git clone progress output
    let stage: CloneProgress['stage'] = 'receiving'
    let percent = 0
    let total = 0
    let transferred = 0

    // Counting objects
    if (data.includes('Counting objects')) {
      stage = 'counting'
      const match = data.match(/(\d+)%/)
      if (match) percent = parseInt(match[1])
    }
    // Compressing objects
    else if (data.includes('Compressing objects')) {
      stage = 'compressing'
      const match = data.match(/(\d+)%/)
      if (match) percent = parseInt(match[1])
    }
    // Receiving objects
    else if (data.includes('Receiving objects')) {
      stage = 'receiving'
      const match = data.match(/(\d+)%.*?(\d+)\/(\d+)/)
      if (match) {
        percent = parseInt(match[1])
        transferred = parseInt(match[2])
        total = parseInt(match[3])
      }
    }
    // Resolving deltas
    else if (data.includes('Resolving deltas')) {
      stage = 'resolving'
      const match = data.match(/(\d+)%.*?(\d+)\/(\d+)/)
      if (match) {
        percent = parseInt(match[1])
        transferred = parseInt(match[2])
        total = parseInt(match[3])
      }
    }

    return {
      stage,
      percent,
      total,
      transferred,
      message: data.trim()
    }
  }
}