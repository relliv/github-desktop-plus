import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export type AppSetting = typeof appSettings.$inferSelect
export type NewAppSetting = typeof appSettings.$inferInsert

export const repositories = sqliteTable('repositories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull().unique(),
  name: text('name').notNull(),
  currentBranch: text('current_branch'),
  remoteUrl: text('remote_url'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false).notNull(),
  lastOpenedAt: integer('last_opened_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export type Repository = typeof repositories.$inferSelect
export type NewRepository = typeof repositories.$inferInsert

export const commits = sqliteTable('commits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  repositoryId: integer('repository_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
  hash: text('hash').notNull(),
  abbreviatedHash: text('abbreviated_hash').notNull(),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  message: text('message').notNull(),
  body: text('body'),
  parentHashes: text('parent_hashes'),
})

export type Commit = typeof commits.$inferSelect
export type NewCommit = typeof commits.$inferInsert

export const avatarCache = sqliteTable('avatar_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  avatarUrl: text('avatar_url'),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export type AvatarCache = typeof avatarCache.$inferSelect
export type NewAvatarCache = typeof avatarCache.$inferInsert