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
import { perf } from '@shared/perf'

const git: SimpleGit = simpleGit()

export function registerGitHandlers() {
  // Open repository — lightweight: only reads branch + remote, no git status
  perf.handle(ipcMain, 'git:open-repository', async (_, repoPath: string) => {
    try {
      await fs.access(repoPath)
      await fs.access(path.join(repoPath, '.git'))

      const repoGit = simpleGit(repoPath)

      // Only fetch lightweight data (branch + remote) — status is fetched separately
      const [branchRaw, remotes] = await Promise.all([
        repoGit.raw(['branch', '--show-current']),
        repoGit.getRemotes(true),
      ])

      return {
        success: true,
        name: path.basename(repoPath),
        path: repoPath,
        currentBranch: branchRaw.trim() || '',
        remoteUrl: remotes[0]?.refs?.fetch ? String(remotes[0].refs.fetch) : null,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open repository'
      }
    }
  })

  // Get repository status — optimized for large repos
  perf.handle(ipcMain, 'git:get-status', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)

      // Run porcelain status + ahead/behind in parallel
      const [porcelainOutput, aheadBehind] = await Promise.all([
        // --porcelain=v1: machine-readable, fast
        // -unormal: show untracked files but don't recurse into untracked dirs
        repoGit.raw(['status', '--porcelain=v1', '-unormal']),
        // Get ahead/behind from status --branch --porcelain (first line only)
        repoGit.raw(['status', '--branch', '--porcelain=v1', '-unormal']).then(out => {
          const firstLine = out.split('\n')[0] || ''
          const abMatch = firstLine.match(/\[ahead (\d+)(?:, behind (\d+))?\]|\[behind (\d+)\]/)
          return {
            ahead: parseInt(abMatch?.[1] || '0') || 0,
            behind: parseInt(abMatch?.[2] || abMatch?.[3] || '0') || 0,
          }
        }),
      ])

      const modified: string[] = []
      const added: string[] = []
      const deleted: string[] = []
      const renamed: Array<{ from: string; to: string }> = []
      const conflicted: string[] = []
      const staged: string[] = []

      for (const line of porcelainOutput.split('\n')) {
        if (!line || line.length < 4) continue
        const x = line[0] // staged
        const y = line[1] // working tree
        const file = line.slice(3)

        // Staged changes
        if (x === 'R') {
          // Rename format: "old_path -> new_path"
          const arrowIdx = file.indexOf(' -> ')
          if (arrowIdx !== -1) {
            const from = file.slice(0, arrowIdx)
            const to = file.slice(arrowIdx + 4)
            renamed.push({ from, to })
            staged.push(to)
          } else {
            staged.push(file)
          }
        } else if (x === 'M' || x === 'A' || x === 'D') {
          staged.push(file)
        }

        // Working tree changes
        if (y === 'M') modified.push(file)
        else if (y === 'D') deleted.push(file)
        else if (x === '?' && y === '?') added.push(file)
        else if (x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D')) conflicted.push(file)
        else if (x === 'A' && y === ' ') { /* staged only */ }
        else if (x === 'M' && y === ' ') { /* staged only */ }
        else if (x === 'D' && y === ' ') { /* staged only */ }
      }

      return { modified, added, deleted, renamed, conflicted, staged, ...aheadBehind }
    } catch (error) {
      throw new Error(`Failed to get status: ${error}`)
    }
  })

  // Get branches — optimized: single call, parse locally
  perf.handle(ipcMain, 'git:get-branches', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)

      // Run local + remote branch queries in parallel
      const [localRaw, remoteRaw] = await Promise.all([
        repoGit.raw(['branch', '--no-color', '--sort=-committerdate']),
        repoGit.raw(['branch', '-r', '--no-color', '--sort=-committerdate']),
      ])

      let current = ''
      const local: string[] = []
      const pinned = ['main', 'dev']
      for (const line of localRaw.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (line.startsWith('* ')) {
          current = trimmed.slice(2)
          local.push(current)
        } else {
          local.push(trimmed)
        }
      }

      // Pin main/dev to the top (in order), keep the rest sorted by date
      const pinnedBranches = pinned.filter((b) => local.includes(b))
      const rest = local.filter((b) => !pinned.includes(b))
      const sortedLocal = [...pinnedBranches, ...rest]

      const remote: string[] = []
      for (const line of remoteRaw.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.includes('HEAD')) {
          remote.push(trimmed)
        }
      }

      return { current, local: sortedLocal, remote }
    } catch (error) {
      throw new Error(`Failed to get branches: ${error}`)
    }
  })

  // Checkout branch
  perf.handle(ipcMain, 'git:checkout', async (_, repoPath: string, branch: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.checkout(branch)
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to checkout: ${error}`)
    }
  })

  // Create branch
  perf.handle(ipcMain, 'git:create-branch', async (_, repoPath: string, branchName: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.checkoutLocalBranch(branchName)
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to create branch: ${error}`)
    }
  })

  // Stage files
  perf.handle(ipcMain, 'git:stage', async (_, repoPath: string, files: string[]) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.add(files)
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to stage files: ${error}`)
    }
  })

  // Unstage files
  perf.handle(ipcMain, 'git:unstage', async (_, repoPath: string, files: string[]) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.reset(['HEAD', ...files])
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to unstage files: ${error}`)
    }
  })

  // Discard changes — restore tracked files to HEAD, delete untracked / staged-added
  perf.handle(
    ipcMain,
    'git:discard',
    async (
      _,
      repoPath: string,
      files: Array<{ path: string; mode: 'untracked' | 'staged-add' | 'tracked' }>
    ) => {
      try {
        const repoGit = simpleGit(repoPath)
        const tracked = files.filter((f) => f.mode === 'tracked').map((f) => f.path)
        const stagedAdds = files.filter((f) => f.mode === 'staged-add').map((f) => f.path)
        const untracked = files.filter((f) => f.mode === 'untracked').map((f) => f.path)

        if (tracked.length > 0) {
          await repoGit.raw([
            'restore',
            '--source=HEAD',
            '--staged',
            '--worktree',
            '--',
            ...tracked,
          ])
        }

        if (stagedAdds.length > 0) {
          await repoGit.raw(['reset', 'HEAD', '--', ...stagedAdds])
        }

        for (const rel of [...stagedAdds, ...untracked]) {
          const abs = path.join(repoPath, rel)
          await fs.rm(abs, { force: true, recursive: true })
        }

        return { success: true }
      } catch (error) {
        throw new Error(`Failed to discard changes: ${error}`)
      }
    }
  )

  // Commit
  perf.handle(ipcMain, 'git:commit', async (_, repoPath: string, message: string) => {
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
  perf.handle(ipcMain, 'git:push', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.push()
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to push: ${error}`)
    }
  })

  // Pull
  perf.handle(ipcMain, 'git:pull', async (_, repoPath: string) => {
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
  perf.handle(ipcMain, 'git:fetch', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.fetch()
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to fetch: ${error}`)
    }
  })

  // Stash
  perf.handle(ipcMain, 'git:stash', async (_, repoPath: string, message?: string) => {
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
  perf.handle(ipcMain, 'git:stash-pop', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      await repoGit.stash(['pop'])
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to pop stash: ${error}`)
    }
  })

  // Get commit history
  perf.handle(ipcMain, 'git:get-log', async (_, repoPath: string, limit: number = 50) => {
    try {
      const repoGit = simpleGit(repoPath)
      const log = await repoGit.log(['-n', limit.toString()])
      return JSON.parse(JSON.stringify(log.all))
    } catch (error) {
      throw new Error(`Failed to get log: ${error}`)
    }
  })

  // Get tags mapped to commit hashes
  perf.handle(ipcMain, 'git:get-tags', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      // format: <hash> <refname:short>
      const raw = await repoGit.raw(['tag', '-l', '--format=%(objectname) %(refname:short)'])
      const tags: Record<string, string[]> = {}
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        const spaceIdx = line.indexOf(' ')
        if (spaceIdx === -1) continue
        const hash = line.slice(0, spaceIdx)
        const tag = line.slice(spaceIdx + 1)
        // For annotated tags, dereference to the commit hash
        const derefRaw = await repoGit.raw(['rev-parse', `${tag}^{commit}`]).catch(() => hash)
        const commitHash = derefRaw.trim()
        if (!tags[commitHash]) tags[commitHash] = []
        tags[commitHash].push(tag)
      }
      return { success: true, data: tags }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get tags' }
    }
  })

  // Clone repository with progress
  perf.handle(ipcMain, 'git:clone', async (event: IpcMainInvokeEvent, options: CloneOptions) => {
    try {
      try {
        const files = await fs.readdir(options.directory)
        if (files.length > 0) {
          return { success: false, error: 'Directory is not empty' }
        }
      } catch {
        // Directory doesn't exist, which is fine
      }

      await fs.mkdir(options.directory, { recursive: true })

      const parseProgress = (data: SimpleGitProgressEvent): CloneProgress => {
        let stage: CloneProgress['stage'] = 'receiving'
        if (data.stage.includes('Counting objects')) stage = 'counting'
        else if (data.stage.includes('Compressing objects')) stage = 'compressing'
        else if (data.stage.includes('Receiving objects')) stage = 'receiving'
        else if (data.stage.includes('Resolving deltas')) stage = 'resolving'

        return {
          stage,
          percent: data.progress,
          total: data.total || 0,
          transferred: data.processed || 0,
          message: data.stage
        }
      }

      const progressGit = simpleGit({
        progress: (data: SimpleGitProgressEvent) => {
          try {
            const progress = parseProgress(data)
            event.sender.send('git:clone:progress', JSON.parse(JSON.stringify(progress)))
          } catch {
            // Ignore progress send failures
          }
        }
      })

      const cloneOptions: string[] = []
      if (options.branch) cloneOptions.push('--branch', options.branch)
      if (options.depth) cloneOptions.push('--depth', options.depth.toString())

      let cloneUrl = options.url
      if (options.username && options.password) {
        cloneUrl = options.url.replace(
          /^https:\/\//,
          `https://${encodeURIComponent(options.username)}:${encodeURIComponent(options.password)}@`
        )
      }

      await progressGit.clone(cloneUrl, options.directory, cloneOptions)

      event.sender.send('git:clone:progress', {
        stage: 'complete', percent: 100, total: 100, transferred: 100,
        message: 'Clone completed successfully'
      })

      return { success: true, path: options.directory }
    } catch (error) {
      event.sender.send('git:clone:progress', {
        stage: 'error', percent: 0, total: 0, transferred: 0,
        message: error instanceof Error ? error.message : 'Clone failed'
      })
      return { success: false, error: error instanceof Error ? error.message : 'Clone failed' }
    }
  })

  // Validate repository
  perf.handle(ipcMain, 'git:validate', async (_: IpcMainInvokeEvent, repoPath: string): Promise<RepositoryValidation> => {
    try {
      const repoGit = simpleGit(repoPath)
      const isRepo = await repoGit.checkIsRepo()
      if (!isRepo) {
        return { isValid: false, isGitRepository: false, hasRemote: false, error: 'Not a git repository' }
      }
      const remotes = await repoGit.getRemotes(true)
      return { isValid: true, isGitRepository: true, hasRemote: remotes.length > 0 }
    } catch (error) {
      return { isValid: false, isGitRepository: false, hasRemote: false, error: error instanceof Error ? error.message : 'Validation failed' }
    }
  })

  // Get current branch
  perf.handle(ipcMain, 'git:getCurrentBranch', async (_: IpcMainInvokeEvent, repoPath: string): Promise<string | null> => {
    try {
      const repoGit = simpleGit(repoPath)
      const branches = await repoGit.branchLocal()
      return branches.current || null
    } catch {
      return null
    }
  })

  // Get remote URL
  perf.handle(ipcMain, 'git:getRemoteUrl', async (_: IpcMainInvokeEvent, repoPath: string): Promise<string | null> => {
    try {
      const repoGit = simpleGit(repoPath)
      const remotes = await repoGit.getRemotes(true)
      const origin = remotes.find(r => r.name === 'origin') ?? remotes[0]
      return origin?.refs?.fetch ?? null
    } catch {
      return null
    }
  })

  // Get diff for a working tree file (unstaged changes)
  perf.handle(ipcMain, 'git:diff-file', async (_, repoPath: string, filePath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      const diff = await repoGit.diff([filePath])

      // If diff is empty, the file may be untracked — generate a synthetic diff
      if (!diff.trim()) {
        const fullPath = path.join(repoPath, filePath)
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          const lines = content.split('\n')
          // Remove trailing empty line from split if file ends with newline
          if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
          const diffLines = [
            `diff --git a/${filePath} b/${filePath}`,
            'new file mode 100644',
            '--- /dev/null',
            `+++ b/${filePath}`,
            `@@ -0,0 +1,${lines.length} @@`,
            ...lines.map(l => `+${l}`)
          ]
          return { success: true, data: diffLines.join('\n') }
        } catch {
          // File might be deleted or binary — return empty
          return { success: true, data: '' }
        }
      }

      return { success: true, data: diff }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get diff' }
    }
  })

  // Get diff for a staged file
  perf.handle(ipcMain, 'git:diff-staged', async (_, repoPath: string, filePath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      const diff = await repoGit.diff(['--cached', filePath])
      return { success: true, data: diff }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get staged diff' }
    }
  })

  // Get diff for a deleted file (show removed content)
  perf.handle(ipcMain, 'git:diff-deleted', async (_, repoPath: string, filePath: string) => {
    try {
      const repoGit = simpleGit(repoPath)
      // Show what the file looked like in HEAD
      const content = await repoGit.show([`HEAD:${filePath}`])
      const lines = content.split('\n')
      if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
      const diffLines = [
        `diff --git a/${filePath} b/${filePath}`,
        'deleted file mode 100644',
        `--- a/${filePath}`,
        '+++ /dev/null',
        `@@ -1,${lines.length} +0,0 @@`,
        ...lines.map(l => `-${l}`)
      ]
      return { success: true, data: diffLines.join('\n') }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get deleted file diff' }
    }
  })

  // Get repository statistics for the Stats tab
  // All queries are capped with --max-count to prevent main-process freezes.
  perf.handle(ipcMain, 'git:get-stats', async (_, repoPath: string) => {
    try {
      const repoGit = simpleGit(repoPath)

      const [authorsAndDatesRaw, fileListRaw, totalCommitsRaw, branchData, tagsRaw] = await perf.measure('stats:git-queries', () => Promise.all([
        // Log: author + date + body (for co-authors), capped at 3000 commits
        // Use record separator (\x1e) to delimit commits, unit separator (\x1f) for fields
        repoGit.raw(['log', '--format=%x1e%aN%x1f%aI%x1f%b', '--max-count=3000']),
        // File list for language breakdown
        repoGit.raw(['ls-files']),
        // Total commit count on current branch
        repoGit.raw(['rev-list', '--count', 'HEAD']),
        // Branch counts
        Promise.all([
          repoGit.raw(['branch', '--no-color']),
          repoGit.raw(['branch', '-r', '--no-color']),
        ]),
        // Tags count
        repoGit.raw(['tag', '-l']),
      ]))

      // Parse authors + dates in a single pass
      const endParseLog = perf.start('stats:parse-log')
      const authorCounts: Record<string, number> = {}
      const coAuthorRe = /Co-authored-by:\s*(.+?)\s*<[^>]*>/gi

      // Collect all (name, dateStr) pairs so we can determine the full date range
      // before choosing weekly vs monthly aggregation
      const datedEntries: Array<{ name: string; dateStr: string }> = []

      for (const record of authorsAndDatesRaw.split('\x1e')) {
        if (!record.trim()) continue
        const fields = record.split('\x1f')
        if (fields.length < 2) continue
        const author = fields[0].trim()
        const dateStr = fields[1].trim().slice(0, 10) // YYYY-MM-DD
        const body = fields[2] || ''

        authorCounts[author] = (authorCounts[author] || 0) + 1
        if (dateStr) datedEntries.push({ name: author, dateStr })

        // Extract co-authors from commit body
        let match
        coAuthorRe.lastIndex = 0
        while ((match = coAuthorRe.exec(body)) !== null) {
          const coAuthor = match[1].trim()
          if (coAuthor && coAuthor !== author) {
            authorCounts[coAuthor] = (authorCounts[coAuthor] || 0) + 1
            if (dateStr) datedEntries.push({ name: coAuthor, dateStr })
          }
        }
      }

      // Determine date range → use monthly buckets for repos > 1 year old,
      // weekly buckets for newer/shorter histories
      const sortedDates = datedEntries.map(e => e.dateStr).sort()
      const firstDate = sortedDates[0]
      const lastDate = sortedDates[sortedDates.length - 1]
      const dayRange = firstDate && lastDate
        ? (new Date(lastDate).getTime() - new Date(firstDate).getTime()) / 86400000
        : 0
      const granularity: 'week' | 'month' = dayRange > 365 ? 'month' : 'week'

      function getBucketKey(dateStr: string): string {
        if (granularity === 'month') return dateStr.slice(0, 7) // YYYY-MM
        const [y, m, d] = dateStr.split('-').map(Number)
        const date = new Date(y, m - 1, d)
        const dow = date.getDay()
        const monday = new Date(y, m - 1, d - dow + (dow === 0 ? -6 : 1))
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
      }

      const totalBuckets: Record<string, number> = {}
      const authorBuckets: Record<string, Record<string, number>> = {}

      for (const { name, dateStr } of datedEntries) {
        const key = getBucketKey(dateStr)
        totalBuckets[key] = (totalBuckets[key] || 0) + 1
        if (!authorBuckets[name]) authorBuckets[name] = {}
        authorBuckets[name][key] = (authorBuckets[name][key] || 0) + 1
      }

      // Build sorted contributors list
      const contributors = Object.entries(authorCounts)
        .map(([name, commits]) => ({ name, commits }))
        .sort((a, b) => b.commits - a.commits)

      // Sort activity by date
      const bucketKeys = Object.keys(totalBuckets).sort()
      const activityData = bucketKeys.map((week) => ({ week, commits: totalBuckets[week] }))

      // Build per-author activity keyed by bucket (top 8 contributors only)
      const topAuthors = contributors.slice(0, 8).map((c) => c.name)
      const activityByUser: Record<string, number[]> = {}
      for (const author of topAuthors) {
        activityByUser[author] = bucketKeys.map((k) => authorBuckets[author]?.[k] || 0)
      }
      endParseLog()

      // Parse file extensions for language breakdown
      const endParseFiles = perf.start('stats:parse-files')
      const extensionCounts: Record<string, number> = {}
      let totalFiles = 0
      for (const line of fileListRaw.split('\n')) {
        if (!line) continue
        totalFiles++
        const dotIdx = line.lastIndexOf('.')
        const slashIdx = line.lastIndexOf('/')
        const ext = dotIdx > slashIdx ? line.slice(dotIdx).toLowerCase() : '(no ext)'
        extensionCounts[ext] = (extensionCounts[ext] || 0) + 1
      }

      // Top extensions, rest grouped as "Other"
      const sortedExts = Object.entries(extensionCounts)
        .sort(([, a], [, b]) => b - a)
      const topExts = sortedExts.slice(0, 8)
      const otherCount = sortedExts.slice(8).reduce((sum, [, c]) => sum + c, 0)
      const languages = topExts.map(([ext, count]) => ({ name: ext, count }))
      if (otherCount > 0) languages.push({ name: 'Other', count: otherCount })
      endParseFiles()

      // Branch counts
      const localBranches = branchData[0].split('\n').filter(l => l.trim()).length
      const remoteBranches = branchData[1].split('\n').filter(l => l.trim() && !l.includes('HEAD')).length

      // Tags count
      const tagCount = tagsRaw.split('\n').filter(l => l.trim()).length

      return {
        success: true,
        data: {
          contributors,
          activityData,
          activityByUser,
          granularity,
          languages,
          totalCommits: parseInt(totalCommitsRaw.trim()) || 0,
          totalFiles,
          localBranches,
          remoteBranches,
          tagCount,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      }
    }
  })

  // Create new repository
  perf.handle(ipcMain, 'git:create', async (_: IpcMainInvokeEvent, options: CreateRepositoryOptions) => {
    try {
      await fs.mkdir(options.path, { recursive: true })
      const repoGit = simpleGit(options.path)
      await repoGit.init()

      if (options.initializeWithReadme) {
        const readmePath = path.join(options.path, 'README.md')
        await fs.writeFile(readmePath, `# ${options.name}\n\n${options.description || 'A new repository'}\n`)
        await repoGit.add('README.md')
      }
      if (options.gitignoreTemplate) {
        await fs.writeFile(path.join(options.path, '.gitignore'), options.gitignoreTemplate)
        await repoGit.add('.gitignore')
      }
      if (options.license) {
        await fs.writeFile(path.join(options.path, 'LICENSE'), options.license)
        await repoGit.add('LICENSE')
      }

      const status = await repoGit.status()
      if (status.files.length > 0) await repoGit.commit('Initial commit')

      return { success: true, path: options.path }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create repository' }
    }
  })
}
