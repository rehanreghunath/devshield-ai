'use client'

import { useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Plus, Minus, FileCode2 } from 'lucide-react'

interface DiffViewerProps {
  diff: string
  filename?: string
}

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header'
  content: string
  lineNum?: number
}

function parseDiff(diff: string): DiffLine[] {
  const lines = diff.split('\n')
  let addLine = 1
  let removeLine = 1
  const result: DiffLine[] = []

  for (const raw of lines) {
    if (raw.startsWith('@@')) {
      // Parse hunk header: @@ -a,b +c,d @@
      const match = /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(raw)
      if (match) {
        removeLine = parseInt(match[1], 10)
        addLine    = parseInt(match[2], 10)
      }
      result.push({ type: 'header', content: raw })
    } else if (raw.startsWith('+') && !raw.startsWith('+++')) {
      result.push({ type: 'add', content: raw.slice(1), lineNum: addLine++ })
    } else if (raw.startsWith('-') && !raw.startsWith('---')) {
      result.push({ type: 'remove', content: raw.slice(1), lineNum: removeLine++ })
    } else if (!raw.startsWith('---') && !raw.startsWith('+++')) {
      result.push({ type: 'context', content: raw.slice(1) || '', lineNum: addLine++ })
      removeLine++
    }
  }
  return result
}

export function DiffViewer({ diff, filename }: DiffViewerProps) {
  const lines = useMemo(() => parseDiff(diff), [diff])

  if (!diff) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
        No diff available
      </div>
    )
  }

  const lineTypeStyles: Record<DiffLine['type'], string> = {
    add:     'bg-emerald-500/10 text-emerald-200',
    remove:  'bg-red-500/10 text-red-200',
    context: 'text-slate-400',
    header:  'bg-brand-900/30 text-brand-400 font-medium',
  }

  return (
    <div className="h-full flex flex-col">
      {/* ── File header ─────────────────────────────────────── */}
      {filename && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-surface-base/50 text-xs font-mono text-slate-400 flex-shrink-0">
          <FileCode2 className="w-3.5 h-3.5 text-brand-400" />
          {filename}
        </div>
      )}

      {/* ── Diff lines ──────────────────────────────────────── */}
      <div className="flex-1 overflow-auto code-block rounded-none border-0">
        <table className="w-full border-collapse text-xs font-mono">
          <tbody>
            {lines.map((line, idx) => (
              <tr
                key={idx}
                className={`group transition-colors duration-75 hover:brightness-125 ${lineTypeStyles[line.type]}`}
              >
                {/* Line number gutter */}
                <td className="select-none px-3 py-0.5 text-right text-slate-600 border-r border-surface-border w-10 whitespace-nowrap align-top">
                  {line.type !== 'header' && line.lineNum != null ? line.lineNum : ''}
                </td>
                {/* Sign gutter */}
                <td className="select-none px-2 py-0.5 w-5 text-center align-top">
                  {line.type === 'add'    && <Plus  className="w-3 h-3 text-emerald-400 inline" />}
                  {line.type === 'remove' && <Minus className="w-3 h-3 text-red-400    inline" />}
                </td>
                {/* Content */}
                <td className="px-3 py-0.5 whitespace-pre leading-5 align-top w-full">
                  {line.content}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
