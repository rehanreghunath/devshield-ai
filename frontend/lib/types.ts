export type JobStatus = 'QUEUED' | 'PARSING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface AnalysisJob {
  id: string
  repoId: string
  prNumber: number
  prTitle: string | null
  author: string | null
  status: JobStatus
  reviewMarkdown: string | null
  errorMessage: string | null
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

export interface WebhookPayload {
  repoId: string
  prNumber: number
  diff: string
  prTitle?: string
  author?: string
  baseBranch?: string
  headBranch?: string
}

export interface WebhookResponse {
  jobId: string
  status: string
  message: string
}
