export interface CloneProgress {
  stage: 'counting' | 'compressing' | 'receiving' | 'resolving' | 'complete' | 'error'
  percent: number
  total: number
  transferred: number
  message?: string
}

export interface CloneOptions {
  url: string
  directory: string
  branch?: string
  depth?: number
  username?: string
  password?: string
  sshKey?: string
}

export interface CloneResult {
  success: boolean
  path?: string
  error?: string
}

export interface RepositoryValidation {
  isValid: boolean
  isGitRepository: boolean
  hasRemote: boolean
  error?: string
}

export interface CreateRepositoryOptions {
  name: string
  description?: string
  path: string
  initializeWithReadme?: boolean
  gitignoreTemplate?: string
  license?: string
}

export interface RepositoryInfo {
  id: number
  name: string
  path: string
  currentBranch: string | null
  remoteUrl?: string
  isFavorite: boolean
  lastOpenedAt: Date
  createdAt: Date
  updatedAt: Date
}