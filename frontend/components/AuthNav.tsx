'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { LogIn, LogOut } from 'lucide-react'

export function AuthNav() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="w-20 h-8 shimmer-bg rounded-lg" />
  }

  if (!session) {
    return (
      <button
        id="sign-in-btn"
        onClick={() => signIn('github')}
        className="btn-primary !py-1.5 !px-3 !text-sm"
      >
        <LogIn className="w-3.5 h-3.5" />
        Sign in
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-hover">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt=""
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="text-sm text-slate-300 font-medium">
          {session.user?.login || session.user?.name}
        </span>
      </div>
      <button
        id="sign-out-btn"
        onClick={() => signOut()}
        className="btn-ghost !px-2"
        title="Sign out"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
