export interface GitStatus {
  modified: string[]
  added: string[]
  deleted: string[]
  renamed: Array<{ from: string; to: string }>
  conflicted: string[]
  staged: string[]
  ahead: number
  behind: number
}

export interface GitBranch {
  name: string
  current: boolean
  commit: string
  tracking?: string
}

export interface GitCommit {
  hash: string
  date: string
  message: string
  author_name: string
  author_email: string
  body: string
}

export interface GitRemote {
  name: string
  url: string
}

export interface RepositoryInfo {
  name: string
  path: string
  currentBranch: string
  remoteUrl: string | null
  status: GitStatus
}