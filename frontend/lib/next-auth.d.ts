import 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: {
      id: number
      login: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    githubId?: number
    login?: string
    avatarUrl?: string
  }
}
