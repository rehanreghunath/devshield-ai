'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '../lib/api'
import type { GitHubRepo, WatchedRepo } from '../lib/types'
import { Search, Plus, Minus, Lock, Globe, Loader2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

export function RepoManager() {
  const { data: session } = useSession()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [watched, setWatched] = useState<WatchedRepo[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [copiedRepo, setCopiedRepo] = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState<string | null>(null)

  const token = session?.accessToken

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [repoList, watchedList] = await Promise.all([
        api.user.repos(token),
        api.user.watchedRepos(token),
      ])
      setRepos(repoList)
      setWatched(watchedList)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repos')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const watchedIds = new Set(watched.map(w => w.githubRepoId))

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin.replace(':3000', ':8080')}/api/webhooks/github`
    : 'http://localhost:8080/api/webhooks/github'

  async function toggleRepo(repo: GitHubRepo) {
    if (!token) return
    setTogglingId(repo.id)
    try {
      if (watchedIds.has(repo.id)) {
        await api.user.removeRepo(token, repo.id)
        setWatched(prev => prev.filter(w => w.githubRepoId !== repo.id))
      } else {
        const added = await api.user.addRepo(token, repo.id, repo.full_name)
        setWatched(prev => [...prev, added])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed')
    } finally {
      setTogglingId(null)
    }
  }

  function copyUrl(repoName: string) {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedRepo(repoName)
    setTimeout(() => setCopiedRepo(null), 2000)
  }

  const filtered = repos.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  if (!session) {
    return (
      <div className="card flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center">
          <Lock className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-slate-400 font-medium">Sign in to manage repos</p>
        <p className="text-slate-600 text-sm max-w-xs">
          Connect your GitHub account to add repos for automatic PR analysis
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        <span className="text-sm">Loading repos...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Repositories</h2>
          {watched.length > 0 && (
            <span className="badge bg-brand-500/10 text-brand-300 border border-brand-500/30">
              {watched.length} watched
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="card border-red-500/30 bg-red-500/5 text-center py-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          id="repo-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search repos..."
          className="w-full bg-surface-card border border-surface-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
        />
      </div>

      <div className="grid gap-2 max-h-[480px] overflow-y-auto pr-1">
        {filtered.map(repo => {
          const isWatched = watchedIds.has(repo.id)
          const isToggling = togglingId === repo.id
          return (
            <div key={repo.id} className="card-hover !p-3 group">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-surface-hover border border-surface-border flex items-center justify-center flex-shrink-0">
                    {repo.private
                      ? <Lock className="w-3.5 h-3.5 text-amber-400" />
                      : <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{repo.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {repo.language && <span>{repo.language}</span>}
                      {repo.description && (
                        <span className="truncate max-w-[200px]">{repo.description}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  id={`toggle-repo-${repo.id}`}
                  onClick={() => toggleRepo(repo)}
                  disabled={isToggling}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isWatched
                      ? 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20'
                      : 'bg-brand-500/10 text-brand-300 border border-brand-500/30 hover:bg-brand-500/20'
                  } disabled:opacity-50`}
                >
                  {isToggling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isWatched ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  {isWatched ? 'Remove' : 'Add'}
                </button>
              </div>

              {isWatched && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowSetup(showSetup === repo.full_name ? null : repo.full_name)}
                    className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    {showSetup === repo.full_name ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Webhook setup
                  </button>
                  {showSetup === repo.full_name && (
                    <div className="mt-2 p-3 rounded-lg bg-surface-base border border-surface-border text-xs animate-fade-in">
                      <p className="text-slate-400 mb-2">
                        Go to <span className="text-white font-mono">Settings &gt; Webhooks</span> in your repo and add:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-surface-hover px-2 py-1 rounded text-brand-300 font-mono truncate">
                          {webhookUrl}
                        </code>
                        <button
                          onClick={() => copyUrl(repo.full_name)}
                          className="p-1.5 rounded hover:bg-surface-hover transition-colors text-slate-400 hover:text-white"
                        >
                          {copiedRepo === repo.full_name
                            ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                      <p className="text-slate-600 mt-1.5">
                        Content type: application/json. Events: Pull requests.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            {search ? 'No repos match your search' : 'No repos found'}
          </div>
        )}
      </div>
    </div>
  )
}
