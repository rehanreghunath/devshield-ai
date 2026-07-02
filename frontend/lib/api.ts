import type { AnalysisJob, ReviewResult, WebhookPayload, WebhookResponse } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    })
  } catch (err) {
    // TypeError = network-level failure (ECONNREFUSED, no backend, CORS preflight crash)
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
  return res.json() as Promise<T>
}

export const api = {
  jobs: {
    list: () => request<AnalysisJob[]>('/api/jobs'),
    get:  (jobId: string) => request<AnalysisJob>(`/api/jobs/${jobId}`),
  },
  reviews: {
    get: (jobId: string) => request<ReviewResult>(`/api/reviews/${jobId}`),
  },
  webhooks: {
    submit: (payload: WebhookPayload) =>
      request<WebhookResponse>('/api/webhooks/github', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
}
