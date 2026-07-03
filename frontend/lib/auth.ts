import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: 'read:user repo' } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        const gh = profile as Record<string, unknown>
        token.githubId = gh.id as number
        token.login = gh.login as string
        token.avatarUrl = gh.avatar_url as string

        // sync user to backend
        const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        try {
          const res = await fetch(`${backendUrl}/api/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              githubId: token.githubId,
              login: token.login,
              name: token.name,
              avatarUrl: token.avatarUrl,
              accessToken: token.accessToken,
            }),
          })
          if (!res.ok) {
            console.error("Backend returned error during sync:", res.status, await res.text())
          }
        } catch (e) {
          console.error("Network error during sync to backend:", e)
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          id: token.githubId as number,
          login: token.login as string,
        },
      }
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
