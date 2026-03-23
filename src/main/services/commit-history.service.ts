import { db, schema } from '../db'
import { eq, desc, count, and, or, like, inArray } from 'drizzle-orm'
import { simpleGit } from 'simple-git'
import { perf } from '@shared/perf'

// Unique delimiter unlikely to appear in commit data
const DELIM = '<%GD+%>'
const RECORD_END = '<%GD+END%>'

// Track active scan operations so we can cancel them
const activeScans = new Map<number, { cancelled: boolean }>()

function parseCommitLog(rawLog: string, repositoryId: number): schema.NewCommit[] {
  if (!rawLog.trim()) return []

  const records = rawLog.split(RECORD_END).filter(r => r.trim())
  const commits: schema.NewCommit[] = []

  for (const record of records) {
    const parts = record.trim().split(DELIM)
    if (parts.length < 6 || !/^[0-9a-f]{40}$/.test(parts[0])) continue

    commits.push({
      repositoryId,
      hash: parts[0],
      abbreviatedHash: parts[1],
      authorName: parts[2],
      authorEmail: parts[3],
      date: new Date(parseInt(parts[4]) * 1000),
      message: parts[5],
      body: parts[6]?.trim() || null,
      parentHashes: parts[7]?.trim() || null,
    })
  }

  return commits
}

const LOG_FORMAT = `--format=${['%H', '%h', '%an', '%ae', '%at', '%s', '%b', '%P'].join(DELIM)}${RECORD_END}`

export class CommitHistoryService {
  /**
   * Start a background scan of commits for a repository.
   * Only fetches commits not already in the database.
   */
  async scanCommits(
    repositoryId: number,
    repoPath: string,
    onProgress?: (scanned: number, total: number) => void
  ): Promise<{ added: number }> {
    // Cancel any existing scan for this repo
    const existing = activeScans.get(repositoryId)
    if (existing) {
      existing.cancelled = true
    }

    const scanState = { cancelled: false }
    activeScans.set(repositoryId, scanState)

    try {
      const endScan = perf.start(`commits:scan(repo:${repositoryId})`)
      const git = simpleGit(repoPath)

      // Get the latest commit hash we already have
      const [latestStored] = await db
        .select({ hash: schema.commits.hash })
        .from(schema.commits)
        .where(eq(schema.commits.repositoryId, repositoryId))
        .orderBy(desc(schema.commits.date))
        .limit(1)

      const logArgs: string[] = [LOG_FORMAT]

      if (latestStored) {
        // Only fetch new commits since last scan
        logArgs.push(`${latestStored.hash}..HEAD`)
      } else {
        // First scan: limit to most recent 500 commits to avoid blocking
        logArgs.push('-n', '500')
      }

      const rawLog = await perf.measure(`commits:git-log(repo:${repositoryId})`, () =>
        git.raw(['log', ...logArgs])
      )
      const commits = parseCommitLog(rawLog, repositoryId)

      if (commits.length === 0) {
        endScan()
        return { added: 0 }
      }

      // Insert in batches to avoid blocking
      const BATCH_SIZE = 100
      let added = 0

      for (let i = 0; i < commits.length; i += BATCH_SIZE) {
        if (scanState.cancelled) break

        const batch = commits.slice(i, i + BATCH_SIZE)
        await db.insert(schema.commits).values(batch).onConflictDoNothing()
        added += batch.length

        if (onProgress) {
          onProgress(added, commits.length)
        }
      }

      endScan()
      return { added }
    } catch (error) {
      console.error(`Error scanning commits for repo ${repositoryId}:`, error)
      return { added: 0 }
    } finally {
      activeScans.delete(repositoryId)
    }
  }

  /**
   * Full scan - clears existing commits and rescans everything.
   */
  async fullScan(
    repositoryId: number,
    repoPath: string,
    onProgress?: (scanned: number, total: number) => void
  ): Promise<{ added: number }> {
    const existing = activeScans.get(repositoryId)
    if (existing) {
      existing.cancelled = true
    }

    const scanState = { cancelled: false }
    activeScans.set(repositoryId, scanState)

    try {
      const endFullScan = perf.start(`commits:full-scan(repo:${repositoryId})`)
      await db
        .delete(schema.commits)
        .where(eq(schema.commits.repositoryId, repositoryId))

      const git = simpleGit(repoPath)
      const rawLog = await perf.measure(`commits:full-git-log(repo:${repositoryId})`, () =>
        git.raw(['log', LOG_FORMAT])
      )
      const commits = parseCommitLog(rawLog, repositoryId)

      if (commits.length === 0) {
        endFullScan()
        return { added: 0 }
      }

      const BATCH_SIZE = 100
      let added = 0

      for (let i = 0; i < commits.length; i += BATCH_SIZE) {
        if (scanState.cancelled) break

        const batch = commits.slice(i, i + BATCH_SIZE)
        await db.insert(schema.commits).values(batch).onConflictDoNothing()
        added += batch.length

        if (onProgress) {
          onProgress(added, commits.length)
        }
      }

      endFullScan()
      return { added }
    } catch (error) {
      console.error(`Error in full scan for repo ${repositoryId}:`, error)
      return { added: 0 }
    } finally {
      activeScans.delete(repositoryId)
    }
  }

