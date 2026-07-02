import type { JobStatus } from '../lib/types'

interface StatusBadgeProps {
  status: JobStatus
  animated?: boolean
}

const STATUS_CONFIG: Record<JobStatus, { label: string; classes: string; dotClasses: string }> = {
  QUEUED: {
    label: 'Queued',
    classes: 'bg-slate-700/60 text-slate-300 border border-slate-600/50',
    dotClasses: 'bg-slate-400',
  },
  PARSING: {
    label: 'Parsing',
    classes: 'bg-blue-500/10 text-blue-300 border border-blue-500/30',
    dotClasses: 'bg-blue-400',
  },
  IN_PROGRESS: {
    label: 'Analyzing',
    classes: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    dotClasses: 'bg-amber-400',
  },
  COMPLETED: {
    label: 'Completed',
    classes: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    dotClasses: 'bg-emerald-400',
  },
  FAILED: {
    label: 'Failed',
    classes: 'bg-red-500/10 text-red-300 border border-red-500/30',
    dotClasses: 'bg-red-400',
  },
}

export function StatusBadge({ status, animated = true }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  const isActive = status === 'PARSING' || status === 'IN_PROGRESS'
  return (
    <span className={`badge ${cfg.classes}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.dotClasses} ${
          isActive && animated ? 'animate-pulse-ring' : ''
        }`}
      />
      {cfg.label}
    </span>
  )
}
