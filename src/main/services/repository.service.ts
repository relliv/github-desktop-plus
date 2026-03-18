import { db, schema } from '../db'
import { eq, desc } from 'drizzle-orm'
import path from 'path'
import fs from 'fs'
import { simpleGit } from 'simple-git'
import { Worker } from 'worker_threads'
import { perf } from '@shared/perf'

export class RepositoryService {
  // Get all repositories
  async getAllRepositories() {
    return perf.measure('repo-service:get-all', async () => {
      try {
        const repos = await db
          .select()
          .from(schema.repositories)
          .orderBy(desc(schema.repositories.lastOpenedAt))

        return repos
      } catch (error) {
        console.error('Error fetching repositories:', error)
        return []
      }
    })
  }

  // Add a new repository
  async addRepository(repoPath: string) {
    const endAdd = perf.start(`repo-service:add(${path.basename(repoPath)})`)
    try {
      // Validate that the path exists and is a git repository
      if (!fs.existsSync(repoPath)) {
        throw new Error('Repository path does not exist')
      }

      const gitPath = path.join(repoPath, '.git')
      if (!fs.existsSync(gitPath)) {
        throw new Error('Not a git repository')
      }

      // Get repository info using simple-git
      const git = simpleGit(repoPath)
      const status = await git.status()
      const repoName = path.basename(repoPath)

      // Get remote URL (origin)
      let remoteUrl: string | null = null
      try {
        const remotes = await git.getRemotes(true)
        const origin = remotes.find(r => r.name === 'origin')
        remoteUrl = origin?.refs?.fetch || origin?.refs?.push || null
      } catch {
        // No remote configured
      }

      // Check if repository already exists
      const existing = await db
        .select()
        .from(schema.repositories)
        .where(eq(schema.repositories.path, repoPath))
        .limit(1)

      if (existing.length > 0) {
        // Update last opened timestamp and remote URL
        const [updated] = await db
          .update(schema.repositories)
          .set({
            lastOpenedAt: new Date(),
            currentBranch: status.current || null,
            remoteUrl: remoteUrl,
            updatedAt: new Date()
          })
          .where(eq(schema.repositories.path, repoPath))
          .returning()

        return updated
      }

      // Insert new repository
      const [newRepo] = await db
        .insert(schema.repositories)
        .values({
          path: repoPath,
          name: repoName,
          currentBranch: status.current || null,
          remoteUrl: remoteUrl,
          isFavorite: false,
          lastOpenedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()

      endAdd()
      return newRepo
    } catch (error) {
      endAdd()
      console.error('Error adding repository:', error)
      throw error
    }
  }

  // Update repository
  async updateRepository(id: number, updates: Partial<schema.NewRepository>) {
    return perf.measure(`repo-service:update(${id})`, async () => {
      try {
        const [updated] = await db
          .update(schema.repositories)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(eq(schema.repositories.id, id))
          .returning()

        return updated
      } catch (error) {
        console.error('Error updating repository:', error)
        throw error
      }
    })
  }

  // Toggle favorite status
  async toggleFavorite(id: number) {
    return perf.measure(`repo-service:toggle-favorite(${id})`, async () => {
      try {
        const [repo] = await db
          .select()
          .from(schema.repositories)
          .where(eq(schema.repositories.id, id))
          .limit(1)

        if (!repo) {
          throw new Error('Repository not found')
        }

        const [updated] = await db
          .update(schema.repositories)
          .set({
            isFavorite: !repo.isFavorite,
            updatedAt: new Date()
          })
          .where(eq(schema.repositories.id, id))
          .returning()

        return updated
      } catch (error) {
        console.error('Error toggling favorite:', error)
        throw error
      }
    })
  }

  // Delete repository
  async deleteRepository(id: number) {
    return perf.measure(`repo-service:delete(${id})`, async () => {
      try {
        await db
          .delete(schema.repositories)
          .where(eq(schema.repositories.id, id))

        return { success: true }
      } catch (error) {
        console.error('Error deleting repository:', error)
        throw error
      }
    })
  }

  // Update repository branch
  async updateRepositoryBranch(id: number, branch: string) {
    return perf.measure(`repo-service:update-branch(${id})`, async () => {
      try {
        const [updated] = await db
          .update(schema.repositories)
          .set({
            currentBranch: branch,
            updatedAt: new Date()
          })
          .where(eq(schema.repositories.id, id))
          .returning()

        return updated
      } catch (error) {
        console.error('Error updating repository branch:', error)
        throw error
      }
    })
  }

  // Refresh remote URLs for all repositories in a background worker thread.
  // Git operations run off the main thread; only small DB writes happen on main with yielding.
  async refreshRemoteUrls() {
    const endRefresh = perf.start('repo-service:refresh-remote-urls')
    try {
      const repos = await this.getAllRepositories()
      perf.mark(`repo-service:refresh-remote-urls(${repos.length} repos)`)

      if (repos.length === 0) return

      const repoInputs = repos.map(r => ({ id: r.id, path: r.path, remoteUrl: r.remoteUrl }))

      // Run all git operations in a worker thread (off main thread)
      const results = await this.runRemoteRefreshWorker(repoInputs)

      // Apply DB updates on main thread, yielding between each to keep IPC responsive
      for (const result of results) {
        if (result.changed) {
          await db
            .update(schema.repositories)
            .set({ remoteUrl: result.remoteUrl, updatedAt: new Date() })
            .where(eq(schema.repositories.id, result.id))
          // Yield event loop so IPC handlers can process
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }
    } catch (error) {
      console.error('Error refreshing remote URLs:', error)
    } finally {
      endRefresh()
    }
  }

  private runRemoteRefreshWorker(
    repos: Array<{ id: number; path: string; remoteUrl: string | null }>
  ): Promise<Array<{ id: number; remoteUrl: string | null; changed: boolean }>> {
    const workerCode = `
      const { parentPort } = require('worker_threads');
      const { simpleGit } = require('simple-git');

      parentPort.on('message', async (repos) => {
        const results = [];
        for (const repo of repos) {
          try {
            const git = simpleGit(repo.path);
            const remotes = await git.getRemotes(true);
            const origin = remotes.find(r => r.name === 'origin');
            const remoteUrl = (origin && (origin.refs.fetch || origin.refs.push)) || null;
            results.push({ id: repo.id, remoteUrl, changed: remoteUrl !== repo.remoteUrl });
          } catch {
            results.push({ id: repo.id, remoteUrl: repo.remoteUrl, changed: false });
          }
        }
        parentPort.postMessage(results);
      });
    `

    return new Promise((resolve, reject) => {
      const worker = new Worker(workerCode, { eval: true })

      worker.on('message', (results) => {
        resolve(results)
        worker.terminate()
      })
      worker.on('error', (err) => {
        reject(err)
        worker.terminate()
      })

      worker.postMessage(repos)
    })
  }
}

export const repositoryService = new RepositoryService()