  async getCommits(repositoryId: number, offset = 0, limit = 50) {
    return perf.measure(`commits-db:list(repo:${repositoryId},offset:${offset})`, () =>
      db
        .select()
        .from(schema.commits)
        .where(eq(schema.commits.repositoryId, repositoryId))
        .orderBy(desc(schema.commits.date))
        .offset(offset)
        .limit(limit)
    )
  }

  async getCommitCount(repositoryId: number): Promise<number> {
    return perf.measure(`commits-db:count(repo:${repositoryId})`, async () => {
      const [result] = await db
        .select({ count: count() })
        .from(schema.commits)
        .where(eq(schema.commits.repositoryId, repositoryId))

      return result?.count ?? 0
    })
  }

  private buildSearchWhere(repositoryId: number, query: string, tagMatchHashes?: string[]) {
    const pattern = `%${query}%`
    const conditions = [
      like(schema.commits.message, pattern),
      like(schema.commits.body, pattern),
      like(schema.commits.authorName, pattern),
      like(schema.commits.hash, pattern),
      like(schema.commits.abbreviatedHash, pattern),
    ]

    if (tagMatchHashes && tagMatchHashes.length > 0) {
      conditions.push(inArray(schema.commits.hash, tagMatchHashes))
    }

    return and(
      eq(schema.commits.repositoryId, repositoryId),
      or(...conditions),
    )!
  }

  async searchCommits(repositoryId: number, query: string, offset = 0, limit = 50, tagMatchHashes?: string[]) {
    const whereClause = this.buildSearchWhere(repositoryId, query, tagMatchHashes)

    return perf.measure(`commits-db:search(repo:${repositoryId},q:${query})`, () =>
      db
        .select()
        .from(schema.commits)
        .where(whereClause)
        .orderBy(desc(schema.commits.date))
        .offset(offset)
        .limit(limit)
    )
  }

  async searchCommitCount(repositoryId: number, query: string, tagMatchHashes?: string[]): Promise<number> {
    const whereClause = this.buildSearchWhere(repositoryId, query, tagMatchHashes)

    return perf.measure(`commits-db:search-count(repo:${repositoryId},q:${query})`, async () => {
      const [result] = await db
        .select({ count: count() })
        .from(schema.commits)
        .where(whereClause)

      return result?.count ?? 0
    })
  }

  async getCommitFiles(repoPath: string, commitHash: string) {
    return perf.measure(`commits-git:files(${commitHash.slice(0, 7)})`, async () => {
      try {
        const git = simpleGit(repoPath)
        const result = await git.raw([
          'diff-tree', '--no-commit-id', '-r', '--name-status', commitHash,
        ])

        if (!result.trim()) return []

        return result.trim().split('\n').map((line) => {
          const [status, ...fileParts] = line.split('\t')
          return {
            status: status as 'A' | 'M' | 'D' | 'R' | 'C',
            file: fileParts.join('\t'),
          }
        })
      } catch (error) {
        console.error(`Error getting commit files for ${commitHash}:`, error)
        return []
      }
    })
  }

  async getCommitFileDiff(repoPath: string, commitHash: string, filePath: string) {
    return perf.measure(`commits-git:diff(${commitHash.slice(0, 7)}/${filePath.split('/').pop()})`, async () => {
      try {
        const git = simpleGit(repoPath)
        return await git.raw(['diff', `${commitHash}^`, commitHash, '--', filePath])
      } catch {
        // For initial commits with no parent, use show instead
        try {
          const git = simpleGit(repoPath)
          return await git.raw(['show', '--format=', commitHash, '--', filePath])
        } catch (innerError) {
          console.error(`Error getting diff for ${filePath} in ${commitHash}:`, innerError)
          return ''
        }
      }
    })
  }

  async deleteCommitsForRepository(repositoryId: number) {
    await db
      .delete(schema.commits)
      .where(eq(schema.commits.repositoryId, repositoryId))
  }
}

export const commitHistoryService = new CommitHistoryService()
