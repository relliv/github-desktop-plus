import { db, schema } from '../db'
import { eq } from 'drizzle-orm'
import { net } from 'electron'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export class AvatarService {
  async getAvatar(email: string): Promise<string | null> {
    const cached = await this.getCached(email)

    if (cached !== undefined) {
      return cached
    }

    return this.fetchAndCache(email)
  }

  async getAvatars(emails: string[]): Promise<Record<string, string | null>> {
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
      if (entry && now - entry.fetchedAt.getTime() < ONE_DAY_MS) {
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

    return result
  }

  private async getCached(email: string): Promise<string | null | undefined> {
    const normalizedEmail = email.toLowerCase()
    const rows = await db
      .select()
      .from(schema.avatarCache)
      .where(eq(schema.avatarCache.email, normalizedEmail))

    if (rows.length === 0) return undefined

    const row = rows[0]
    const age = Date.now() - row.fetchedAt.getTime()
    if (age > ONE_DAY_MS) return undefined

    return row.avatarUrl
  }

  private async fetchAndCache(email: string): Promise<string | null> {
    const normalizedEmail = email.toLowerCase()
    let avatarUrl: string | null = null

    try {
      avatarUrl = await this.fetchGitHubAvatar(normalizedEmail)
    } catch {
      // Network error — don't cache, return null
      return null
    }

    await db
      .insert(schema.avatarCache)
      .values({
        email: normalizedEmail,
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

    return avatarUrl
  }

  private fetchGitHubAvatar(email: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
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

      request.on('error', (err) => {
        reject(err)
      })

      request.end()
    })
  }
}

export const avatarService = new AvatarService()
