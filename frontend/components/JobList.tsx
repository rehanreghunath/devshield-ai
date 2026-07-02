'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { AnalysisJob } from '../lib/types'
import { JobCard } from './JobCard'
import { Loader2, RefreshCw, Inbox } from 'lucide-react'

const POLL_INTERVAL_MS = 3000

interface JobListProps {
  initialJobs?: AnalysisJob[]
}

export function JobList({ initialJobs = [] }: JobListProps) {
  const [jobs, setJobs] = useState<AnalysisJob[]>(initialJobs)
  const [loading, setLoading] = useState(initialJobs.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchJobs = useCallback(async () => {
    try {
      const data = await api.jobs.list()
      setJobs(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    const id = setInterval(fetchJobs, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchJobs])

  const activeCount = jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'PARSING' || j.status === 'QUEUED').length

  return (
    <div>
      {/* ── List header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Analysis Jobs</h2>
          {activeCount > 0 && (
            <span className="badge bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-ring" />
              {activeCount} active
            </span>
          )}
        </div>
        <button
          id="refresh-jobs-btn"
          onClick={fetchJobs}
          className="btn-ghost"
          title="Refresh now"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-slate-600 text-xs">
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </button>
      </div>

      {/* ── States ───────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
          <span className="text-sm">Loading jobs…</span>
        </div>
      )}

      {error && (
        <div className="card border-red-500/30 bg-red-500/5 text-center py-8">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button onClick={fetchJobs} className="btn-ghost text-red-400 hover:text-red-300">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center">
            <Inbox className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No jobs yet</p>
          <p className="text-slate-600 text-sm max-w-xs">
            Submit a PR webhook to start your first analysis
          </p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
