'use client'

import { JobList } from '../components/JobList'
import { RepoManager } from '../components/RepoManager'
import { Shield, Zap, Database, GitPullRequest } from 'lucide-react'

const STATS = [
  { label: 'Rules Loaded',   value: '10',        icon: Database,       color: 'text-brand-400'  },
  { label: 'Avg Analysis',   value: '~4s',        icon: Zap,            color: 'text-amber-400'  },
  { label: 'Tech Stack',     value: 'WebFlux',    icon: Shield,         color: 'text-violet-400' },
  { label: 'Compliance',     value: 'OWASP+SOC2', icon: GitPullRequest, color: 'text-emerald-400'},
]

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      <div className="mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 badge bg-brand-500/10 text-brand-300 border border-brand-500/30 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-ring" />
          Live - GitHub Webhook Integration
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
          Code Review{' '}
          <span className="gradient-text">Command Center</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Automatic PR analysis triggered by GitHub webhooks, powered by LangChain RAG
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center flex-shrink-0">
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-semibold text-white text-sm">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mb-10">
        <div className="lg:col-span-2">
          <RepoManager />
        </div>
        <div className="lg:col-span-3">
          <JobList />
        </div>
      </div>

    </div>
  )
}
