import { ipcMain } from 'electron'
import { commitHistoryService } from '../services/commit-history.service'
import { perf } from '@shared/perf'

export function registerCommitHistoryHandlers() {
  perf.handle(ipcMain, 'commits:scan', async (event, repositoryId: number, repoPath: string) => {
    try {
      const result = await commitHistoryService.scanCommits(
        repositoryId,
        repoPath,
        (scanned, total) => {
          event.sender.send('commits:scan-progress', { repositoryId, scanned, total })
        }
      )

      event.sender.send('commits:scan-complete', { repositoryId, added: result.added })
      return { success: true, added: result.added }
    } catch (error) {
      console.error('Error in commits:scan:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'commits:full-scan', async (event, repositoryId: number, repoPath: string) => {
    try {
      const result = await commitHistoryService.fullScan(
        repositoryId,
        repoPath,
        (scanned, total) => {
          event.sender.send('commits:scan-progress', { repositoryId, scanned, total })
        }
      )

      event.sender.send('commits:scan-complete', { repositoryId, added: result.added })
      return { success: true, added: result.added }
    } catch (error) {
      console.error('Error in commits:full-scan:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'commits:list', async (_, repositoryId: number, offset?: number, limit?: number) => {
    try {
      const commits = await commitHistoryService.getCommits(repositoryId, offset, limit)
      return { success: true, data: commits }
    } catch (error) {
      console.error('Error in commits:list:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'commits:count', async (_, repositoryId: number) => {
    try {
      const count = await commitHistoryService.getCommitCount(repositoryId)
      return { success: true, data: count }
    } catch (error) {
      console.error('Error in commits:count:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'commits:files', async (_, repoPath: string, commitHash: string) => {
    try {
      const files = await commitHistoryService.getCommitFiles(repoPath, commitHash)
      return { success: true, data: files }
    } catch (error) {
      console.error('Error in commits:files:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  perf.handle(ipcMain, 'commits:file-diff', async (_, repoPath: string, commitHash: string, filePath: string) => {
    try {
      const diff = await commitHistoryService.getCommitFileDiff(repoPath, commitHash, filePath)
      return { success: true, data: diff }
    } catch (error) {
      console.error('Error in commits:file-diff:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
