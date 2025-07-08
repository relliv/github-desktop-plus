import { db, schema } from '../db'
import { eq, desc } from 'drizzle-orm'
import path from 'path'
import fs from 'fs'
import { simpleGit } from 'simple-git'

export class RepositoryService {
  // Get all repositories
  async getAllRepositories() {
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
  }

  // Add a new repository
  async addRepository(repoPath: string) {
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

      // Check if repository already exists
      const existing = await db
        .select()
        .from(schema.repositories)
        .where(eq(schema.repositories.path, repoPath))
        .limit(1)

      if (existing.length > 0) {
        // Update last opened timestamp
        await db
          .update(schema.repositories)
          .set({ 
            lastOpenedAt: new Date(),
            currentBranch: status.current || null,
            updatedAt: new Date()
          })
          .where(eq(schema.repositories.path, repoPath))
        
        return existing[0]
      }

      // Insert new repository
      const [newRepo] = await db
        .insert(schema.repositories)
        .values({
          path: repoPath,
          name: repoName,
          currentBranch: status.current || null,
          isFavorite: false,
          lastOpenedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()

      return newRepo
    } catch (error) {
      console.error('Error adding repository:', error)
      throw error
    }
  }

  // Update repository
  async updateRepository(id: number, updates: Partial<schema.NewRepository>) {
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
  }

  // Toggle favorite status
  async toggleFavorite(id: number) {
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
  }

  // Delete repository
  async deleteRepository(id: number) {
    try {
      await db
        .delete(schema.repositories)
        .where(eq(schema.repositories.id, id))

      return { success: true }
    } catch (error) {
      console.error('Error deleting repository:', error)
      throw error
    }
  }

  // Update repository branch
  async updateRepositoryBranch(id: number, branch: string) {
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
  }
}

export const repositoryService = new RepositoryService()