export type JobStatus = 'QUEUED' | 'RATE_LIMITED' | 'PARSING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface AnalysisJob {
  id: string
  repoId: string
  prNumber: number
  prTitle: string | null
  author: string | null
  status: JobStatus
  reviewMarkdown: string | null
  errorMessage: string | null
  diff: string | null
  createdAt: string
  updatedAt: string
}

export interface ReviewResult {
  jobId: string
  status: JobStatus
  reviewMarkdown: string
  repoId: string
  prNumber: number
  message?: string
}

export interface GitHubRepo {
  id: number
  full_name: string
  name: string
  owner: { login: string; avatar_url: string }
  description: string | null
  private: boolean
  language: string | null
  updated_at: string
  html_url: string
}

export interface WatchedRepo {
  id: string
  userId: string
  githubRepoId: number
  fullName: string
  createdAt: string
}
