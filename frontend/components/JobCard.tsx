'use client'

import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import type { AnalysisJob } from '../lib/types'
import { StatusBadge } from './StatusBadge'
import { GitPullRequest, Clock, User, ExternalLink } from 'lucide-react'

interface JobCardProps {
  job: AnalysisJob
}

export function JobCard({ job }: JobCardProps) {
  const router = useRouter()
  const elapsed = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
  const isClickable = job.status === 'COMPLETED' || job.status === 'FAILED'

  return (
    <div
      onClick={() => router.push(`/reviews/${job.id}`)}
      className="card-hover group animate-fade-in"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/reviews/${job.id}`)}
      id={`job-card-${job.id}`}
    >
      {/*  Header  */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface-hover border border-surface-border flex items-center justify-center flex-shrink-0">
            <GitPullRequest className="w-4 h-4 text-brand-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {job.prTitle ?? `PR #${job.prNumber}`}
            </p>
            <p className="text-xs text-slate-500 font-mono truncate">{job.repoId}</p>
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/*  Meta row  */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <GitPullRequest className="w-3 h-3" />
          PR #{job.prNumber}
        </span>
        {job.author && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {job.author}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {elapsed}
        </span>
      </div>

      {/*  Error hint  */}
      {job.status === 'FAILED' && job.errorMessage && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-mono truncate">
          {job.errorMessage}
        </div>
      )}

      {/*  CTA hover  */}
      {isClickable && (
        <div className="mt-3 flex items-center gap-1 text-xs text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3 h-3" />
          View review
        </div>
      )}
    </div>
  )
}
