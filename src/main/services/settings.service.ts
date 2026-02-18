import { db, schema } from '../db'
import { eq } from 'drizzle-orm'

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
  isMaximized?: boolean
}

const WINDOW_BOUNDS_KEY = 'window_bounds'

export class SettingsService {
  // Get a setting by key
  async getSetting(key: string): Promise<string | null> {
    try {
      const [setting] = await db
        .select()
        .from(schema.appSettings)
        .where(eq(schema.appSettings.key, key))
        .limit(1)

      return setting?.value ?? null
    } catch (error) {
      console.error('Error fetching setting:', error)
      return null
    }
  }

  // Set a setting value
  async setSetting(key: string, value: string): Promise<void> {
    try {
      const existing = await this.getSetting(key)

      if (existing !== null) {
        await db
          .update(schema.appSettings)
          .set({
            value,
            updatedAt: new Date(),
          })
          .where(eq(schema.appSettings.key, key))
      } else {
        await db.insert(schema.appSettings).values({
          key,
          value,
          updatedAt: new Date(),
        })
      }
    } catch (error) {
      console.error('Error setting value:', error)
      throw error
    }
  }

  // Get saved window bounds
  async getWindowBounds(): Promise<WindowBounds | null> {
    try {
      const value = await this.getSetting(WINDOW_BOUNDS_KEY)
      if (!value) return null
      return JSON.parse(value) as WindowBounds
    } catch (error) {
      console.error('Error parsing window bounds:', error)
      return null
    }
  }

  // Save window bounds
  async saveWindowBounds(bounds: WindowBounds): Promise<void> {
    await this.setSetting(WINDOW_BOUNDS_KEY, JSON.stringify(bounds))
  }
}

export const settingsService = new SettingsService()
