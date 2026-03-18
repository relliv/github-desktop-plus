import { db, schema } from '../db'
import { eq } from 'drizzle-orm'
import { app, net } from 'electron'
import path from 'path'
import fs from 'fs'
import { perf } from '@shared/perf'

// Cache avatars for 7 days — images rarely change
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

// Directory for cached avatar image files
const avatarCacheDir = path.join(app.getPath('userData'), 'avatar-cache')

// Ensure cache directory exists
if (!fs.existsSync(avatarCacheDir)) {
  fs.mkdirSync(avatarCacheDir, { recursive: true })
}

function avatarFilePath(key: string): string {
  // Sanitize key to safe filename
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_')
  return path.join(avatarCacheDir, `${safe}.png`)
}

export class AvatarService {
  async getAvatar(email: string): Promise<string | null> {
    return perf.measure(`avatar-service:get(${email})`, async () => {
      const cached = await this.getCached(email)
      if (cached !== undefined) return cached
      return this.fetchAndCache(email)
    })
  }

  async getAvatars(emails: string[]): Promise<Record<string, string | null>> {
    const endBatch = perf.start(`avatar-service:get-avatars(${emails.length})`)
    const unique = [...new Set(emails.map((e) => e.toLowerCase()))]
    const result: Record<string, string | null> = {}

    const cached = await db
      .select()
      .from(schema.avatarCache)
      .all()

    const now = Date.now()
    const cacheMap = new Map<string, { avatarUrl: string | null; fetchedAt: Date }>(
      cached.map((row) => [row.email, { avatarUrl: row.avatarUrl, fetchedAt: row.fetchedAt }])
    )

    const toFetch: string[] = []

    for (const email of unique) {
      const entry = cacheMap.get(email)
      if (entry && now - entry.fetchedAt.getTime() < CACHE_MAX_AGE_MS) {
        result[email] = entry.avatarUrl
      } else {
        toFetch.push(email)
      }
    }

    // Fetch missing/stale in parallel (batched to avoid rate limits)
    const BATCH_SIZE = 5
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(batch.map((e) => this.fetchAndCache(e)))
      batch.forEach((email, idx) => {
        result[email] = results[idx]
      })
    }

