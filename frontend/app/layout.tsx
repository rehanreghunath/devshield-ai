import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from '../components/SessionProvider'
import { AuthNav } from '../components/AuthNav'

export const metadata: Metadata = {
  title: 'DevShieldAI',
  description: 'AI-powered async code review platform with RAG-based compliance enforcement. Real-time PR analysis against OWASP and SOC2 rules.',
  keywords: ['code review', 'compliance', 'security', 'AI', 'OWASP', 'SOC2'],
  openGraph: {
    title: 'DevShieldAI',
    description: 'Automated Code Review & Compliance',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 border-b border-surface-border bg-surface-base/80 backdrop-blur-md">
              <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2.5 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white tracking-tight">
                    DevShield<span className="gradient-text">AI</span>
                  </span>
                </a>
                <nav className="flex items-center gap-1">
                  <a href="/" className="btn-ghost">Dashboard</a>
                  <AuthNav />
                </nav>
              </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-surface-border mt-auto">
              <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-600">
                <span>&copy; 2026 DevShieldAI</span>
                <span className="font-mono">Spring Boot 3.4 - Next.js 15</span>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
