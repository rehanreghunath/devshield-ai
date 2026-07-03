'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Shield, AlertTriangle, Loader2 } from 'lucide-react'
import type { JobStatus } from '../lib/types'

interface ReviewPanelProps {
  markdown: string | null
  status: JobStatus
}

export function ReviewPanel({ markdown, status }: ReviewPanelProps) {
  if (status === 'QUEUED' || status === 'PARSING' || status === 'IN_PROGRESS' || status === 'RATE_LIMITED') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 py-20 text-slate-500">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-surface-border flex items-center justify-center">
            <Shield className="w-7 h-7 text-brand-400" />
          </div>
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin absolute -top-1.5 -right-1.5" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium mb-1">
            {status === 'QUEUED' ? 'Queued for analysis...' :
             status === 'RATE_LIMITED' ? 'Rate limited, waiting for capacity...' :
             status === 'PARSING' ? 'Parsing diff...' :
             'AI analysis in progress...'}
          </p>
          <p className="text-sm text-slate-500">
            RAG engine is retrieving compliance rules and generating review
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-ring"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 py-20">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-red-400 font-medium">Analysis failed</p>
        <p className="text-sm text-slate-500">Check backend logs for details</p>
      </div>
    )
  }

  if (!markdown) {
    return (
      <div className="flex items-center justify-center h-full py-20 text-slate-600 text-sm">
        No review available
      </div>
    )
  }

  return (
    <div className="prose prose-invert prose-sm max-w-none p-5 animate-fade-in
                    prose-headings:font-semibold prose-headings:text-white
                    prose-h2:text-base prose-h3:text-sm prose-h4:text-xs
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-li:text-slate-300
                    prose-code:text-brand-300 prose-code:bg-surface-base
                    prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs
                    prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-3
                    prose-blockquote:border-brand-600 prose-blockquote:text-slate-400
                    prose-table:text-sm prose-th:text-slate-300 prose-td:text-slate-400
                    prose-hr:border-surface-border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? '')
            const isInline = !match
            if (isInline) {
              return <code className={className} {...props}>{children}</code>
            }
            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid hsl(222 14% 20%)',
                  fontSize: '0.75rem',
                  margin: 0,
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            )
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
