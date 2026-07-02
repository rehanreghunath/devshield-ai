import type { AnalysisJob, ReviewResult, WebhookPayload, WebhookResponse } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
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