    endBatch()
    return result
  }

  private async getCached(key: string): Promise<string | null | undefined> {
    const normalizedKey = key.toLowerCase()
    const rows = await db
      .select()
      .from(schema.avatarCache)
      .where(eq(schema.avatarCache.email, normalizedKey))

    if (rows.length === 0) return undefined

    const row = rows[0]
    const age = Date.now() - row.fetchedAt.getTime()
    if (age > CACHE_MAX_AGE_MS) return undefined

    // If we have a data URI cached, return it directly
    if (row.avatarUrl?.startsWith('data:')) return row.avatarUrl

    // Legacy entry with a remote URL — check if we have the image on disk
    const filePath = avatarFilePath(normalizedKey)
    if (fs.existsSync(filePath)) {
      const dataUri = this.fileToDataUri(filePath)
      if (dataUri) {
        // Upgrade DB entry to data URI
        await this.upsertCache(normalizedKey, dataUri)
        return dataUri
      }
    }

    // Stale legacy entry — refetch
    return undefined
  }

  private async fetchAndCache(email: string): Promise<string | null> {
    const normalizedEmail = email.toLowerCase()

    try {
      const avatarUrl = await this.fetchGitHubAvatar(normalizedEmail)
      if (!avatarUrl) {
        await this.upsertCache(normalizedEmail, null)
        return null
      }
      return this.downloadAndCache(normalizedEmail, avatarUrl)
    } catch {
      return null
    }
  }

  async getOwnerAvatar(owner: string): Promise<string | null> {
    return perf.measure(`avatar-service:get-owner(${owner})`, async () => {
      const cacheKey = `owner:${owner.toLowerCase()}`
      const cached = await this.getCached(cacheKey)
      if (cached !== undefined) return cached
      return this.fetchAndCacheOwner(owner, cacheKey)
    })
  }

  async getOwnerAvatars(owners: string[]): Promise<Record<string, string | null>> {
    return perf.measure(`avatar-service:get-owner-avatars(${owners.length})`, async () => {
      const unique = [...new Set(owners.map((o) => o.toLowerCase()))]
      const result: Record<string, string | null> = {}

      const entries = await Promise.allSettled(
        unique.map(async (owner) => {
          const avatar = await this.getOwnerAvatar(owner)
          return [owner, avatar] as const
        })
      )

      for (const entry of entries) {
        if (entry.status === 'fulfilled') {
          result[entry.value[0]] = entry.value[1]
        }
      }

      return result
    })
  }

  private async fetchAndCacheOwner(owner: string, cacheKey: string): Promise<string | null> {
    try {
      const avatarUrl = await this.fetchGitHubOwnerAvatar(owner)
      if (!avatarUrl) {
        await this.upsertCache(cacheKey, null)
        return null
      }
      return this.downloadAndCache(cacheKey, avatarUrl)
    } catch {
      return null
    }
  }

  /**
   * Download avatar image, save to disk, store as data URI in DB.
   */
  private async downloadAndCache(cacheKey: string, imageUrl: string): Promise<string | null> {
    try {
      const buffer = await perf.measure(`avatar-net:download(${cacheKey})`, () => this.downloadImage(imageUrl))
      if (!buffer || buffer.length === 0) {
        await this.upsertCache(cacheKey, null)
        return null
      }

      // Save to disk as backup
      const filePath = avatarFilePath(cacheKey)
      fs.writeFileSync(filePath, buffer)

      // Convert to data URI and store in DB
      const dataUri = `data:image/png;base64,${buffer.toString('base64')}`
      await this.upsertCache(cacheKey, dataUri)
      return dataUri
    } catch {
      return null
    }
  }

  private async upsertCache(key: string, avatarUrl: string | null): Promise<void> {
    return perf.measure(`avatar-db:upsert(${key})`, () =>
      db
        .insert(schema.avatarCache)
        .values({
          email: key,
          avatarUrl,
          fetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.avatarCache.email,
          set: {
            avatarUrl,
            fetchedAt: new Date(),
          },
        })
        .then(() => {})
    )
  }

  /**
   * Download an image URL and return the raw bytes.
   */
  private downloadImage(url: string): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      const request = net.request(url)
      request.setHeader('User-Agent', 'GitHub-Desktop-Plus')

      const chunks: Buffer[] = []

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          resolve(null)
          return
        }

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })

        response.on('end', () => {
          resolve(Buffer.concat(chunks))
        })
      })

      request.on('error', (err) => reject(err))
      request.end()
    })
  }

  private fetchGitHubOwnerAvatar(owner: string): Promise<string | null> {
    return perf.measure(`avatar-net:github-api(user:${owner})`, () =>
      new Promise<string | null>((resolve, reject) => {
        const url = `https://api.github.com/users/${encodeURIComponent(owner)}`

        const request = net.request(url)
        request.setHeader('User-Agent', 'GitHub-Desktop-Plus')
        request.setHeader('Accept', 'application/vnd.github.v3+json')

        let body = ''

        request.on('response', (response) => {
          if (response.statusCode !== 200) {
            resolve(null)
            return
          }

          response.on('data', (chunk) => {
            body += chunk.toString()
          })

          response.on('end', () => {
            try {
              const data = JSON.parse(body)
              if (data.avatar_url) {
                resolve(data.avatar_url + '&size=64')
              } else {
                resolve(null)
              }
            } catch {
              resolve(null)
            }
          })
        })

        request.on('error', (err) => reject(err))
        request.end()
      })
    )
  }

  private fetchGitHubAvatar(email: string): Promise<string | null> {
    return perf.measure(`avatar-net:github-api(search:${email})`, () => new Promise((resolve, reject) => {
      const url = `https://api.github.com/search/users?q=${encodeURIComponent(email)}+in:email&per_page=1`

      const request = net.request(url)
      request.setHeader('User-Agent', 'GitHub-Desktop-Plus')
      request.setHeader('Accept', 'application/vnd.github.v3+json')

      let body = ''

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          resolve(null)
          return
        }

        response.on('data', (chunk) => {
          body += chunk.toString()
        })

        response.on('end', () => {
          try {
            const data = JSON.parse(body)
            if (data.total_count > 0 && data.items?.[0]?.avatar_url) {
              resolve(data.items[0].avatar_url + '&size=64')
            } else {
              resolve(null)
            }
          } catch {
            resolve(null)
          }
        })
      })

      request.on('error', (err) => reject(err))
      request.end()
    }))
  }
}

export const avatarService = new AvatarService()
