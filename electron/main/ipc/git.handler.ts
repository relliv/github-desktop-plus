import { ipcMain } from 'electron'
import simpleGit, { SimpleGit } from 'simple-git'
import path from 'path'
import fs from 'fs/promises'

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
      
      return {
        success: true,
        name: path.basename(repoPath),
        path: repoPath,
        currentBranch: branches.current,
        remoteUrl: remotes[0]?.refs?.fetch || null,
        status
      }
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
  
  // Clone repository
  ipcMain.handle('git:clone', async (_, url: string, targetPath: string) => {
    try {
      await git.clone(url, targetPath)
      return { 
        success: true,
        path: targetPath
      }
    } catch (error) {
      throw new Error(`Failed to clone: ${error}`)
    }
  })
}