import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import * as schema from './schema'

// Get the user data directory for storing the database
const userDataPath = app.getPath('userData')
const dbPath = path.join(userDataPath, 'github-desktop-plus.db')

// Ensure the directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true })
}

// Create SQLite database instance
const sqlite = new Database(dbPath)

// Create drizzle instance
export const db = drizzle(sqlite, { schema })

// Initialize database tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS repositories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    current_branch TEXT,
    is_favorite INTEGER DEFAULT 0 NOT NULL,
    last_opened_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL
  )
`)

// Close database connection when app quits
app.on('before-quit', () => {
  sqlite.close()
})

export { schema }