import type { AnalysisJob, ReviewResult, GitHubRepo, WatchedRepo } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        `Backend unreachable at ${BASE || 'http://localhost:8080'}. ` +
        `Start the backend with: docker compose up postgres redis backend -d`
      )
    }
    throw err
  }
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${body}`)
  }
  const text = await res.text()
  if (!text) {
    return undefined as unknown as T
  }
  return JSON.parse(text) as T
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export const api = {
  jobs: {
    list: () => request<AnalysisJob[]>('/api/jobs'),
    get:  (jobId: string) => request<AnalysisJob>(`/api/jobs/${jobId}`),
  },
  reviews: {
    get: (jobId: string) => request<ReviewResult>(`/api/reviews/${jobId}`),
  },
  user: {
    me: (token: string) =>
      request<Record<string, unknown>>('/api/user/me', { headers: authHeaders(token) }),
    repos: (token: string) =>
      request<GitHubRepo[]>('/api/user/repos', { headers: authHeaders(token) }),
    watchedRepos: (token: string) =>
      request<WatchedRepo[]>('/api/user/repos/watched', { headers: authHeaders(token) }),
    addRepo: (token: string, githubRepoId: number, fullName: string) =>
      request<WatchedRepo>('/api/user/repos', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ githubRepoId, fullName }),
      }),
    removeRepo: (token: string, githubRepoId: number) =>
      request<void>(`/api/user/repos/${githubRepoId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      }),
  },
}
