'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '../../../lib/api'
import type { AnalysisJob } from '../../../lib/types'
import { DiffViewer } from '../../../components/DiffViewer'
import { ReviewPanel } from '../../../components/ReviewPanel'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  ArrowLeft, GitPullRequest, User, Calendar, RefreshCw, Loader2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function ReviewPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()

  const [job, setJob] = useState<AnalysisJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'split' | 'diff' | 'review'>('split')

  const fetchJob = useCallback(async () => {
    try {
      const data = await api.jobs.get(jobId)
      setJob(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Job not found')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchJob()
    const interval = setInterval(() => {
      if (job?.status === 'COMPLETED' || job?.status === 'FAILED') {
        clearInterval(interval)
        return
      }
      fetchJob()
    }, 2500)
    return () => clearInterval(interval)
  }, [fetchJob, job?.status])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-red-400 mb-4">{error ?? 'Job not found'}</p>
        <button onClick={() => router.push('/')} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    )
  }

  const diff = job.diff || ''

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 animate-fade-in">

      <div className="flex items-start gap-4 mb-6 flex-wrap">
        <button
          onClick={() => router.push('/')}
          className="btn-ghost mt-0.5"
          id="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-white truncate">
              {job.prTitle ?? `PR #${job.prNumber}`}
            </h1>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <GitPullRequest className="w-3 h-3" />
              {job.repoId} - PR #{job.prNumber}
            </span>
            {job.author && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {job.author}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(job.createdAt), 'MMM d, HH:mm')}
            </span>
          </div>
        </div>

        <button
          id="refresh-review-btn"
          onClick={fetchJob}
          className="btn-ghost mt-0.5"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 mb-4 border-b border-surface-border pb-3">
        {(['split', 'diff', 'review'] as const).map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-surface-hover'
            }`}
          >
            {tab === 'split' ? 'Split View' : tab === 'diff' ? 'Diff Only' : 'Review Only'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
          <span>Updated {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}</span>
        </div>
      </div>

      <div
        className={`min-h-[600px] rounded-xl border border-surface-border overflow-hidden bg-surface-card ${
          activeTab === 'split' ? 'grid grid-cols-2 divide-x divide-surface-border' : ''
        }`}
      >
        {(activeTab === 'split' || activeTab === 'diff') && (
          <div className={`overflow-auto ${activeTab !== 'split' ? 'h-[700px]' : ''}`}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-surface-card border-b border-surface-border">
              <span className="text-xs font-medium text-slate-300">Code Diff</span>
              <span className="text-xs text-slate-600 font-mono">{job.repoId}</span>
            </div>
            <DiffViewer diff={diff} />
          </div>
        )}

        {(activeTab === 'split' || activeTab === 'review') && (
          <div className="overflow-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-surface-card border-b border-surface-border">
              <span className="text-xs font-medium text-slate-300">AI Review</span>
              <span className="text-xs text-slate-600">LangChain4j - RAG</span>
            </div>
            <ReviewPanel markdown={job.reviewMarkdown} status={job.status} />
          </div>
        )}
      </div>
    </div>
  )
}
